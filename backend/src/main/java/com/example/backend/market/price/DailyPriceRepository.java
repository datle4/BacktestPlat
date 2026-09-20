package com.example.backend.market.price;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class DailyPriceRepository {
    private final JdbcTemplate jdbc;

    public DailyPriceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<DailyPrice> findByStockAndDateRange(long stockId, LocalDate from, LocalDate to) {
        return jdbc.query("""
                select id, stock_id, trading_date, open_price, high_price, low_price, close_price, volume
                from daily_prices
                where stock_id = ? and trading_date between ? and ?
                order by trading_date
                """, (rs, rowNum) -> new DailyPrice(
                        rs.getLong("id"),
                        rs.getLong("stock_id"),
                        rs.getDate("trading_date").toLocalDate(),
                        rs.getBigDecimal("open_price"),
                        rs.getBigDecimal("high_price"),
                        rs.getBigDecimal("low_price"),
                        rs.getBigDecimal("close_price"),
                        rs.getLong("volume")), stockId, Date.valueOf(from), Date.valueOf(to));
    }

    @Transactional
    public void upsert(long stockId, LocalDate tradingDate, BigDecimal open, BigDecimal high,
            BigDecimal low, BigDecimal close, long volume) {
        int updated = jdbc.update("""
                update daily_prices
                set open_price = ?, high_price = ?, low_price = ?, close_price = ?, volume = ?
                where stock_id = ? and trading_date = ?
                """, open, high, low, close, volume, stockId, Date.valueOf(tradingDate));
        if (updated == 0) {
            jdbc.update("""
                    insert into daily_prices
                        (stock_id, trading_date, open_price, high_price, low_price, close_price, volume)
                    values (?, ?, ?, ?, ?, ?, ?)
                    """, stockId, Date.valueOf(tradingDate), open, high, low, close, volume);
        }
    }

    public long countByStock(long stockId) {
        Long count = jdbc.queryForObject(
                "select count(*) from daily_prices where stock_id = ?", Long.class, stockId);
        return count == null ? 0 : count;
    }
}

