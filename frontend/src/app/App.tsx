import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { FoundationStatus } from '@/components/FoundationStatus'
import { AppProviders } from '@/app/providers'

const router = createBrowserRouter([
  {
    path: '/',
    element: <FoundationStatus />,
  },
  {
    path: '/status',
    element: <FoundationStatus />,
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

