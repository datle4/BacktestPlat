package com.example.backend.market.importer;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HistoricalPriceBar(
        LocalDate tradingDate,
        BigDecimal open,
        BigDecimal high,
        BigDecimal low,
        BigDecimal close,
        long volume) {
}
