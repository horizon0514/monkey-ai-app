import { SiteConfig } from '../../../../shared/types'
import { cn } from '@renderer/lib/utils'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type AssistantListProps = {
  sites: SiteConfig[]
  editingId: string | null
  onToggle: (siteId: string) => void
  onReorder: (sites: SiteConfig[]) => void
  onEdit: (site: SiteConfig) => void
  onDelete: (siteId: string) => void
}

type SortableItemProps = {
  site: SiteConfig
  isEditing: boolean
  onToggle: (siteId: string) => void
  onEdit: (site: SiteConfig) => void
  onDelete: (siteId: string) => void
}

const SortableItem = ({
  site,
  isEditing,
  onToggle,
  onEdit,
  onDelete
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-lg border border-border/40 bg-card/50 px-3 py-2.5 transition-all hover:border-border/80',
        isEditing && 'border-primary/50 ring-1 ring-primary/20',
        isDragging && 'opacity-50'
      )}
    >
      {!isEditing ? (
        <div className='flex items-center gap-3'>
          <div
            className='cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing'
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </div>

          <div className='flex items-center'>
            <Switch
              checked={site.enabled}
              onCheckedChange={() => onToggle(site.id)}
            />
          </div>

          <div className='min-w-0 flex-1'>
            <span className='truncate text-sm font-medium'>{site.title}</span>
            <div className='mt-0.5 truncate text-xs text-muted-foreground'>
              {site.url}
            </div>
          </div>

          <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
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
}

export const AssistantList: React.FC<AssistantListProps> = ({
  sites,
  editingId,
  onToggle,
  onReorder,
  onEdit,
  onDelete
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = sites.findIndex(site => site.id === active.id)
      const newIndex = sites.findIndex(site => site.id === over.id)
      onReorder(arrayMove(sites, oldIndex, newIndex))
    }
  }

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sites.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className='space-y-2'>
          {sites.map(site => (
            <SortableItem
              key={site.id}
              site={site}
              isEditing={editingId === site.id}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

type ActionButtonProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive'
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'default'
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
      title={label}
    >
      {icon}
    </Button>
  )
}
