import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { MarketOverview } from '@/components/MarketOverview'
import { AppProviders } from '@/app/providers'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MarketOverview />,
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
