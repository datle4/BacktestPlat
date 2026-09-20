import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AppShell } from '@/components/AppShell'
import { MarketHome } from '@/pages/MarketHome'
import { StocksPage } from '@/pages/StocksPage'
import { BacktestPage } from '@/pages/BacktestPage'
import { AppProviders } from '@/app/providers'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <MarketHome /> },
      { path: 'stocks', element: <StocksPage /> },
      { path: 'backtest', element: <BacktestPage /> },
    ],
  },
  {
    path: '/status',
    element: <Navigate to="/" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
