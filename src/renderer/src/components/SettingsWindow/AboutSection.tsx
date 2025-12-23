import { cn } from '@renderer/lib/utils'
import { Separator } from '../ui/separator'

type AboutSectionProps = {
  isMacOS: boolean
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isMacOS }) => {
  return (
    <div className='space-y-4'>
      <h3
        className={cn(
          'font-medium leading-none',
          isMacOS ? 'text-sm' : 'text-base'
        )}
      >
        关于
      </h3>

      <Separator />

      <div className='space-y-3 text-sm'>
        <div className='flex items-baseline justify-between'>
          <span className='text-muted-foreground'>版本</span>
          <span className='font-medium'>1.0.0</span>
        </div>
        <div className='flex items-baseline justify-between'>
          <span className='text-muted-foreground'>平台</span>
          <span>{window.platform.os === 'darwin' ? 'macOS' : 'Windows'}</span>
        </div>
      </div>

      <Separator />

      <p className='text-xs text-muted-foreground'>
        Chat Monkey 是一个 Electron 桌面应用，提供多个中文 AI
        聊天服务的统一界面。
      </p>
    </div>
  )
}
