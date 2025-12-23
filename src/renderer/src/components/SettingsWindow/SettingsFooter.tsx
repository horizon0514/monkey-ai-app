import { SiteConfig } from '../../../../shared/types'
import { Button } from '../ui/button'

type SettingsFooterProps = {
  sites: SiteConfig[]
  onExport: () => void
  onImport: () => void
  onResetDefaults: () => void
  onClose?: () => void
}

export const SettingsFooter: React.FC<SettingsFooterProps> = ({
  sites,
  onExport,
  onImport,
  onResetDefaults,
  onClose
}) => {
  return (
    <div className='sticky bottom-0 z-10 border-t border-border/40 bg-gradient-to-t from-background to-background/95 px-6 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80'>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <div className='mr-auto text-xs text-muted-foreground'>
          {sites.length} 个助手配置
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={onExport}
        >
          导出
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={onImport}
        >
          导入
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={onResetDefaults}
        >
          恢复默认
        </Button>
        <Button
          size='sm'
          onClick={onClose}
        >
          关闭
        </Button>
      </div>
    </div>
  )
}
