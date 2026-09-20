package com.example.backend;

import org.springframework.jdbc.core.JdbcTemplate;

public final class TestDatabaseCleaner {
    private TestDatabaseCleaner() {
    }

    public static void clearMarketData(JdbcTemplate jdbc) {
        jdbc.update("delete from daily_prices");
        jdbc.update("delete from stocks");
    }
}
