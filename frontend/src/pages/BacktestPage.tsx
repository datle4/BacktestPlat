import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FlaskConical, Save, ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getStocks } from '@/api/marketData'
import { CUTOFF, START, number } from '@/hooks/useMarket'

const KEY = 'backtestplat-draft'
const defaults = {
  symbol: '',
  from: START,
  to: CUTOFF,
  capital: '100000000',
  fee: '0.15',
}
function readDraft() {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (
      value &&
      typeof value === 'object' &&
      Object.keys(defaults).every(
        (key) =>
          key in value &&
          typeof (value as Record<string, unknown>)[key] === 'string',
      )
    )
      return { ...defaults, ...value }
  } catch {
    /* A missing or invalid draft starts with defaults. */
  }
  return defaults
}

export function BacktestPage() {
  const stocks = useQuery({ queryKey: ['stocks'], queryFn: getStocks })
  const [draft, setDraft] = useState(readDraft)
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState(false)
  const symbol = draft.symbol || stocks.data?.[0]?.symbol || ''
  const invalid = draft.from > draft.to
  function update(key: keyof typeof defaults, value: string) {
    setDraft({ ...draft, [key]: value })
    setMessage('')
  }
  function save(event: FormEvent) {
    event.preventDefault()
    if (invalid) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...draft, symbol }))
      setSaveError(false)
      setMessage('Đã lưu cấu hình trên trình duyệt này.')
    } catch {
      setSaveError(true)
      setMessage(
        'Không thể lưu trên trình duyệt này. Cấu hình vẫn được giữ trong trang.',
      )
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Phòng thử chiến lược</h1>
          <p>Bắt đầu từ một ý tưởng. Chuẩn bị dữ liệu để kiểm chứng.</p>
        </div>
        <span className="snapshot">Backtest · Đang chuẩn bị</span>
      </div>
      <div className="backtest-notice">
        <FlaskConical size={20} aria-hidden="true" />
        <p>
          <strong>Không gian dành cho bước tiếp theo.</strong> Bạn có thể lưu
          cấu hình nháp ngay bây giờ. Chức năng chạy mô phỏng sẽ được triển khai
          trong Phase 2.
        </p>
      </div>
      <div className="backtest-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Thiết lập phiên thử nghiệm</h2>
              <p>Bản nháp được lưu riêng trên trình duyệt của bạn</p>
            </div>
          </div>
          <form className="backtest-form" onSubmit={save}>
            <label>
              Cổ phiếu
              <select
                value={symbol}
                onChange={(event) => update('symbol', event.target.value)}
                required
                disabled={!stocks.data?.length}
              >
                <option value="">
                  {stocks.isPending ? 'Đang tải…' : 'Chọn cổ phiếu'}
                </option>
                {stocks.data?.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} — {stock.name}
                  </option>
                ))}
              </select>
            </label>
            {stocks.isError && (
              <p role="alert">
                Chưa tải được danh sách.{' '}
                <button
                  type="button"
                  className="inline-button"
                  onClick={() => {
                    void stocks.refetch()
                  }}
                >
                  Thử lại
                </button>
              </p>
            )}
            <div className="form-pair">
              <label>
                Từ ngày
                <input
                  type="date"
                  value={draft.from}
                  max={CUTOFF}
                  required
                  onChange={(event) => update('from', event.target.value)}
                />
              </label>
              <label>
                Đến ngày
                <input
                  type="date"
                  value={draft.to}
                  max={CUTOFF}
                  required
                  aria-invalid={invalid}
                  aria-describedby={invalid ? 'range-error' : undefined}
                  onChange={(event) => update('to', event.target.value)}
                />
              </label>
            </div>
            {invalid && (
              <p id="range-error" className="negative" role="alert">
                Ngày kết thúc phải từ ngày bắt đầu trở đi.
              </p>
            )}
            <div className="form-pair">
              <label>
                Vốn ban đầu (VND)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={draft.capital}
                  required
                  onChange={(event) => update('capital', event.target.value)}
                />
              </label>
              <label>
                Phí giao dịch (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={draft.fee}
                  required
                  onChange={(event) => update('fee', event.target.value)}
                />
              </label>
            </div>
            <div className="strategy-preview">
              <span className="insight-icon">
                <FlaskConical size={19} aria-hidden="true" />
              </span>
              <div>
                <strong>Chiến lược mô phỏng</strong>
                <p>Sẽ có ở Phase 2. Quant AI sẽ được kết nối sau.</p>
              </div>
              <span className="tag">Sắp có</span>
            </div>
            <button
              className="button"
              type="submit"
              disabled={
                invalid ||
                !symbol ||
                !stocks.data?.some((stock) => stock.symbol === symbol)
              }
            >
              <Save size={17} aria-hidden="true" />
              Lưu cấu hình nháp
            </button>
            {message && (
              <p className={saveError ? 'negative' : 'positive'} role="status">
                {message}
              </p>
            )}
          </form>
        </section>
        <aside className="backtest-preview">
          <span className="preview-symbol">
            <FlaskConical size={32} aria-hidden="true" />
          </span>
          <h2>
            Mỗi chiến lược
            <br />
            bắt đầu bằng dữ liệu.
          </h2>
          <p>
            Khám phá lịch sử giá trước khi thử nghiệm một cách tiếp cận mới.
          </p>
          <dl>
            <div>
              <dt>Cổ phiếu</dt>
              <dd>{symbol || 'Chưa chọn'}</dd>
            </div>
            <div>
              <dt>Vốn dự kiến</dt>
              <dd>{number.format(Number(draft.capital) || 0)} ₫</dd>
            </div>
            <div>
              <dt>Kết quả mô phỏng</dt>
              <dd>Chưa chạy</dd>
            </div>
          </dl>
          <Link
            className="button secondary"
            to={symbol ? `/stocks?symbol=${symbol}` : '/stocks'}
          >
            Khám phá dữ liệu <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p className="preview-note">
            <Check size={16} aria-hidden="true" />
            Lưu nháp không tạo giao dịch hay kết quả backtest.
          </p>
        </aside>
      </div>
    </>
  )
}
