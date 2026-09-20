package com.example.backend.market.importer;

import java.time.LocalDate;
import java.util.List;

import com.example.backend.market.price.DailyPriceRepository;
import com.example.backend.market.stock.Stock;
import com.example.backend.market.stock.StockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class HistoricalDataImportService {
    private static final Logger log = LoggerFactory.getLogger(HistoricalDataImportService.class);
    private static final List<StockSource> SOURCES = List.of(
            new StockSource("FPT", "FPT Corporation", "HOSE", "FPT.VN"),
            new StockSource("HPG", "Hoa Phat Group", "HOSE", "HPG.VN"),
            new StockSource("TCB", "Techcombank", "HOSE", "TCB.VN"),
            new StockSource("VIC", "Vingroup", "HOSE", "VIC.VN"),
            new StockSource("VNM", "Vinamilk", "HOSE", "VNM.VN"));

    private final HistoricalMarketDataProvider provider;
    private final StockRepository stocks;
    private final DailyPriceRepository prices;

    public HistoricalDataImportService(HistoricalMarketDataProvider provider, StockRepository stocks,
            DailyPriceRepository prices) {
        this.provider = provider;
        this.stocks = stocks;
        this.prices = prices;
    }

    public ImportSummary importFixedHistory(LocalDate from, LocalDate cutoff) {
        if (from.isAfter(cutoff)) {
            throw new IllegalArgumentException("Import start date must not be after the data cutoff");
        }

        int importedRows = 0;
        int skippedRows = 0;
        for (StockSource source : SOURCES) {
            List<HistoricalPriceBar> bars = provider.load(source.providerSymbol(), from, cutoff);
            PersistResult result = persist(source, bars, from, cutoff);
            importedRows += result.importedRows();
            skippedRows += result.skippedRows();
        }
        return new ImportSummary(SOURCES.size(), importedRows, skippedRows, from, cutoff);
    }

    PersistResult persist(StockSource source, List<HistoricalPriceBar> bars, LocalDate from, LocalDate cutoff) {
        Stock stock = stocks.upsert(source.symbol(), source.name(), source.exchange());
        int importedRows = 0;
        int skippedRows = 0;
        for (HistoricalPriceBar bar : bars) {
            validateDate(bar, from, cutoff);
            if (!hasValidOhlcv(bar)) {
                skippedRows++;
                log.warn("Skipping inconsistent {} price from provider: {}", source.symbol(), bar);
                continue;
            }
            prices.upsert(stock.id(), bar.tradingDate(), bar.open(), bar.high(), bar.low(),
                    bar.close(), bar.volume());
            importedRows++;
        }
        return new PersistResult(importedRows, skippedRows);
    }

    private void validateDate(HistoricalPriceBar bar, LocalDate from, LocalDate cutoff) {
        if (bar.tradingDate().isBefore(from) || bar.tradingDate().isAfter(cutoff)) {
            throw new IllegalArgumentException("Provider returned a price outside the configured range");
        }
    }

    private boolean hasValidOhlcv(HistoricalPriceBar bar) {
        if (bar.open() == null || bar.high() == null || bar.low() == null || bar.close() == null) {
            return false;
        }
        if (bar.open().signum() <= 0 || bar.high().signum() <= 0 || bar.low().signum() <= 0
                || bar.close().signum() <= 0 || bar.volume() < 0) {
            return false;
        }
        return !(bar.high().compareTo(bar.open()) < 0 || bar.high().compareTo(bar.close()) < 0
                || bar.high().compareTo(bar.low()) < 0 || bar.low().compareTo(bar.open()) > 0
                || bar.low().compareTo(bar.close()) > 0);
    }

    record StockSource(String symbol, String name, String exchange, String providerSymbol) {
    }

    record PersistResult(int importedRows, int skippedRows) {
    }

    public record ImportSummary(int stocks, int rows, int skippedRows, LocalDate from, LocalDate cutoff) {
    }
}
