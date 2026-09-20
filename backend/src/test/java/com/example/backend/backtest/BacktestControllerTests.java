package com.example.backend.backtest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;
import static com.example.backend.TestDatabaseCleaner.clearMarketData;
import com.example.backend.market.stock.StockRepository;
import com.example.backend.market.price.DailyPriceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BacktestControllerTests {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired StockRepository stocks;
    @Autowired DailyPriceRepository prices;
    @Autowired ObjectMapper json;
    long stockId;

    @BeforeEach
    void prepare() {
        jdbc.update("delete from backtest_runs");
        clearMarketData(jdbc);
        stockId = stocks.upsert("FPT", "FPT", "HOSE").id();
        for (int i = 0; i < 7; i++) {
            var price = BigDecimal.valueOf(100 + i);
            prices.upsert(stockId, LocalDate.of(2026, 1, 2).plusDays(i), price, price, price, price, 1000);
        }
    }

    @Test
    void createsReloadableImmutableResultWithCanonicalSymbolAndSameAccounting() throws Exception {
        var response = mvc.perform(post("/api/backtests").contentType(MediaType.APPLICATION_JSON)
                .content(request(" fpt ", "2026-01-01", "2026-01-10", "100000", "0.15")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.request.symbol").value("FPT"))
                .andExpect(jsonPath("$.schemaVersion").value(1))
                .andExpect(jsonPath("$.simulation.provider").value("mock-cycle-v1"))
                .andExpect(jsonPath("$.simulation.orders.length()").value(2))
                .andExpect(jsonPath("$.simulation.metrics.completedTrades").value(1))
                .andReturn().getResponse();
        String location = response.getHeader("Location");
        assertThat(location).startsWith("/api/backtests/");
        // Changing source data later must not recalculate an existing run.
        jdbc.update("delete from daily_prices where stock_id = ?", stockId);
        String stored = mvc.perform(get(location)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(stored)).isEqualTo(json.readTree(response.getContentAsString()));
        assertThat(jdbc.queryForObject("select count(*) from backtest_runs", Integer.class)).isEqualTo(1);
    }

    @Test
    void validatesDatesCapitalFeesSymbolAndMalformedJsonWithoutSaving() throws Exception {
        for (String body : java.util.List.of(
                request("FPT", "2026-01-10", "2026-01-01", "100", "0"),
                request("FPT", "2020-01-01", "2026-01-10", "100", "0"),
                request("FPT", "2026-01-01", "2026-09-21", "100", "0"),
                request("FPT", "2026-01-01", "2026-01-10", "0", "0"),
                request("FPT", "2026-01-01", "2026-01-10", "1000000000001", "0"),
                request("FPT", "2026-01-01", "2026-01-10", "100.001", "0"),
                request("FPT", "2026-01-01", "2026-01-10", "100", "-1"),
                request("FPT", "2026-01-01", "2026-01-10", "100", "5.01"),
                request("FPT", "2026-01-01", "2026-01-10", "100", "0.001"),
                request("", "2026-01-01", "2026-01-10", "100", "0"), "{}", "{bad")) {
            mvc.perform(post("/api/backtests").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").isNotEmpty());
        }
        assertThat(jdbc.queryForObject("select count(*) from backtest_runs", Integer.class)).isZero();
    }

    @Test
    void handlesMissingStockInsufficientDataAndUnknownRun() throws Exception {
        mvc.perform(post("/api/backtests").contentType(MediaType.APPLICATION_JSON)
                .content(request("XYZ", "2026-01-01", "2026-01-10", "1000", "0"))).andExpect(status().isNotFound());
        mvc.perform(post("/api/backtests").contentType(MediaType.APPLICATION_JSON)
                .content(request("FPT", "2026-01-02", "2026-01-02", "1000", "0")))
                .andExpect(status().isUnprocessableContent());
        mvc.perform(get("/api/backtests/00000000-0000-0000-0000-000000000000")).andExpect(status().isNotFound());
        mvc.perform(get("/api/backtests/not-a-uuid")).andExpect(status().isBadRequest());
    }

    private String request(String symbol, String from, String to, String capital, String fee) {
        return """
                {"symbol":"%s","from":"%s","to":"%s","capital":%s,"feePercent":%s}
                """.formatted(symbol, from, to, capital, fee);
    }
}
