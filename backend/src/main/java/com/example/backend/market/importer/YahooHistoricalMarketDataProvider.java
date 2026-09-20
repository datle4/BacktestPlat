package com.example.backend.market.importer;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

import am.ik.yfinance4j.Interval;
import am.ik.yfinance4j.YFinance;
import am.ik.yfinance4j.chart.ChartRequest;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class YahooHistoricalMarketDataProvider implements HistoricalMarketDataProvider {
    private static final ZoneId MARKET_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final YFinance yFinance;

    public YahooHistoricalMarketDataProvider() {
        RestClient restClient = RestClient.builder()
                .requestFactory(new JdkClientHttpRequestFactory())
                .defaultHeader("User-Agent", "Mozilla/5.0 BacktestPlat/0.1")
                .build();
        this.yFinance = new YFinance(restClient);
    }

    @Override
    public List<HistoricalPriceBar> load(String providerSymbol, LocalDate from, LocalDate to) {
        ChartRequest request = ChartRequest.builder()
                .start(from.atStartOfDay().toInstant(ZoneOffset.UTC))
                .end(to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC))
                .interval(Interval.ONE_DAY)
                .build();

        return yFinance.ticker(providerSymbol).history(request).stream()
                .map(record -> new HistoricalPriceBar(
                        record.timestamp().atZone(MARKET_ZONE).toLocalDate(),
                        record.open(),
                        record.high(),
                        record.low(),
                        record.close(),
                        record.volume()))
                .filter(bar -> !bar.tradingDate().isBefore(from) && !bar.tradingDate().isAfter(to))
                .sorted(Comparator.comparing(HistoricalPriceBar::tradingDate))
                .toList();
    }
}
