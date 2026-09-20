import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FlaskConical, Save, ArrowRight, Check, Play } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { BacktestResults } from '@/components/BacktestResults'
import { createBacktest, getBacktest } from '@/api/backtests'
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
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const runId = params.get('run')
  const result = useQuery({
    queryKey: ['backtest', runId],
    queryFn: () => getBacktest(runId!),
    enabled: Boolean(runId),
    retry: false,
    staleTime: Infinity,
  })
  const run = useMutation({
    mutationFn: createBacktest,
    onSuccess: (data) => {
      queryClient.setQueryData(['backtest', data.id], data)
      setParams({ run: data.id })
    },
  })
  const symbol = draft.symbol || stocks.data?.[0]?.symbol || ''
  const invalid = draft.from > draft.to
  function update(key: keyof typeof defaults, value: string) {
    setDraft({ ...draft, [key]: value })
    setMessage('')
  }
  function save() {
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
  function submit(event: FormEvent) {
    event.preventDefault()
    if (invalid || run.isPending || !symbol) return
    run.mutate({
      symbol,
      from: draft.from,
      to: draft.to,
      capital: Number(draft.capital),
      feePercent: Number(draft.fee),
    })
  }
  const cannotSubmit =
    invalid ||
    !symbol ||
    !stocks.data?.some((stock) => stock.symbol === symbol) ||
    run.isPending
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Phòng thử chiến lược</h1>
          <p>Kiểm chứng luồng giao dịch trên dữ liệu lịch sử.</p>
        </div>
        <span className="snapshot">Backtest · Mock Quant</span>
      </div>
      <div className="backtest-notice">
        <FlaskConical size={20} aria-hidden="true" />
        <p>
          <strong>Mô phỏng với tín hiệu mẫu.</strong> Mua ở phiên 1, bán ở phiên
          6, lặp mỗi 10 phiên. Lệnh khớp ở giá mở cửa phiên kế tiếp. Quant AI sẽ
          được kết nối sau.
        </p>
      </div>
      <div className="backtest-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Thiết lập phiên thử nghiệm</h2>
              <p>Kết quả được lưu trong cơ sở dữ liệu sau mỗi lần chạy</p>
            </div>
          </div>
          <form
            className="backtest-form"
            onSubmit={submit}
            aria-busy={run.isPending}
          >
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
                  min="2021-01-01"
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
                  min="2021-01-01"
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
                  max="1000000000000"
                  step="0.01"
                  value={draft.capital}
                  required
                  onChange={(event) => update('capital', event.target.value)}
                />
              </label>
              <label>
                Phí giao dịch (% mỗi chiều)
                <input
                  type="number"
                  min="0"
                  max="5"
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
                <strong>Mock Quant · Chu kỳ 10 phiên</strong>
                <p>Mua bằng tiền sẵn có, bán toàn bộ vị thế.</p>
              </div>
              <span className="tag">v1</span>
            </div>
            <div className="backtest-actions">
              <button className="button" type="submit" disabled={cannotSubmit}>
                <Play size={17} aria-hidden="true" />
                {run.isPending ? 'Đang chạy…' : 'Chạy backtest'}
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={save}
                disabled={cannotSubmit}
              >
                <Save size={17} aria-hidden="true" />
                Lưu cấu hình nháp
              </button>
            </div>
            {run.isPending && (
              <p role="status">Đang mô phỏng và lưu kết quả…</p>
            )}
            {run.isError && (
              <p className="negative" role="alert">
                {run.error.message}
              </p>
            )}
            {run.isSuccess && !run.isPending && (
              <p role="status">
                Đã hoàn tất và lưu kết quả. <a href="#results">Xem báo cáo</a>
              </p>
            )}
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
            Từ tín hiệu
            <br />
            đến kết quả.
          </h2>
          <p>
            Theo dõi đường vốn, phí giao dịch và từng lần mua bán trong cùng một
            báo cáo.
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
              <dd>
                {run.isPending
                  ? 'Đang chạy…'
                  : result.data
                    ? 'Đã lưu'
                    : 'Chưa chạy'}
              </dd>
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
      {runId && result.isPending && (
        <p className="result-loading" role="status">
          Đang tải kết quả đã lưu…
        </p>
      )}
      {runId && result.isError && (
        <div className="result-error" role="alert">
          <p>{result.error.message}</p>
          <button
            className="button secondary"
            onClick={() => void result.refetch()}
          >
            Tải lại kết quả
          </button>
        </div>
      )}
      {result.data && (
        <BacktestResults key={result.data.id} run={result.data} />
      )}
    </>
  )
}
