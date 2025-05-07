import React from 'react'

export const MainContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="container mx-auto">
        {children}
      </div>
    </main>
  )
}


