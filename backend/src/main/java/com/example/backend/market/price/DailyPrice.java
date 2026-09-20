package com.example.backend.market.price;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyPrice(
        long id,
        long stockId,
        LocalDate tradingDate,
        BigDecimal open,
        BigDecimal high,
        BigDecimal low,
        BigDecimal close,
        long volume) {
}

