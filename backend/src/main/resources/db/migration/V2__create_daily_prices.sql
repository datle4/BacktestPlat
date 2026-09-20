create table daily_prices (
    id bigint generated always as identity primary key,
    stock_id bigint not null references stocks(id) on delete cascade,
    trading_date date not null,
    open_price numeric(18, 4) not null,
    high_price numeric(18, 4) not null,
    low_price numeric(18, 4) not null,
    close_price numeric(18, 4) not null,
    volume bigint not null,
    created_at timestamp with time zone not null default current_timestamp,
    constraint daily_prices_stock_date_unique unique (stock_id, trading_date),
    constraint daily_prices_non_negative check (
        open_price >= 0 and high_price >= 0 and low_price >= 0 and close_price >= 0 and volume >= 0
    ),
    constraint daily_prices_price_range check (
        high_price >= open_price and high_price >= close_price and high_price >= low_price
        and low_price <= open_price and low_price <= close_price
    )
);

