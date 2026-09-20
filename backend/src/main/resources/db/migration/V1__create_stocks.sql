create table stocks (
    id bigint generated always as identity primary key,
    symbol text not null,
    name text not null,
    exchange text not null,
    created_at timestamp with time zone not null default current_timestamp,
    constraint stocks_symbol_unique unique (symbol),
    constraint stocks_symbol_format check (symbol = upper(symbol) and length(symbol) between 1 and 12),
    constraint stocks_exchange_check check (exchange in ('HOSE', 'HNX', 'UPCOM'))
);

