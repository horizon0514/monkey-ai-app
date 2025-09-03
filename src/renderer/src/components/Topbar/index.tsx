import React from 'react'
import { SiteConfig } from '../../../../shared/types'
import { Button } from '@renderer/components/ui/button'
import { Moon, Sun, ArrowLeft, ArrowRight } from 'lucide-react'
import { useTheme } from '@renderer/components/ThemeProvider'

interface TopbarProps {
  tab?: SiteConfig
  title?: string
}

export const Topbar: React.FC<TopbarProps> = ({ tab, title }) => {
  const { theme, setTheme } = useTheme()
  const displayTitle = title ?? tab?.title ?? ''
  const [canGoBack, setCanGoBack] = React.useState(false)
  const [canGoForward, setCanGoForward] = React.useState(false)

  React.useEffect(() => {
    const update = async () => {
      const state = await window.electron.getNavigationState()
      setCanGoBack(Boolean((state as any)?.canGoBack))
      setCanGoForward(Boolean((state as any)?.canGoForward))
    }
    update()
    const handler = (_: unknown, payload: { canGoBack: boolean; canGoForward: boolean }) => {
      setCanGoBack(Boolean(payload?.canGoBack))
      setCanGoForward(Boolean(payload?.canGoForward))
    }
    window.electron.ipcRenderer.on('navigation-state-changed', handler)
    return () => {
      window.electron.ipcRenderer.removeListener('navigation-state-changed', handler)
    }
  }, [])

  return (
    <div className='flex h-12 w-full items-center border-b border-border/40 bg-background/95 backdrop-blur drag-region supports-[backdrop-filter]:bg-background/60'>
      <div className='flex items-center gap-2 px-2'>
        <span className='text-sm font-medium'>{displayTitle}</span>
      </div>
      <div className='flex-1' />
      <div className='px-2 no-drag'>
        <div className='flex items-center gap-1'>
          <button
            className='inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent'
            disabled={!canGoBack}
            onClick={() => window.electron.goBack()}
            title='后退'
          >
            <ArrowLeft size={16} />
          </button>
          <button
            className='inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent'
            disabled={!canGoForward}
            onClick={() => window.electron.goForward()}
            title='前进'
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
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
