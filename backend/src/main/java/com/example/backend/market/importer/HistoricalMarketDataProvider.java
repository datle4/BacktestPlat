package com.example.backend.market.importer;

import java.time.LocalDate;
import java.util.List;

public interface HistoricalMarketDataProvider {
    List<HistoricalPriceBar> load(String providerSymbol, LocalDate from, LocalDate to);
}
