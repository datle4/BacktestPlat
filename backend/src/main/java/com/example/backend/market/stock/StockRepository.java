package com.example.backend.market.stock;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class StockRepository {
    private final JdbcTemplate jdbc;

    public StockRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Stock> findAll() {
        return jdbc.query("""
                select id, symbol, name, exchange
                from stocks
                order by symbol
                """, (rs, rowNum) -> map(rs.getLong("id"), rs.getString("symbol"),
                rs.getString("name"), rs.getString("exchange")));
    }

    public Optional<Stock> findBySymbol(String symbol) {
        return jdbc.query("""
                select id, symbol, name, exchange
                from stocks
                where symbol = ?
                """, (rs, rowNum) -> map(rs.getLong("id"), rs.getString("symbol"),
                rs.getString("name"), rs.getString("exchange")), symbol.toUpperCase())
                .stream().findFirst();
    }

    @Transactional
    public Stock upsert(String symbol, String name, String exchange) {
        String normalizedSymbol = symbol.strip().toUpperCase();
        String normalizedExchange = exchange.strip().toUpperCase();
        int updated = jdbc.update("""
                update stocks
                set name = ?, exchange = ?
                where symbol = ?
                """, name.strip(), normalizedExchange, normalizedSymbol);
        if (updated == 0) {
            jdbc.update("""
                    insert into stocks (symbol, name, exchange)
                    values (?, ?, ?)
                    """, normalizedSymbol, name.strip(), normalizedExchange);
        }
        return findBySymbol(normalizedSymbol).orElseThrow();
    }

    private Stock map(long id, String symbol, String name, String exchange) {
        return new Stock(id, symbol, name, exchange);
    }
}
