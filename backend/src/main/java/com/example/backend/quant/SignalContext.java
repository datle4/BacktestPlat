package com.example.backend.quant;

import com.example.backend.market.price.DailyPrice;
import java.util.List;

/** Only completed bars up to the signal date; callers must never include future bars. */
public record SignalContext(String symbol, List<DailyPrice> history) {
    public SignalContext {
        if (symbol == null || symbol.isBlank() || history == null || history.isEmpty()) {
            throw new IllegalArgumentException("A symbol and at least one completed bar are required");
        }
        history = List.copyOf(history);
        for (int i = 1; i < history.size(); i++) {
            if (!history.get(i).tradingDate().isAfter(history.get(i - 1).tradingDate())) {
                throw new IllegalArgumentException("Bars must have unique, ascending trading dates");
            }
        }
    }
}
