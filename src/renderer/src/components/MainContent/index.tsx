import React, { useEffect } from 'react'

interface MainContentProps {
  selectedTab: string
}

export const MainContent: React.FC<MainContentProps> = ({ selectedTab }) => {
  useEffect(() => {
    window.electron.switchTab(selectedTab)
  }, [selectedTab])

  return <main className='flex-1 overflow-hidden' />
}
