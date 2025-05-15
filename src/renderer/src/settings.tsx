import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import './assets/global.css'
import { SettingsModal } from './components/SettingsModal'

// 应用主题
function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// 初始化主题
window.electron.getEffectiveTheme().then((theme) => {
  applyTheme(theme);
});

// 监听主题变化
window.electron.ipcRenderer.on('theme-changed', (_, args) => {
  const theme = args as string;
  applyTheme(theme);
});

// 监听系统主题变化
window.electron.ipcRenderer.on('system-theme-changed', (_, args) => {
  const theme = args as string;
  applyTheme(theme);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SettingsModal/>
  </React.StrictMode>
)
