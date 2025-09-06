import React, { useEffect } from 'react'
import { ChatView } from '../chat/ChatView'

interface MainContentProps {
  selectedTab: string
}

export const MainContent: React.FC<MainContentProps> = ({ selectedTab }) => {
  useEffect(() => {
    if (selectedTab !== 'chat') {
      window.electron.switchTab(selectedTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab])

  if (selectedTab === 'chat') {
    return (
      <main className='flex-1 overflow-hidden bg-background dark:bg-muted'>
        <ChatView />
      </main>
    )
  }

  return <main className='flex-1 overflow-hidden bg-background dark:bg-muted' />
}
