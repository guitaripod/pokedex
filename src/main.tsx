import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './context/AppStateContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </AppStateProvider>
  </StrictMode>,
)
