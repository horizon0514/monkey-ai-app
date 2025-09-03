import React from 'react'
import { SiteConfig } from '../../../../shared/types'
import { Button } from '@renderer/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@renderer/components/ThemeProvider'

interface TopbarProps {
  tab?: SiteConfig
  title?: string
}

export const Topbar: React.FC<TopbarProps> = ({ tab, title }) => {
  const { theme, setTheme } = useTheme()
  const displayTitle = title ?? tab?.title ?? ''

  return (
    <div className='flex h-12 w-full items-center border-b border-border/40 bg-background/95 backdrop-blur drag-region supports-[backdrop-filter]:bg-background/60'>
      <div className='flex items-center gap-2 px-2'>
        <span className='text-sm font-medium'>{displayTitle}</span>
      </div>
      <div className='flex-1' />
      <div className='px-2 no-drag'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? (
            <Moon
              size={18}
              className='text-muted-foreground'
            />
          ) : (
            <Sun
              size={18}
              className='text-muted-foreground'
            />
          )}
        </Button>
      </div>
    </div>
  )
}
