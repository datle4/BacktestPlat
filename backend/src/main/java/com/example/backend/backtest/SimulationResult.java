package com.example.backend.backtest;

import com.example.backend.quant.SignalAction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SimulationResult(
        String provider, LocalDate firstSession, LocalDate lastSession, int sessionCount,
        Metrics metrics, List<EquityPoint> equity, List<OrderEvent> orders) {
    public SimulationResult {
        equity = List.copyOf(equity);
        orders = List.copyOf(orders);
    }

    public record EquityPoint(LocalDate date, BigDecimal cash, long quantity,
            BigDecimal marketValue, BigDecimal equity, BigDecimal drawdownPercent) {}

    public enum OrderStatus { FILLED, ALREADY_HOLDING, NO_POSITION, INSUFFICIENT_CASH, ZERO_VOLUME, NO_NEXT_SESSION }

    public record OrderEvent(LocalDate signalDate, LocalDate executionDate, SignalAction action,
            OrderStatus status, long quantity, BigDecimal price, BigDecimal fee,
            BigDecimal cashAfter, BigDecimal realizedPnl) {}

    public record Metrics(BigDecimal finalEquity, BigDecimal netProfit, BigDecimal totalReturnPercent,
            BigDecimal maxDrawdownPercent, BigDecimal totalFees, int completedTrades,
            BigDecimal winRatePercent, BigDecimal realizedPnl, BigDecimal unrealizedPnl,
            BigDecimal cash, long openQuantity, BigDecimal marketValue) {}
}
