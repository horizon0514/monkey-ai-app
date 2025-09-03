import React, { useEffect } from 'react'

interface MainContentProps {
  selectedTab: string
}

export const MainContent: React.FC<MainContentProps> = ({ selectedTab }) => {
  useEffect(() => {
    window.electron.switchTab(selectedTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <main className='flex-1 overflow-hidden' />
}
