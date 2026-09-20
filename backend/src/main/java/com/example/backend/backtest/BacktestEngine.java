package com.example.backend.backtest;

import com.example.backend.market.price.DailyPrice;
import com.example.backend.quant.QuantSignalProvider;
import com.example.backend.quant.SignalAction;
import com.example.backend.quant.SignalContext;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;
import static com.example.backend.backtest.SimulationResult.*;

@Component
public class BacktestEngine {
    private final QuantSignalProvider provider;

    public BacktestEngine(QuantSignalProvider provider) { this.provider = provider; }

    public SimulationResult run(String symbol, List<DailyPrice> prices, BigDecimal capital, BigDecimal feePercent) {
        if (prices.size() < 2 || capital.signum() <= 0 || feePercent.signum() < 0 || feePercent.compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new IllegalArgumentException("At least two sessions, positive capital and fees between 0 and 5% are required");
        }
        new SignalContext(symbol, prices); // Validate dates before any execution.
        for (var bar : prices) {
            if (bar.open().signum() <= 0 || bar.close().signum() <= 0 || bar.volume() < 0) {
                throw new IllegalArgumentException("Prices must be positive and volume non-negative");
            }
        }
        var portfolio = new Portfolio(capital, feePercent);
        var performance = new PerformanceMetrics(capital);
        var equity = new ArrayList<EquityPoint>();
        var orders = new ArrayList<OrderEvent>();
        SignalAction pending = SignalAction.HOLD;
        for (int i = 0; i < prices.size(); i++) {
            var bar = prices.get(i);
            if (pending != SignalAction.HOLD) {
                var fill = bar.volume() == 0 ? Portfolio.Fill.skipped(OrderStatus.ZERO_VOLUME)
                        : pending == SignalAction.BUY ? portfolio.buy(bar.open()) : portfolio.sell(bar.open());
                orders.add(new OrderEvent(prices.get(i - 1).tradingDate(), bar.tradingDate(), pending,
                        fill.status(), fill.quantity(), fill.status() == OrderStatus.FILLED ? bar.open() : null,
                        fill.fee(), portfolio.cash(), fill.realizedPnl()));
            }
            BigDecimal marketValue = portfolio.marketValue(bar.close());
            BigDecimal value = portfolio.cash().add(marketValue);
            equity.add(new EquityPoint(bar.tradingDate(), portfolio.cash(), portfolio.quantity(), marketValue,
                    value, performance.observe(value)));
            // Only the history prefix is visible to the provider, after today's close.
            pending = Objects.requireNonNull(provider.evaluate(new SignalContext(symbol, prices.subList(0, i + 1))),
                    "Quant provider returned no action");
            if (i == prices.size() - 1 && pending != SignalAction.HOLD) {
                orders.add(new OrderEvent(bar.tradingDate(), null, pending, OrderStatus.NO_NEXT_SESSION,
                        0, null, BigDecimal.ZERO, portfolio.cash(), null));
            }
        }
        var last = prices.getLast();
        BigDecimal value = equity.getLast().equity();
        var metrics = new Metrics(value, value.subtract(capital), PerformanceMetrics.percent(value.subtract(capital), capital),
                performance.maxDrawdown(), portfolio.fees(), portfolio.completedTrades(), portfolio.winRate(),
                portfolio.realized(), portfolio.unrealized(last.close()), portfolio.cash(), portfolio.quantity(), portfolio.marketValue(last.close()));
        return new SimulationResult(provider.id(), prices.getFirst().tradingDate(), last.tradingDate(), prices.size(), metrics, equity, orders);
    }
}
