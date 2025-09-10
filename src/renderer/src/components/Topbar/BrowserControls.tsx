import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'

export const BrowserControls: React.FC = () => {
  const [canGoBack, setCanGoBack] = React.useState(false)
  const [canGoForward, setCanGoForward] = React.useState(false)

  React.useEffect(() => {
    const update = async () => {
      const state = await window.electron.getNavigationState()
      setCanGoBack(Boolean((state as any)?.canGoBack))
      setCanGoForward(Boolean((state as any)?.canGoForward))
    }
    update()
    const handler = (_: unknown, payload: unknown) => {
      const p = (payload || {}) as {
        canGoBack?: boolean
        canGoForward?: boolean
      }
      setCanGoBack(Boolean(p.canGoBack))
      setCanGoForward(Boolean(p.canGoForward))
    }
    window.electron.ipcRenderer.on('navigation-state-changed', handler)
    return () => {
      window.electron.ipcRenderer.removeListener(
        'navigation-state-changed',
        handler
      )
    }
  }, [])

  return (
    <>
      <div className='px-2 no-drag'>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            disabled={!canGoBack}
            onClick={() => window.electron.goBack()}
            title='后退'
          >
            <ArrowLeft size={16} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            disabled={!canGoForward}
            onClick={() => window.electron.goForward()}
            title='前进'
          >
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <div className='px-2 no-drag'>
        <Button
          variant='ghost'
          size='icon'
          title='在浏览器中打开'
          onClick={async () => {
            const url = await window.electron.getCurrentUrl()
            if (url && typeof url === 'string') {
              window.electron.openExternalUrl(url)
            }
          }}
        >
          <ExternalLink
            size={18}
            className='text-muted-foreground'
          />
        </Button>
      </div>
    </>
  )
}
