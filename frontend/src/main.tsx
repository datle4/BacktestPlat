import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { usePreferencesStore } from '@/store/usePreferencesStore'
import '@/styles/index.css'

const rootElement = document.getElementById('root')

const savedTheme = usePreferencesStore.getState().theme

document.documentElement.dataset.theme = savedTheme
document.documentElement.style.colorScheme = savedTheme

if (!rootElement) {
  throw new Error('Không tìm thấy phần tử #root để khởi tạo ứng dụng.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
