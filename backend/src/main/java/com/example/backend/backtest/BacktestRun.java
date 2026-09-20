package com.example.backend.backtest;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BacktestRun(int schemaVersion, UUID id, Instant createdAt, LocalDate dataCutoff,
        BacktestRequest request, SimulationResult simulation) {}
