import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { X, Save } from 'lucide-react'

export type AssistantFormDraft = {
  title: string
  url: string
  external: boolean
}

type AssistantFormProps = {
  mode: 'add' | 'edit'
  draft: AssistantFormDraft
  onDraftChange: (draft: AssistantFormDraft) => void
  onSave: () => void
  onCancel: () => void
  editId?: string
}

export const AssistantForm: React.FC<AssistantFormProps> = ({
  mode,
  draft,
  onDraftChange,
  onSave,
  onCancel,
  editId
}) => {
  const title = mode === 'add' ? '新增助手' : '编辑助手'

  return (
    <div className='space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4'>
      <div className='text-sm font-medium'>{title}</div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]'>
        <div className='space-y-1.5'>
          <Label
            htmlFor={`${mode}-title`}
            className='text-xs'
          >
            名称 <span className='text-destructive'>*</span>
          </Label>
          <Input
            id={`${mode}-title`}
            value={draft.title}
            onChange={e => onDraftChange({ ...draft, title: e.target.value })}
            placeholder='输入名称'
            className='h-9'
          />
        </div>
        <div className='space-y-1.5'>
          <Label
            htmlFor={`${mode}-url`}
            className='text-xs'
          >
            URL <span className='text-destructive'>*</span>
          </Label>
          <Input
            id={`${mode}-url`}
            value={draft.url}
            onChange={e => onDraftChange({ ...draft, url: e.target.value })}
            placeholder='https://example.com/'
            className='h-9'
          />
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Switch
          id={`${mode}-external-${editId || 'new'}`}
          checked={draft.external}
          onCheckedChange={checked =>
            onDraftChange({ ...draft, external: checked })
          }
        />
        <div className='flex flex-col'>
          <Label
            htmlFor={`${mode}-external-${editId || 'new'}`}
            className='cursor-pointer text-sm'
          >
            在外部浏览器打开
          </Label>
          <p className='text-xs text-muted-foreground'>
            适用于不支持内嵌的站点（如需登录的网站）
          </p>
        </div>
      </div>

      <div className='flex justify-end gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={onCancel}
          className='gap-1.5'
        >
          <X size={14} /> 取消
        </Button>
        <Button
          size='sm'
          onClick={onSave}
          className='gap-1.5'
        >
          <Save size={14} /> 保存
        </Button>
      </div>
    </div>
  )
}
