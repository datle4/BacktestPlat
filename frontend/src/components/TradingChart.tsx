import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { compact, number } from '@/hooks/useMarket'
import type { Candle } from '@/utils/candles'

export interface ChartViewport {
  from: number
  to: number
}
export interface TradingChartHandle {
  zoom: (factor: number) => void
  pan: (direction: number) => void
  reset: () => void
  inspect: (index: number) => void
}

function initialRange(length: number, width: number) {
  if (length < 12) {
    const padding = (16 - length) / 2
    return { from: -padding, to: length - 1 + padding }
  }
  const count = Math.min(length, width < 500 ? 35 : 70)
  return { from: length - count - 0.5, to: length + 2 }
}

export function TradingChart({
  candles,
  onInspect,
  onViewport,
  ref,
}: {
  candles: Candle[]
  onInspect: (index: number) => void
  onViewport: (range: ChartViewport) => void
  ref: Ref<TradingChartHandle>
}) {
  const container = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const callbacks = useRef({ onInspect, onViewport })
  useEffect(() => {
    callbacks.current = { onInspect, onViewport }
  }, [onInspect, onViewport])

  useImperativeHandle(ref, () => ({
    reset() {
      const chart = chartRef.current
      if (!chart) return
      chart
        .timeScale()
        .setVisibleLogicalRange(
          initialRange(candles.length, container.current?.clientWidth ?? 0),
        )
      chart.priceScale('right').applyOptions({ autoScale: true })
      chart.clearCrosshairPosition()
    },
    zoom(factor) {
      const chart = chartRef.current
      const range = chart?.timeScale().getVisibleLogicalRange()
      if (!chart || !range) return
      const count = Math.max(
        5,
        Math.min(
          Math.max(16, candles.length + 3),
          (range.to - range.from) * factor,
        ),
      )
      const center = (range.from + range.to) / 2
      chart
        .timeScale()
        .setVisibleLogicalRange({
          from: center - count / 2,
          to: center + count / 2,
        })
    },
    pan(direction) {
      const chart = chartRef.current
      const range = chart?.timeScale().getVisibleLogicalRange()
      if (!chart || !range) return
      const step =
        Math.max(1, Math.round((range.to - range.from) * 0.6)) * direction
      chart
        .timeScale()
        .setVisibleLogicalRange({
          from: range.from + step,
          to: range.to + step,
        })
    },
    inspect(index) {
      const chart = chartRef.current
      const series = seriesRef.current
      const bar = candles[index]
      if (!chart || !series || !bar) return
      const range = chart.timeScale().getVisibleLogicalRange()
      if (range && (index < range.from || index > range.to)) {
        const half = (range.to - range.from) / 2
        chart
          .timeScale()
          .setVisibleLogicalRange({ from: index - half, to: index + half })
      }
      chart.setCrosshairPosition(bar.close, bar.date, series)
    },
  }))

  useEffect(() => {
    if (!container.current) return
    const chart = createChart(container.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        fontFamily: 'Inter Variable, system-ui, sans-serif',
        fontSize: 11,
        attributionLogo: false,
        panes: { enableResize: false },
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: {
        minimumWidth: 88,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        rightOffset: 2,
        barSpacing: 9,
        minBarSpacing: 3,
        fixLeftEdge: candles.length >= 12,
        fixRightEdge: candles.length >= 12,
        timeVisible: false,
      },
      kineticScroll: { mouse: false, touch: false },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
      localization: { locale: 'vi-VN', dateFormat: 'dd/MM/yyyy' },
    })
    const series = chart.addSeries(CandlestickSeries, {
      priceFormat: {
        type: 'custom',
        minMove: 0.01,
        formatter: (value: number) => number.format(value),
      },
      priceLineStyle: LineStyle.Dashed,
      priceLineWidth: 1,
    })
    const volume = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: {
          type: 'custom',
          minMove: 1,
          formatter: (value: number) => compact.format(value),
        },
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1,
    )
    series.setData(candles.map((bar) => ({ ...bar, time: bar.date })))
    chart.panes()[0].setStretchFactor(3)
    chart.panes()[1].setStretchFactor(1)
    volume
      .priceScale()
      .applyOptions({
        scaleMargins: { top: 0.2, bottom: 0 },
        borderVisible: false,
      })
    chartRef.current = chart
    seriesRef.current = series
    const colors = () => {
      const previousRange = chart.timeScale().getVisibleLogicalRange()
      const style = getComputedStyle(document.documentElement)
      const token = (name: string) => style.getPropertyValue(name).trim()
      const up = token('--positive')
      const down = token('--negative')
      chart.applyOptions({
        layout: {
          textColor: token('--muted'),
          panes: {
            separatorColor: token('--border'),
            separatorHoverColor: token('--border'),
          },
        },
        rightPriceScale: { borderColor: token('--border') },
        timeScale: { borderColor: token('--border') },
        crosshair: {
          vertLine: {
            color: token('--control'),
            labelBackgroundColor: token('--accent'),
          },
          horzLine: {
            color: token('--control'),
            labelBackgroundColor: token('--accent'),
          },
        },
      })
      series.applyOptions({
        upColor: up,
        downColor: down,
        borderUpColor: up,
        borderDownColor: down,
        wickUpColor: up,
        wickDownColor: down,
      })
      volume.setData(
        candles.map((bar) => ({
          time: bar.date,
          value: bar.volume,
          color: `${bar.close >= bar.open ? up : down}80`,
        })),
      )
      if (previousRange) chart.timeScale().setVisibleLogicalRange(previousRange)
    }
    colors()
    // Updating colors in place preserves the user's zoom and scroll position.
    const observer = new MutationObserver(colors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    chart.subscribeCrosshairMove((event) => {
      // Internal resize/scale events must not overwrite keyboard-selected data.
      if (
        !event.sourceEvent ||
        event.logical === undefined ||
        !event.seriesData.has(series)
      )
        return
      const index = Math.round(event.logical)
      if (index >= 0 && index < candles.length)
        callbacks.current.onInspect(index)
    })
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range) return
      callbacks.current.onViewport({
        from: Math.max(0, Math.ceil(range.from)),
        to: Math.min(candles.length - 1, Math.floor(range.to)),
      })
    })
    chart
      .timeScale()
      .setVisibleLogicalRange(
        initialRange(candles.length, container.current.clientWidth),
      )
    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [candles])

  return (
    <div className="trading-chart-canvas" ref={container} aria-hidden="true" />
  )
}
