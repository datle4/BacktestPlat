-- CI ONLY: synthetic fixture for a fresh, disposable Compose database.
-- Never load this into the imported historical snapshot.
INSERT INTO stocks (symbol, name, exchange) VALUES ('FPT', 'FPT integration fixture', 'HOSE');
INSERT INTO daily_prices (stock_id, trading_date, open_price, high_price, low_price, close_price, volume)
SELECT s.id, v.trading_date, v.price, v.price, v.price, v.price, 10000
FROM stocks s CROSS JOIN (VALUES
  (DATE '2026-01-02', 100000),
  (DATE '2026-01-05', 101000),
  (DATE '2026-01-06', 98000),
  (DATE '2026-01-07', 105000),
  (DATE '2026-01-08', 104000),
  (DATE '2026-01-09', 108000),
  (DATE '2026-01-12', 110000)
) AS v(trading_date, price)
WHERE s.symbol = 'FPT';
