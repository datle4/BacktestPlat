import {
  AlertCircle,
  CalendarDays,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react'
import { percent } from '@/hooks/useMarket'

export function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">—</span>
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <span
      className={`change ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'muted'}`}
    >
      <Icon size={16} aria-hidden="true" />
      {percent(value)}
    </span>
  )
}

export function DataState({
  pending,
  failed,
  empty,
  retry,
}: {
  pending: boolean
  failed: boolean
  empty: boolean
  retry: () => void
}) {
  if (!pending && !failed && !empty) return null
  return (
    <section className="state-panel" aria-live="polite">
      {failed ? (
        <AlertCircle size={28} aria-hidden="true" />
      ) : (
        <CalendarDays size={28} aria-hidden="true" />
      )}
      <h2>
        {pending
          ? 'Đang tải dữ liệu…'
          : failed
            ? 'Chưa kết nối được dữ liệu'
            : 'Chưa có dữ liệu trong bộ theo dõi'}
      </h2>
      <p>
        {pending
          ? 'Đang chuẩn bị thông tin các mã cổ phiếu.'
          : failed
            ? 'Vui lòng kiểm tra kết nối và thử lại.'
            : 'Dữ liệu sẽ xuất hiện sau khi nhập lịch sử cổ phiếu.'}
      </p>
      {!pending && (
        <button className="button secondary" onClick={retry}>
          Thử tải lại
        </button>
      )}
    </section>
  )
}
