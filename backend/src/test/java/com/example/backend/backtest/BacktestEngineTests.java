package com.example.backend.backtest;

import static org.assertj.core.api.Assertions.*;
import static com.example.backend.quant.SignalAction.*;
import static com.example.backend.backtest.SimulationResult.OrderStatus.*;
import com.example.backend.market.price.DailyPrice;
import com.example.backend.quant.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import org.junit.jupiter.api.Test;

class BacktestEngineTests {
    @Test
    void nextStoredOpenFeesAndDrawdownMatchHandCalculationWithoutFutureHistory() {
        var seen = new ArrayList<Integer>();
        var engine = new BacktestEngine(provider(context -> {
            seen.add(context.history().size());
            return switch (context.history().size()) { case 1 -> BUY; case 2 -> SELL; default -> HOLD; };
        }));
        var result = engine.run("FPT", List.of(bar("2026-01-02", "9", "10", 100),
                bar("2026-01-05", "10", "8", 100), bar("2026-01-06", "12", "12", 100)), bd("1000"), bd("1"));
        assertThat(seen).containsExactly(1, 2, 3);
        assertThat(result.orders()).hasSize(2);
        var buy = result.orders().getFirst();
        assertThat(buy.signalDate()).isEqualTo(LocalDate.parse("2026-01-02"));
        assertThat(buy.executionDate()).isEqualTo(LocalDate.parse("2026-01-05"));
        assertThat(buy.price()).isEqualByComparingTo("10");
        assertThat(buy.quantity()).isEqualTo(99);
        assertThat(buy.fee()).isEqualByComparingTo("9.90");
        assertThat(result.metrics().finalEquity()).isEqualByComparingTo("1176.22");
        assertThat(result.metrics().totalFees()).isEqualByComparingTo("21.78");
        assertThat(result.metrics().totalReturnPercent()).isEqualByComparingTo("17.622");
        assertThat(result.metrics().maxDrawdownPercent()).isEqualByComparingTo("20.79");
        assertThat(result.metrics().realizedPnl()).isEqualByComparingTo("176.22");
        assertThat(result.metrics().unrealizedPnl()).isZero();
        assertThat(result.metrics().completedTrades()).isEqualTo(1);
        assertThat(result.metrics().winRatePercent()).isEqualByComparingTo("100");
    }

    @Test
    void keepsOpenPositionAndDoesNotFillLastSignalBeyondRange() {
        var result = new BacktestEngine(provider(c -> BUY)).run("FPT", twoBars("10", "12", 100), bd("1000"), bd("0"));
        assertThat(result.orders().getLast().status()).isEqualTo(NO_NEXT_SESSION);
        assertThat(result.orders().getLast().executionDate()).isNull();
        assertThat(result.metrics().finalEquity()).isEqualByComparingTo("1200");
        assertThat(result.metrics().unrealizedPnl()).isEqualByComparingTo("200");
        assertThat(result.metrics().openQuantity()).isEqualTo(100);
        assertThat(result.metrics().completedTrades()).isZero();
        assertThat(result.metrics().winRatePercent()).isNull();
    }

    @Test
    void reportsUnfilledOrdersWithoutChangingCash() {
        for (var expected : List.of(INSUFFICIENT_CASH, ZERO_VOLUME, NO_POSITION)) {
            var action = expected == NO_POSITION ? SELL : BUY;
            var result = new BacktestEngine(provider(c -> c.history().size() == 1 ? action : HOLD))
                    .run("FPT", twoBars("10", "12", expected == ZERO_VOLUME ? 0 : 100),
                            bd(expected == INSUFFICIENT_CASH ? "1" : "1000"), bd("0"));
            assertThat(result.orders().getFirst().status()).isEqualTo(expected);
            assertThat(result.metrics().totalFees()).isZero();
            assertThat(result.metrics().netProfit()).isZero();
        }
    }

    @Test
    void alreadyHoldingDoesNotBuyMoreAndAllEquityReconciles() {
        var result = new BacktestEngine(provider(c -> BUY)).run("FPT", List.of(
                bar("2026-01-02", "10", "10", 100), bar("2026-01-05", "10", "9", 100),
                bar("2026-01-06", "8", "11", 100)), bd("1000"), bd("0.15"));
        assertThat(result.orders().get(1).status()).isEqualTo(ALREADY_HOLDING);
        for (var point : result.equity()) {
            assertThat(point.cash()).isNotNegative();
            assertThat(point.equity()).isEqualByComparingTo(point.cash().add(point.marketValue()));
        }
        assertThat(result.metrics().netProfit()).isEqualByComparingTo(result.metrics().realizedPnl().add(result.metrics().unrealizedPnl()));
    }

    @Test
    void feeRoundingCannotOverspendAndFlatStrategyHasZeroMetrics() {
        var portfolio = new Portfolio(bd("1.01495"), bd("1"));
        assertThat(portfolio.buy(bd("1.0049")).status()).isEqualTo(FILLED);
        assertThat(portfolio.cash()).isNotNegative();
        var boundary = new Portfolio(bd("1.00999"), bd("0.5"));
        assertThat(boundary.buy(bd("1.00496")).status()).isEqualTo(INSUFFICIENT_CASH);
        var roundedDown = new Portfolio(bd("1.001"), bd("0.1"));
        assertThat(roundedDown.buy(bd("1.001")).quantity()).isEqualTo(1);
        var result = new BacktestEngine(provider(c -> HOLD)).run("FPT", twoBars("10", "12", 100), bd("1000"), bd("1"));
        assertThat(result.orders()).isEmpty();
        assertThat(result.metrics().netProfit()).isZero();
        assertThat(result.metrics().maxDrawdownPercent()).isZero();
    }

    @Test
    void rejectsMissingSessionsAndInvalidCapital() {
        var engine = new BacktestEngine(provider(c -> HOLD));
        assertThatThrownBy(() -> engine.run("FPT", List.of(bar("2026-01-02", "10", "10", 1)), bd("1000"), bd("0")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> engine.run("FPT", twoBars("10", "12", 1), bd("0"), bd("0")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private QuantSignalProvider provider(java.util.function.Function<SignalContext, SignalAction> action) {
        return new QuantSignalProvider() {
            public String id() { return "test"; }
            public SignalAction evaluate(SignalContext context) { return action.apply(context); }
        };
    }
    private List<DailyPrice> twoBars(String open, String close, long volume) {
        return List.of(bar("2026-01-02", "10", "10", 100), bar("2026-01-05", open, close, volume));
    }
    private DailyPrice bar(String date, String open, String close, long volume) {
        return new DailyPrice(0, 1, LocalDate.parse(date), bd(open), bd(open).max(bd(close)), bd(open).min(bd(close)), bd(close), volume);
    }
    private BigDecimal bd(String value) { return new BigDecimal(value); }
}
