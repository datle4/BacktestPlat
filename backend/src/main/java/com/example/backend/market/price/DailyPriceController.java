package com.example.backend.market.price;

import java.time.LocalDate;
import java.util.List;

import com.example.backend.market.stock.Stock;
import com.example.backend.market.stock.StockRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/stocks/{symbol}/prices")
public class DailyPriceController {
    private final StockRepository stocks;
    private final DailyPriceRepository prices;
    private final LocalDate dataCutoff;

    public DailyPriceController(StockRepository stocks, DailyPriceRepository prices,
            @Value("${app.market-data.cutoff:2026-09-20}") String dataCutoff) {
        this.stocks = stocks;
        this.prices = prices;
        this.dataCutoff = LocalDate.parse(dataCutoff);
    }

    @GetMapping
    public PriceSeriesResponse list(
            @PathVariable String symbol,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        if (to.isAfter(dataCutoff)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ngày kết thúc không được sau mốc dữ liệu " + dataCutoff);
        }

        Stock stock = stocks.findBySymbol(symbol)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy mã cổ phiếu " + symbol.toUpperCase()));
        List<PriceSeriesResponse.PricePoint> points = prices
                .findByStockAndDateRange(stock.id(), from, to)
                .stream()
                .map(PriceSeriesResponse.PricePoint::from)
                .toList();
        return new PriceSeriesResponse(stock.symbol(), from, to, dataCutoff, points.size(), points);
    }
}

