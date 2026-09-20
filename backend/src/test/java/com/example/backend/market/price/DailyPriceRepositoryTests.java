package com.example.backend.market.price;

import static org.assertj.core.api.Assertions.assertThat;
import static com.example.backend.TestDatabaseCleaner.clearMarketData;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.backend.market.stock.Stock;
import com.example.backend.market.stock.StockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class DailyPriceRepositoryTests {
    @Autowired StockRepository stocks;
    @Autowired DailyPriceRepository prices;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void clearExistingData() {
        clearMarketData(jdbc);
    }

    @Test
    void upsertMaintainsOnePricePerStockAndTradingDate() {
        Stock stock = stocks.upsert("FPT", "FPT Corporation", "HOSE");
        LocalDate date = LocalDate.of(2026, 9, 18);

        prices.upsert(stock.id(), date, decimal("100"), decimal("105"), decimal("99"), decimal("104"), 10_000);
        prices.upsert(stock.id(), date, decimal("101"), decimal("106"), decimal("100"), decimal("105"), 12_000);

        assertThat(prices.countByStock(stock.id())).isEqualTo(1);
        DailyPrice saved = prices.findByStockAndDateRange(stock.id(), date, date).getFirst();
        assertThat(saved.open()).isEqualByComparingTo("101");
        assertThat(saved.close()).isEqualByComparingTo("105");
        assertThat(saved.volume()).isEqualTo(12_000);
    }

    @Test
    void dateRangeReturnsOnlyRequestedSessionsInChronologicalOrder() {
        Stock stock = stocks.upsert("VNM", "Vinamilk", "HOSE");
        prices.upsert(stock.id(), LocalDate.of(2026, 9, 17), decimal("60"), decimal("62"), decimal("59"), decimal("61"), 900);
        prices.upsert(stock.id(), LocalDate.of(2026, 9, 18), decimal("61"), decimal("63"), decimal("60"), decimal("62"), 1_000);

        assertThat(prices.findByStockAndDateRange(stock.id(), LocalDate.of(2026, 9, 18), LocalDate.of(2026, 9, 20)))
                .extracting(DailyPrice::tradingDate)
                .containsExactly(LocalDate.of(2026, 9, 18));
    }

    private BigDecimal decimal(String value) {
        return new BigDecimal(value);
    }
}
