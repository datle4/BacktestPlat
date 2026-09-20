package com.example.backend.quant;

import static org.assertj.core.api.Assertions.*;
import com.example.backend.market.price.DailyPrice;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import org.junit.jupiter.api.Test;

class MockQuantSignalProviderTests {
    @Test
    void repeatsBuyAndSellEveryTenAvailableSessions() {
        var provider = new MockQuantSignalProvider();
        var history = new ArrayList<DailyPrice>();
        for (int i = 0; i < 21; i++) {
            history.add(bar(i));
            var expected = i % 10 == 0 ? SignalAction.BUY : i % 10 == 5 ? SignalAction.SELL : SignalAction.HOLD;
            assertThat(provider.evaluate(new SignalContext("FPT", history))).isEqualTo(expected);
        }
    }

    @Test
    void contextTakesImmutableSnapshotAndRejectsUnorderedBars() {
        var history = new ArrayList<DailyPrice>();
        history.add(bar(0));
        var context = new SignalContext("FPT", history);
        history.add(bar(1));
        assertThat(context.history()).hasSize(1);
        assertThatThrownBy(() -> context.history().add(bar(2))).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> new SignalContext("FPT", java.util.List.of(bar(1), bar(0))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new SignalContext("FPT", java.util.List.of(bar(0), bar(0))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private DailyPrice bar(int day) {
        return new DailyPrice(day, 1, LocalDate.of(2026, 1, 1).plusDays(day),
                BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, 100);
    }
}
