import { Check, ChevronDown, Moon, Sun } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { usePreferencesStore } from '@/store/usePreferencesStore'

const themes = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
] as const

export function ThemeControl() {
  const { theme, setTheme } = usePreferencesStore()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const options = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()
  const selected = Math.max(
    0,
    themes.findIndex((item) => item.value === theme),
  )
  const current = themes[selected]
  const Icon = current.icon

  useEffect(() => {
    if (!open) return
    options.current[selected]?.focus()
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('focusin', dismiss)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('focusin', dismiss)
    }
  }, [open, selected])

  return (
    <div className="theme-control" ref={root}>
      <button
        ref={trigger}
        className="theme-trigger"
        type="button"
        aria-label={`Giao diện: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <Icon size={16} aria-hidden="true" />
        <span>{current.label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="theme-menu"
          id={menuId}
          role="menu"
          aria-label="Giao diện"
        >
          {themes.map(({ value, label, icon: OptionIcon }, index) => (
            <button
              key={value}
              ref={(element) => {
                options.current[index] = element
              }}
              type="button"
              role="menuitemradio"
              aria-checked={theme === value}
              tabIndex={-1}
              onClick={() => {
                setTheme(value)
                setOpen(false)
                trigger.current?.focus()
              }}
              onKeyDown={(event) => {
                let next = index
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setOpen(false)
                  trigger.current?.focus()
                  return
                }
                if (event.key === 'ArrowDown')
                  next = (index + 1) % themes.length
                else if (event.key === 'ArrowUp')
                  next = (index + themes.length - 1) % themes.length
                else if (event.key === 'Home') next = 0
                else if (event.key === 'End') next = themes.length - 1
                else return
                event.preventDefault()
                options.current[next]?.focus()
              }}
            >
              <OptionIcon size={16} aria-hidden="true" />
              <span>{label}</span>
              {theme === value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
