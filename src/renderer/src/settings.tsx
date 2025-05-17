import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import './assets/global.css'
import { SettingsModal } from './components/SettingsWindow'
import { ThemeProvider } from './components/ThemeProvider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsModal />
    </ThemeProvider>
  </React.StrictMode>
)
