import { SiteConfig } from '../../../../shared/types'
import { cn } from '@renderer/lib/utils'
import { ArrowUp, ArrowDown, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'

type AssistantListProps = {
  sites: SiteConfig[]
  editingId: string | null
  onToggle: (siteId: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onEdit: (site: SiteConfig) => void
  onDelete: (siteId: string) => void
}

export const AssistantList: React.FC<AssistantListProps> = ({
  sites,
  editingId,
  onToggle,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete
}) => {
  if (sites.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <p className='text-sm text-muted-foreground'>没有匹配的助手</p>
        <p className='mt-1 text-xs text-muted-foreground/70'>
          尝试调整搜索条件或添加新助手
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      {sites.map((site, idx) => {
        const isEditing = editingId === site.id
        return (
          <div
            key={site.id}
            className={cn(
              'group rounded-lg border border-border/40 bg-card/50 px-3 py-2.5 transition-all hover:border-border/80',
              isEditing && 'border-primary/50 ring-1 ring-primary/20'
            )}
          >
            {!isEditing ? (
              <div className='flex items-center gap-3'>
                <div className='flex items-center'>
                  <Switch
                    checked={site.enabled}
                    onCheckedChange={() => onToggle(site.id)}
                  />
                </div>

                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='truncate text-sm font-medium'>
                      {site.title}
                    </span>
                    {site.external && (
                      <span title='在外部浏览器打开'>
                        <ExternalLink
                          size={12}
                          className='shrink-0 text-muted-foreground'
                        />
                      </span>
                    )}
                  </div>
                  <div className='mt-0.5 truncate text-xs text-muted-foreground'>
                    {site.url}
                  </div>
                </div>

                <div
                  className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'
                  style={{
                    opacity:
                      idx === 0 || idx === sites.length - 1 ? 1 : undefined
                  }}
                >
                  <ActionButton
                    icon={<ArrowUp size={16} />}
                    label='上移'
                    onClick={() => onMoveUp(idx)}
                    disabled={idx === 0}
                  />
                  <ActionButton
                    icon={<ArrowDown size={16} />}
                    label='下移'
                    onClick={() => onMoveDown(idx)}
                    disabled={idx === sites.length - 1}
                  />
                  <ActionButton
                    icon={<Pencil size={16} />}
                    label='编辑'
                    onClick={() => onEdit(site)}
                  />
                  <ActionButton
                    icon={<Trash2 size={16} />}
                    label='删除'
                    onClick={() => onDelete(site.id)}
                    variant='destructive'
                  />
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-center py-2'>
                <span className='text-sm text-muted-foreground'>
                  编辑模式在上方表单中进行
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

type ActionButtonProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false
}) => {
  return (
    <Button
      variant='ghost'
      size='icon'
      className={cn(
        'h-8 w-8',
        variant === 'destructive' &&
          'text-destructive hover:bg-destructive/10 hover:text-destructive'
      )}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {icon}
    </Button>
  )
}
