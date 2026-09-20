import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { App } from '@/app/App'

describe('App foundation', () => {
  it('renders the accessible foundation status', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /một nền móng rõ ràng cho dữ liệu thị trường/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Frontend khởi tạo thành công')
    expect(screen.getByRole('link', { name: /bỏ qua tới nội dung chính/i })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('stores a user-selected theme without storing credentials', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText(/giao diện/i), 'dark')

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(window.localStorage.getItem('vn-stock-preferences')).toContain('dark')
  })

  it('has no detectable accessibility violations at the Foundation checkpoint', async () => {
    const { container } = render(<App />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
