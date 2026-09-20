import { useState } from 'react'
import type { BacktestRun, OrderStatus } from '@/api/backtests'
import { EquityChart } from './EquityChart'
import { date, number, percent } from '@/hooks/useMarket'

const statusLabels: Record<OrderStatus, string> = {
  FILLED: 'Đã khớp',
  ALREADY_HOLDING: 'Đang giữ cổ phiếu',
  NO_POSITION: 'Không có vị thế',
  INSUFFICIENT_CASH: 'Không đủ tiền',
  ZERO_VOLUME: 'Phiên không có khối lượng',
  NO_NEXT_SESSION: 'Hết phiên trong khoảng',
}
export function BacktestResults({ run }: { run: BacktestRun }) {
  const [page, setPage] = useState(0)
  const {
    metrics: m,
    equity,
    orders,
    firstSession,
    lastSession,
    sessionCount,
  } = run.simulation
  const pages = Math.max(1, Math.ceil(orders.length / 10))
  const cash = (value: number) => `${number.format(value)} ₫`
  return (
    <section
      className="backtest-results"
      aria-labelledby="backtest-result"
      id="results"
    >
      <div className="result-heading">
        <div>
          <span className="eyebrow">KẾT QUẢ ĐÃ LƯU · MOCK QUANT</span>
          <h2 id="backtest-result">
            {run.request.symbol} · Báo cáo thử nghiệm
          </h2>
          <p>
            {date(firstSession)} — {date(lastSession)} ·{' '}
            {number.format(sessionCount)} phiên có dữ liệu
          </p>
        </div>
        <a className="button secondary" href={`?run=${run.id}#results`}>
          Liên kết kết quả
        </a>
      </div>
      <p className="result-inputs">
        Vốn {cash(run.request.capital)} · Phí{' '}
        {number.format(run.request.feePercent)}% mỗi chiều · Khoảng yêu cầu{' '}
        {date(run.request.from)} — {date(run.request.to)}
      </p>
      <div className="result-metrics">
        <article>
          <span>Giá trị cuối kỳ</span>
          <strong>{cash(m.finalEquity)}</strong>
          <small>Tiền mặt + cổ phiếu theo giá đóng cửa</small>
        </article>
        <article>
          <span>Lợi nhuận sau phí</span>
          <strong className={m.netProfit < 0 ? 'negative' : 'positive'}>
            {percent(m.totalReturnPercent)}
          </strong>
          <small>
            {m.netProfit > 0 ? '+' : ''}
            {cash(m.netProfit)}
          </small>
        </article>
        <article>
          <span>Sụt giảm tối đa</span>
          <strong>{number.format(m.maxDrawdownPercent)}%</strong>
          <small>Tính từ đỉnh vốn, theo giá cuối phiên</small>
        </article>
        <article>
          <span>Tỷ lệ thắng</span>
          <strong>
            {m.winRatePercent === null
              ? '—'
              : `${number.format(m.winRatePercent)}%`}
          </strong>
          <small>
            {m.completedTrades
              ? `${m.completedTrades} vòng mua–bán đã hoàn tất`
              : 'Chưa có vòng mua–bán hoàn tất'}
          </small>
        </article>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Diễn biến tài khoản</h3>
            <p>Rê chuột hoặc dùng thanh chọn để đọc từng phiên</p>
          </div>
          <span className="tag">VND</span>
        </div>
        <EquityChart points={equity} capital={run.request.capital} />
      </section>
      <section className="panel portfolio-summary">
        <div className="panel-heading">
          <div>
            <h3>Danh mục cuối kỳ</h3>
            <p>Vị thế còn mở được giữ nguyên, không tự động bán</p>
          </div>
        </div>
        <dl className="equity-breakdown">
          <div>
            <dt>Tiền mặt</dt>
            <dd>{cash(m.cash)}</dd>
          </div>
          <div>
            <dt>Cổ phiếu đang giữ</dt>
            <dd>{number.format(m.openQuantity)} CP</dd>
          </div>
          <div>
            <dt>Giá trị cổ phiếu</dt>
            <dd>{cash(m.marketValue)}</dd>
          </div>
          <div>
            <dt>Lãi/lỗ đã chốt</dt>
            <dd>{cash(m.realizedPnl)}</dd>
          </div>
          <div>
            <dt>Lãi/lỗ chưa chốt</dt>
            <dd>{cash(m.unrealizedPnl)}</dd>
          </div>
          <div>
            <dt>Tổng phí</dt>
            <dd>{cash(m.totalFees)}</dd>
          </div>
        </dl>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Nhật ký giao dịch</h3>
            <p>
              {orders.filter((o) => o.status === 'FILLED').length} lệnh đã khớp
              · {orders.filter((o) => o.status !== 'FILLED').length} tín hiệu
              không khớp
            </p>
          </div>
        </div>
        {orders.length ? (
          <>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Nhật ký giao dịch, cuộn ngang để xem đầy đủ"
            >
              <table>
                <caption className="sr-only">
                  Ngày tín hiệu, ngày xử lý, lệnh và tiền sau mỗi lần xử lý
                </caption>
                <thead>
                  <tr>
                    <th>Ngày tín hiệu</th>
                    <th>Ngày xử lý</th>
                    <th>Lệnh</th>
                    <th>Trạng thái</th>
                    <th>Số CP</th>
                    <th>Giá khớp</th>
                    <th>Phí</th>
                    <th>Tiền còn lại</th>
                    <th>Lãi/lỗ đã chốt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(page * 10, page * 10 + 10).map((o, i) => (
                    <tr key={`${o.signalDate}-${i}`}>
                      <td>{date(o.signalDate)}</td>
                      <td>{o.executionDate ? date(o.executionDate) : '—'}</td>
                      <td>
                        <span
                          className={
                            o.action === 'BUY' ? 'positive' : 'negative'
                          }
                        >
                          {o.action === 'BUY' ? 'Mua' : 'Bán'}
                        </span>
                      </td>
                      <td>{statusLabels[o.status]}</td>
                      <td>{number.format(o.quantity)}</td>
                      <td>{o.price === null ? '—' : cash(o.price)}</td>
                      <td>{cash(o.fee)}</td>
                      <td>{cash(o.cashAfter)}</td>
                      <td>
                        {o.realizedPnl === null ? '—' : cash(o.realizedPnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="result-pagination">
              <span>
                Trang {page + 1} / {pages}
              </span>
              <div>
                <button
                  className="button secondary"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Trước
                </button>
                <button
                  className="button secondary"
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= pages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="empty-search">
            Không có tín hiệu mua/bán trong khoảng này.
          </p>
        )}
      </section>
      <details className="simulation-assumptions">
        <summary>Cách đọc kết quả và giả định mô phỏng</summary>
        <p>
          Mock phát Mua ở phiên 1, Bán ở phiên 6, lặp mỗi 10 phiên có dữ liệu.
          Tín hiệu cuối phiên chỉ được xử lý ở giá mở cửa phiên kế tiếp trong
          khoảng. Đây là dữ liệu thử luồng backtest, không phải hiệu quả của
          Quant AI.
        </p>
        <p>
          Mua tối đa cổ phiếu nguyên bằng tiền sẵn có, bán toàn bộ vị thế, lô 1
          CP. Phí áp dụng cả hai chiều. Phiên có khối lượng bằng 0 và tín hiệu ở
          phiên cuối không được khớp. Chưa mô phỏng trượt giá, thuế, giới hạn
          thanh khoản, T+ hoặc xử lý riêng sự kiện doanh nghiệp.
        </p>
        <p>
          Mã kết quả: <code>{run.id}</code>. Provider:{' '}
          <code>{run.simulation.provider}</code>. Snapshot đến{' '}
          {date(run.dataCutoff)}. Kết quả này giữ cấu hình lúc chạy, độc lập với
          những chỉnh sửa trên biểu mẫu.
        </p>
      </details>
    </section>
  )
}
