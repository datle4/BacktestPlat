package com.example.backend.market.importer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static com.example.backend.TestDatabaseCleaner.clearMarketData;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.example.backend.market.price.DailyPriceRepository;
import com.example.backend.market.stock.StockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Import(HistoricalDataImportServiceTests.ProviderConfiguration.class)
@Transactional
class HistoricalDataImportServiceTests {
    @Autowired HistoricalDataImportService service;
    @Autowired RecordingProvider provider;
    @Autowired StockRepository stocks;
    @Autowired DailyPriceRepository prices;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void resetProvider() {
        provider.requests.clear();
        provider.result = List.of();
        clearMarketData(jdbc);
    }

    @Test
    void importsFifteenConfiguredVietnameseStocksThroughTheFixedCutoffIdempotently() {
        LocalDate from = LocalDate.of(2026, 9, 17);
        LocalDate cutoff = LocalDate.of(2026, 9, 20);
        provider.result = List.of(bar(LocalDate.of(2026, 9, 18)));

        HistoricalDataImportService.ImportSummary result = service.importFixedHistory(from, cutoff);

        assertThat(result.stocks()).isEqualTo(15);
        assertThat(result.rows()).isEqualTo(15);
        assertThat(result.skippedRows()).isZero();
        assertThat(provider.requests).hasSize(15)
                .allSatisfy(request -> {
                    assertThat(request.from()).isEqualTo(from);
                    assertThat(request.to()).isEqualTo(cutoff);
                    assertThat(request.providerSymbol()).endsWith(".VN");
                });
        assertThat(stocks.findAll()).extracting("symbol")
                .containsExactly("ACB", "FPT", "GAS", "HPG", "MBB", "MSN", "MWG", "PLX",
                        "PNJ", "SSI", "TCB", "VCB", "VHM", "VIC", "VNM");
        assertThat(provider.requests).extracting(RecordingProvider.Request::providerSymbol)
                .doesNotHaveDuplicates();
        service.importFixedHistory(from, cutoff);
        assertThat(stocks.findAll()).hasSize(15);
        assertThat(stocks.findAll())
                .allSatisfy(stock -> assertThat(prices.countByStock(stock.id())).isEqualTo(1));
    }

    @Test
    void skipsInconsistentOhlcvWithoutInventingAReplacementBar() {
        LocalDate cutoff = LocalDate.of(2026, 9, 20);
        provider.result = List.of(new HistoricalPriceBar(
                LocalDate.of(2026, 9, 18), decimal("100"), decimal("101"),
                decimal("99"), decimal("102"), 1_000));

        HistoricalDataImportService.ImportSummary result = service.importFixedHistory(
                LocalDate.of(2026, 9, 1), cutoff);

        assertThat(result.rows()).isZero();
        assertThat(result.skippedRows()).isEqualTo(15);
        assertThat(stocks.findAll()).allSatisfy(stock ->
                assertThat(prices.countByStock(stock.id())).isZero());
    }

    @Test
    void rejectsProviderRowsAfterTheCutoffBeforeWritingPrices() {
        LocalDate cutoff = LocalDate.of(2026, 9, 20);
        provider.result = List.of(bar(cutoff.plusDays(1)));

        assertThatThrownBy(() -> service.importFixedHistory(LocalDate.of(2026, 9, 1), cutoff))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("outside the configured range");
        assertThat(stocks.findAll()).allSatisfy(stock ->
                assertThat(prices.countByStock(stock.id())).isZero());
    }

    private HistoricalPriceBar bar(LocalDate date) {
        return new HistoricalPriceBar(date, decimal("100"), decimal("105"), decimal("99"),
                decimal("104"), 1_000);
    }

    private BigDecimal decimal(String value) {
        return new BigDecimal(value);
    }

    @TestConfiguration
    static class ProviderConfiguration {
        @Bean
        @Primary
        RecordingProvider recordingProvider() {
            return new RecordingProvider();
        }
    }

    static class RecordingProvider implements HistoricalMarketDataProvider {
        private final List<Request> requests = new ArrayList<>();
        private List<HistoricalPriceBar> result = List.of();

        @Override
        public List<HistoricalPriceBar> load(String providerSymbol, LocalDate from, LocalDate to) {
            requests.add(new Request(providerSymbol, from, to));
            return result;
        }

        record Request(String providerSymbol, LocalDate from, LocalDate to) {
        }
    }
}
