package com.example.backend.backtest;

import com.example.backend.market.stock.StockRepository;
import com.example.backend.market.price.DailyPriceRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BacktestService {
    private final StockRepository stocks;
    private final DailyPriceRepository prices;
    private final BacktestEngine engine;
    private final BacktestRunRepository runs;
    private final LocalDate cutoff;

    public BacktestService(StockRepository stocks, DailyPriceRepository prices, BacktestEngine engine,
            BacktestRunRepository runs, @Value("${app.market-data.cutoff}") LocalDate cutoff) {
        this.stocks = stocks; this.prices = prices; this.engine = engine; this.runs = runs; this.cutoff = cutoff;
    }

    @Transactional
    public BacktestRun create(BacktestRequest request) {
        if (request.from().isBefore(LocalDate.of(2021, 1, 1)) || request.from().isAfter(request.to()) || request.to().isAfter(cutoff)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chọn khoảng ngày hợp lệ từ 2021-01-01 đến " + cutoff);
        }
        var stock = stocks.findBySymbol(request.symbol()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cổ phiếu " + request.symbol()));
        var bars = prices.findByStockAndDateRange(stock.id(), request.from(), request.to());
        if (bars.size() < 2) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Cần ít nhất 2 phiên có dữ liệu trong khoảng đã chọn. Hãy mở rộng khoảng ngày.");
        }
        var simulation = engine.run(stock.symbol(), bars, request.capital(), request.feePercent());
        var run = new BacktestRun(1, UUID.randomUUID(), Instant.now(), cutoff, request, simulation);
        runs.save(run);
        return run;
    }

    @Transactional(readOnly = true)
    public BacktestRun find(UUID id) {
        return runs.find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kết quả backtest"));
    }
}
