import React from 'react'
import ReactDOM from 'react-dom/client'
import QuickWindow from './components/QuickWindow'
import './assets/index.css'
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

// 监听系统主题变化
window.electron.ipcRenderer.on('system-theme-changed', (_, args) => {
  const theme = args as string;
  applyTheme(theme);
});

// 监听窗口显示事件，自动聚焦输入框
window.electron.ipcRenderer.on('quick-window-shown', () => {
  // 自动聚焦输入框
  setTimeout(() => {
    const input = document.getElementById('quick-search-input');
    if (input) {
      input.focus();
    }
  }, 100);
});

// 处理ESC键关闭窗口
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.electron.ipcRenderer.send('hide-quick-window', 'quick-window');
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QuickWindow />
  </React.StrictMode>
)
