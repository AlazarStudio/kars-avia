import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { DialogProvider } from './contexts/DialogContext.jsx'

// Отключаем изменение значения числовых инпутов при скролле колесиком мыши.
// Гасим только когда инпут в фокусе — фокус при этом не теряется.
document.addEventListener(
  'wheel',
  (e) => {
    const el = document.activeElement
    if (el && el.tagName === 'INPUT' && el.type === 'number' && el === e.target) {
      e.preventDefault()
    }
  },
  { passive: false }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <DialogProvider>
            <App />
          </DialogProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)