package com.example.backend.market.stock;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/stocks")
public class StockController {
    private final StockRepository stocks;

    public StockController(StockRepository stocks) {
        this.stocks = stocks;
    }

    @GetMapping
    public List<Stock> list() {
        return stocks.findAll();
    }

    @GetMapping("/{symbol}")
    public Stock get(@PathVariable String symbol) {
        return stocks.findBySymbol(symbol)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy mã cổ phiếu " + symbol.toUpperCase()));
    }
}

