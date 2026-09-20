package com.example.backend.market.price;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PriceSeriesResponse(
        String symbol,
        LocalDate from,
        LocalDate to,
        LocalDate dataCutoff,
        int count,
        List<PricePoint> prices) {

    public record PricePoint(
            LocalDate date,
            BigDecimal open,
            BigDecimal high,
            BigDecimal low,
            BigDecimal close,
            long volume) {

        static PricePoint from(DailyPrice price) {
            return new PricePoint(price.tradingDate(), price.open(), price.high(), price.low(),
                    price.close(), price.volume());
        }
    }
}

