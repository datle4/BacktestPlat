package com.example.backend.market.price;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.backend.market.stock.Stock;
import com.example.backend.market.stock.StockRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DailyPriceControllerTests {
    @Autowired MockMvc mvc;
    @Autowired StockRepository stocks;
    @Autowired DailyPriceRepository prices;

    @Test
    void returnsChronologicalPriceSeriesWithCutoffMetadata() throws Exception {
        Stock stock = stocks.upsert("FPT", "FPT Corporation", "HOSE");
        prices.upsert(stock.id(), LocalDate.of(2026, 9, 18), decimal("100"), decimal("105"),
                decimal("99"), decimal("104"), 10_000);

        mvc.perform(get("/api/stocks/fpt/prices")
                        .queryParam("from", "2026-09-01")
                        .queryParam("to", "2026-09-20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("FPT"))
                .andExpect(jsonPath("$.dataCutoff").value("2026-09-20"))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.prices[0].date").value("2026-09-18"))
                .andExpect(jsonPath("$.prices[0].close").value(104));
    }

    @Test
    void rejectsInvertedDateRangeWithReadableProblem() throws Exception {
        mvc.perform(get("/api/stocks/FPT/prices")
                        .queryParam("from", "2026-09-20")
                        .queryParam("to", "2026-09-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc"));
    }

    @Test
    void rejectsDatesAfterFixedCutoff() throws Exception {
        mvc.perform(get("/api/stocks/FPT/prices")
                        .queryParam("from", "2026-09-01")
                        .queryParam("to", "2026-09-21"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Ngày kết thúc không được sau mốc dữ liệu 2026-09-20"));
    }

    private BigDecimal decimal(String value) {
        return new BigDecimal(value);
    }
}

