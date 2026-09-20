import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getPriceSeries } from '@/api/marketData'
import { PriceChart } from '@/components/PriceChart'
import { Change, DataState } from '@/components/PageParts'
import { CUTOFF, START, date, number, compact } from '@/hooks/useMarket'

export function MarketOverview({ initialSymbol }: { initialSymbol: string }) {
  const [from, setFrom] = useState(START)
  const [to, setTo] = useState(CUTOFF)
  const [range, setRange] = useState({ from: START, to: CUTOFF })
  const query = useQuery({
    queryKey: ['prices', initialSymbol, range.from, range.to],
    queryFn: () => getPriceSeries(initialSymbol, range.from, range.to),
  })
  const prices = query.data?.prices ?? []
  const first = prices.at(0)
  const latest = prices.at(-1)
  const invalid = from > to
  function apply(event: FormEvent) {
    event.preventDefault()
    if (invalid) return
    if (from === range.from && to === range.to) {
      void query.refetch()
    } else setRange({ from, to })
  }
  return (
    <>
      <form
        className="market-filters"
        onSubmit={apply}
        aria-label="Bộ lọc dữ liệu lịch sử"
      >
        <label>
          Từ ngày
          <input
            type="date"
            value={from}
            min="2021-01-01"
            max={CUTOFF}
            required
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={to}
            min="2021-01-01"
            max={CUTOFF}
            required
            aria-invalid={invalid}
            aria-describedby={invalid ? 'detail-range-error' : undefined}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <button className="button" disabled={invalid || query.isFetching}>
          {query.isFetching ? 'Đang tải…' : 'Xem dữ liệu'}
        </button>
        {invalid && (
          <p id="detail-range-error" className="negative" role="alert">
            Ngày kết thúc phải từ ngày bắt đầu trở đi.
          </p>
        )}
      </form>
      <DataState
        pending={query.isPending}
        failed={query.isError}
        empty={false}
        retry={() => {
          void query.refetch()
        }}
      />
      {!query.isPending && !query.isError && !prices.length && (
        <div className="state-panel">
          <h3>Không có phiên trong khoảng đã chọn</h3>
          <p>Hãy mở rộng khoảng ngày để xem lịch sử {initialSymbol}.</p>
        </div>
      )}
      {!query.isPending && !query.isError && first && latest && (
        <>
          <dl className="overview-stats detail-stats">
            <div>
              <dt>Đóng cửa gần nhất</dt>
              <dd>
                {number.format(latest.close)}
                <small> ₫</small>
              </dd>
              <dd className="stat-note">{date(latest.date)}</dd>
            </div>
            <div>
              <dt>Biến động kỳ</dt>
              <dd>
                <Change
                  value={
                    first.close ? (latest.close / first.close - 1) * 100 : null
                  }
                />
              </dd>
              <dd className="stat-note">So với phiên đầu kỳ</dd>
            </div>
            <div>
              <dt>Khối lượng trung bình</dt>
              <dd>
                {compact.format(
                  prices.reduce((sum, bar) => sum + bar.volume, 0) /
                    prices.length,
                )}
                <small> CP</small>
              </dd>
              <dd className="stat-note">
                {prices.length} phiên trong khoảng chọn
              </dd>
            </div>
          </dl>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Lịch sử giá {initialSymbol}</h3>
                <p>Giá đóng cửa · VND</p>
              </div>
              <span className="muted">
                {date(range.from)} – {date(range.to)}
              </span>
            </div>
            <PriceChart prices={prices} symbol={initialSymbol} />
          </section>
          <section className="panel price-table-section">
            <div className="panel-heading">
              <div>
                <h3>12 phiên gần nhất</h3>
                <p>Giá OHLC · VND · Khối lượng: cổ phiếu</p>
              </div>
            </div>
            <div
              className="table-scroll"
              role="region"
              aria-label="Bảng lịch sử giá"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {[
                      'Ngày',
                      'Mở cửa',
                      'Cao',
                      'Thấp',
                      'Đóng cửa',
                      'Khối lượng',
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prices
                    .slice(-12)
                    .reverse()
                    .map((bar) => (
                      <tr key={bar.date}>
                        <th scope="row">{date(bar.date)}</th>
                        <td>{number.format(bar.open)}</td>
                        <td>{number.format(bar.high)}</td>
                        <td>{number.format(bar.low)}</td>
                        <td className="close-cell">
                          {number.format(bar.close)}
                        </td>
                        <td>{number.format(bar.volume)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  )
}
