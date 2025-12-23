import { cn } from '@renderer/lib/utils'
import { Sun, Bot, Info } from 'lucide-react'

type Section = 'appearance' | 'assistants' | 'about'

type SettingsSidebarProps = {
  activeSection: Section
  onSectionChange: (section: Section) => void
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange
}) => {
  return (
    <aside className='w-56 shrink-0 border-r border-border/40 p-3'>
      <div className='mb-2 px-2 text-xs text-muted-foreground'>偏好设置</div>
      <nav className='flex flex-col space-y-1'>
        <SidebarButton
          icon={<Sun size={16} />}
          label='外观'
          active={activeSection === 'appearance'}
          onClick={() => onSectionChange('appearance')}
        />
        <SidebarButton
          icon={<Bot size={16} />}
          label='AI 助手'
          active={activeSection === 'assistants'}
          onClick={() => onSectionChange('assistants')}
        />
        <div className='mt-3 px-2 text-xs text-muted-foreground'>关于</div>
        <SidebarButton
          icon={<Info size={16} />}
          label='关于'
          active={activeSection === 'about'}
          onClick={() => onSectionChange('about')}
        />
      </nav>
    </aside>
  )
}

type SidebarButtonProps = {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  active,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50',
        active && 'bg-primary/10 font-medium text-primary'
      )}
    >
      {icon} {label}
    </button>
  )
}
