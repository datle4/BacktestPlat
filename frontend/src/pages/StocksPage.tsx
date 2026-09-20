import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { useMarket, number, date } from '@/hooks/useMarket'
import { Change, DataState } from '@/components/PageParts'
import { MarketOverview } from '@/components/MarketOverview'

export function StocksPage() {
  const market = useMarket()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('symbol')
  const [params, setParams] = useSearchParams()
  const selected = params.get('symbol')
  const detail = useRef<HTMLElement>(null)
  useEffect(() => {
    if (selected && !market.pending) {
      detail.current?.focus()
      detail.current?.scrollIntoView({ block: 'start' })
    }
  }, [selected, market.pending])
  const visible = market.rows
    .filter((row) =>
      `${row.symbol} ${row.name}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase().trim()),
    )
    .sort((a, b) =>
      sort === 'volume'
        ? (b.latest?.volume ?? -1) - (a.latest?.volume ?? -1)
        : sort === 'change'
          ? (b.change ?? -Infinity) - (a.change ?? -Infinity)
          : a.symbol.localeCompare(b.symbol),
    )
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Danh sách cổ phiếu</h1>
          <p>
            Tìm hiểu doanh nghiệp qua biến động giá và khối lượng giao dịch.
          </p>
        </div>
        <span className="snapshot">
          {market.rows.length} mã trong bộ theo dõi
        </span>
      </div>
      <section className="panel directory">
        <div className="directory-toolbar">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Tìm cổ phiếu</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã hoặc tên công ty…"
            />
          </label>
          <label className="sort-field">
            Sắp xếp
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="symbol">Mã A–Z</option>
              <option value="volume">Khối lượng cao nhất</option>
              <option value="change">Tăng giá nhiều nhất</option>
            </select>
          </label>
        </div>
        <DataState
          pending={market.pending}
          failed={market.failed}
          empty={!market.rows.length}
          retry={market.retry}
        />
        {!market.pending && !market.failed && market.rows.length > 0 && (
          <>
            <div
              className="table-scroll"
              role="region"
              aria-label="Danh sách cổ phiếu"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Doanh nghiệp</th>
                    <th scope="col">Giá đóng cửa (₫)</th>
                    <th scope="col">Thay đổi</th>
                    <th scope="col">Khối lượng (CP)</th>
                    <th scope="col">Phiên gần nhất</th>
                    <th scope="col">
                      <span className="sr-only">Chi tiết</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={row.symbol}
                      className={selected === row.symbol ? 'selected-row' : ''}
                    >
                      <th scope="row">
                        <button
                          className="company-link"
                          onClick={() => setParams({ symbol: row.symbol })}
                        >
                          <span className="ticker-badge">
                            {row.symbol.slice(0, 1)}
                          </span>
                          <span>
                            <strong>
                              {row.symbol}
                              <small className="exchange">HOSE</small>
                            </strong>
                            <small>{row.name}</small>
                          </span>
                        </button>
                      </th>
                      <td>
                        {row.latest ? number.format(row.latest.close) : '—'}
                      </td>
                      <td>
                        <Change value={row.change} />
                      </td>
                      <td>
                        {row.latest ? number.format(row.latest.volume) : '—'}
                      </td>
                      <td>
                        {row.latest ? date(row.latest.date) : 'Chưa có giá'}
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Xem ${row.symbol}`}
                          onClick={() => setParams({ symbol: row.symbol })}
                        >
                          <ArrowRight size={18} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!visible.length && (
              <p className="empty-search" role="status">
                Không tìm thấy cổ phiếu “{search}”. Hãy thử mã hoặc tên khác.
              </p>
            )}
            <div className="panel-foot">
              <span>
                {visible.length} / {market.rows.length} cổ phiếu
              </span>
              <span>Biến động so với phiên trước có dữ liệu</span>
            </div>
          </>
        )}
      </section>
      {selected && (
        <section
          ref={detail}
          tabIndex={-1}
          className="stock-detail"
          aria-label={`Lịch sử ${selected}`}
        >
          <div className="detail-title">
            <h2>Khám phá {selected}</h2>
            <button className="button secondary" onClick={() => setParams({})}>
              Đóng chi tiết
            </button>
          </div>
          <MarketOverview key={selected} initialSymbol={selected} />
        </section>
      )}
      {!selected && (
        <p className="directory-hint">
          Chọn một mã để xem biểu đồ và lịch sử giá chi tiết.
        </p>
      )}
    </>
  )
}
