package com.example.backend.quant;

/** Decides an action at close. Execution, sizing and fees belong to the backtest engine. */
public interface QuantSignalProvider {
    String id();
    SignalAction evaluate(SignalContext context);
}
