package com.example.backend.backtest;

import java.math.BigDecimal;
import java.math.RoundingMode;

final class PerformanceMetrics {
    private BigDecimal peak;
    private BigDecimal maxDrawdown = BigDecimal.ZERO;

    PerformanceMetrics(BigDecimal initialCapital) { peak = initialCapital; }

    BigDecimal observe(BigDecimal equity) {
        peak = peak.max(equity);
        BigDecimal drawdown = percent(peak.subtract(equity), peak);
        maxDrawdown = maxDrawdown.max(drawdown);
        return drawdown;
    }

    BigDecimal maxDrawdown() { return maxDrawdown; }

    static BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
        return numerator.multiply(BigDecimal.valueOf(100)).divide(denominator, 6, RoundingMode.HALF_UP);
    }
}
