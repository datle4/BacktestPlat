-- Immutable result snapshots preserve the inputs and calculations used at run time.
CREATE TABLE backtest_runs (
    id VARCHAR(36) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    result_json TEXT NOT NULL
);
