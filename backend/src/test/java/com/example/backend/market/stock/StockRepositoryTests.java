package com.example.backend.market.stock;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class StockRepositoryTests {
    @Autowired StockRepository stocks;
    @Autowired JdbcTemplate jdbc;

    @Test
    void upsertNormalizesSymbolAndUpdatesMetadataWithoutDuplicating() {
        Stock created = stocks.upsert(" fpt ", "FPT Corporation", "hose");
        Stock updated = stocks.upsert("FPT", "Công ty Cổ phần FPT", "HOSE");

        assertThat(created.id()).isEqualTo(updated.id());
        assertThat(updated.symbol()).isEqualTo("FPT");
        assertThat(updated.name()).isEqualTo("Công ty Cổ phần FPT");
        assertThat(jdbc.queryForObject("select count(*) from stocks where symbol = 'FPT'", Long.class))
                .isEqualTo(1L);
    }

    @Test
    void findAllIsOrderedBySymbol() {
        stocks.upsert("VNM", "Vinamilk", "HOSE");
        stocks.upsert("FPT", "FPT Corporation", "HOSE");

        assertThat(stocks.findAll()).extracting(Stock::symbol).containsExactly("FPT", "VNM");
    }
}

