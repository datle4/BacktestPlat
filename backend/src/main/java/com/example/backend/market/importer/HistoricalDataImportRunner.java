package com.example.backend.market.importer;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.market-data.import-enabled", havingValue = "true")
public class HistoricalDataImportRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(HistoricalDataImportRunner.class);

    private final HistoricalDataImportService importService;
    private final ConfigurableApplicationContext applicationContext;
    private final LocalDate start;
    private final LocalDate cutoff;

    public HistoricalDataImportRunner(HistoricalDataImportService importService,
            ConfigurableApplicationContext applicationContext,
            @Value("${app.market-data.import-start}") LocalDate start,
            @Value("${app.market-data.cutoff}") LocalDate cutoff) {
        this.importService = importService;
        this.applicationContext = applicationContext;
        this.start = start;
        this.cutoff = cutoff;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Starting one-time historical data import from {} through {}", start, cutoff);
        HistoricalDataImportService.ImportSummary summary = importService.importFixedHistory(start, cutoff);
        log.info("Historical import complete: {} stocks, {} rows, {} inconsistent rows skipped",
                summary.stocks(), summary.rows(), summary.skippedRows());
        SpringApplication.exit(applicationContext);
    }
}
