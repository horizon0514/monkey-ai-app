import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import './assets/global.css'
import App from './App'
import { ThemeProvider } from './components/ThemeProvider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
