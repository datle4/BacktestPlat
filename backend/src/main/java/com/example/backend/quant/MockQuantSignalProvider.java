package com.example.backend.quant;

import org.springframework.stereotype.Component;

/** A repeatable plumbing test, not an investment strategy or a predictive model. */
@Component
public class MockQuantSignalProvider implements QuantSignalProvider {
    @Override
    public String id() {
        return "mock-cycle-v1";
    }

    @Override
    public SignalAction evaluate(SignalContext context) {
        return switch ((context.history().size() - 1) % 10) {
            case 0 -> SignalAction.BUY;
            case 5 -> SignalAction.SELL;
            default -> SignalAction.HOLD;
        };
    }
}
