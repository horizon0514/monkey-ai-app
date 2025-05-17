import React from 'react'
import ReactDOM from 'react-dom/client'
import QuickWindow from './components/QuickWindow'
import './assets/index.css'
import { ThemeProvider } from './components/ThemeProvider';

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
    <ThemeProvider>
      <QuickWindow />
    </ThemeProvider>
  </React.StrictMode>
)
