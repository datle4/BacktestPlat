package com.example.backend.backtest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import static com.example.backend.backtest.SimulationResult.OrderStatus.*;
import com.example.backend.backtest.SimulationResult.OrderStatus;

/** Single long position, whole shares, no leverage. Money remains decimal throughout. */
final class Portfolio {
    private final BigDecimal feeRate;
    private BigDecimal cash;
    private long quantity;
    private BigDecimal entryCost = BigDecimal.ZERO;
    private BigDecimal fees = BigDecimal.ZERO;
    private BigDecimal realized = BigDecimal.ZERO;
    private int completedTrades;
    private int wins;

    Portfolio(BigDecimal capital, BigDecimal feePercent) {
        this.cash = capital;
        this.feeRate = feePercent.movePointLeft(2);
    }

    Fill buy(BigDecimal price) {
        if (quantity != 0) return Fill.skipped(ALREADY_HOLDING);
        long low = 0;
        long high = cash.divide(price, 0, RoundingMode.DOWN).longValueExact();
        // Find the largest affordable whole-share quantity including the rounded fee.
        while (low < high) {
            long candidate = low + (high - low + 1) / 2;
            BigDecimal principal = price.multiply(BigDecimal.valueOf(candidate));
            if (principal.add(fee(principal)).compareTo(cash) <= 0) low = candidate;
            else high = candidate - 1;
        }
        long shares = low;
        if (shares == 0) return Fill.skipped(INSUFFICIENT_CASH);
        BigDecimal principal = price.multiply(BigDecimal.valueOf(shares));
        BigDecimal fee = fee(principal);
        quantity = shares;
        entryCost = principal.add(fee);
        cash = cash.subtract(entryCost);
        fees = fees.add(fee);
        return new Fill(FILLED, shares, fee, null);
    }

    Fill sell(BigDecimal price) {
        if (quantity == 0) return Fill.skipped(NO_POSITION);
        BigDecimal principal = price.multiply(BigDecimal.valueOf(quantity));
        BigDecimal fee = fee(principal);
        BigDecimal proceeds = principal.subtract(fee);
        BigDecimal pnl = proceeds.subtract(entryCost);
        long shares = quantity;
        cash = cash.add(proceeds);
        fees = fees.add(fee);
        realized = realized.add(pnl);
        completedTrades++;
        if (pnl.signum() > 0) wins++;
        quantity = 0;
        entryCost = BigDecimal.ZERO;
        return new Fill(FILLED, shares, fee, pnl);
    }

    private BigDecimal fee(BigDecimal principal) { return principal.multiply(feeRate).setScale(2, RoundingMode.HALF_UP); }
    BigDecimal cash() { return cash; }
    long quantity() { return quantity; }
    BigDecimal marketValue(BigDecimal close) { return close.multiply(BigDecimal.valueOf(quantity)); }
    BigDecimal fees() { return fees; }
    BigDecimal realized() { return realized; }
    BigDecimal unrealized(BigDecimal close) { return marketValue(close).subtract(entryCost); }
    int completedTrades() { return completedTrades; }
    BigDecimal winRate() { return completedTrades == 0 ? null : PerformanceMetrics.percent(BigDecimal.valueOf(wins), BigDecimal.valueOf(completedTrades)); }

    record Fill(OrderStatus status, long quantity, BigDecimal fee, BigDecimal realizedPnl) {
        static Fill skipped(OrderStatus status) { return new Fill(status, 0, BigDecimal.ZERO, null); }
    }
}
