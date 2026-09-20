package com.example.backend.backtest;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/backtests")
public class BacktestController {
    private final BacktestService service;

    public BacktestController(BacktestService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<BacktestRun> create(@Valid @RequestBody BacktestRequest request) {
        var run = service.create(request);
        return ResponseEntity.created(URI.create("/api/backtests/" + run.id())).body(run);
    }

    @GetMapping("/{id}")
    public BacktestRun find(@PathVariable UUID id) { return service.find(id); }
}
