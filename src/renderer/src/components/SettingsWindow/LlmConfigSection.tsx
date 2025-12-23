import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { LlmSettings } from '../../../../shared/types'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

type LlmConfigSectionProps = {
  llmDraft: { apiKey: string; baseUrl: string }
  onLlmDraftChange: (draft: { apiKey: string; baseUrl: string }) => void
  onSave: (settings: LlmSettings) => void
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export const LlmConfigSection: React.FC<LlmConfigSectionProps> = ({
  llmDraft,
  onLlmDraftChange,
  onSave
}) => {
  const [saveState, setSaveState] = useState<LoadingState>('idle')
  const [fetchState, setFetchState] = useState<LoadingState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [modelCount, setModelCount] = useState<number | null>(null)

  const handleSave = async () => {
    setSaveState('loading')
    const newSettings: LlmSettings = {
      provider: 'openrouter',
      openrouter: {
        apiKey: llmDraft.apiKey.trim(),
        baseUrl: llmDraft.baseUrl.trim() || 'https://openrouter.ai/api/v1'
      }
    }
    await onSave(newSettings)
    setSaveState('success')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  const handleFetchModels = async () => {
    setFetchState('loading')
    setErrorMsg(null)
    setModelCount(null)

    const res = await window.electron.fetchOpenRouterModels()
    setFetchState('idle')

    if (!res.ok) {
      setFetchState('error')
      setErrorMsg(res.error)
    } else {
      setFetchState('success')
      setModelCount(res.models.length)
      setTimeout(() => setFetchState('idle'), 3000)
    }
  }

  return (
    <div className='space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium'>LLM 配置（OpenRouter）</h4>
        <div className='flex items-center gap-1.5'>
          <Input
            value={'OpenRouter'}
            disabled
            className='h-7 w-32 bg-muted/30 px-2 text-xs'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label
            htmlFor='llm-baseurl'
            className='text-xs'
          >
            Base URL
          </Label>
          <Input
            id='llm-baseurl'
            value={llmDraft.baseUrl}
            onChange={e =>
              onLlmDraftChange({ ...llmDraft, baseUrl: e.target.value })
            }
            placeholder='https://openrouter.ai/api/v1'
            className='h-9'
          />
        </div>
        <div className='space-y-2 md:col-span-2'>
          <Label
            htmlFor='llm-apikey'
            className='text-xs'
          >
            API Key
          </Label>
          <Input
            id='llm-apikey'
            type='password'
            value={llmDraft.apiKey}
            onChange={e =>
              onLlmDraftChange({ ...llmDraft, apiKey: e.target.value })
            }
            placeholder='sk-or-v1-...'
            className='h-9'
          />
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <SaveButton
          state={saveState}
          onClick={handleSave}
        />
        <FetchButton
          state={fetchState}
          onClick={handleFetchModels}
        />

        {errorMsg && (
          <div className='flex items-center gap-1.5 text-xs text-destructive'>
            <AlertCircle size={14} />
            {errorMsg}
          </div>
        )}
        {modelCount !== null && fetchState === 'success' && (
          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <CheckCircle2
              size={14}
              className='text-green-500'
            />
            已获取 {modelCount} 个模型
          </div>
        )}
      </div>
    </div>
  )
}

type SaveButtonProps = {
  state: LoadingState
  onClick: () => void
}

const SaveButton: React.FC<SaveButtonProps> = ({ state, onClick }) => {
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={onClick}
      disabled={state === 'loading'}
      className='gap-1.5'
    >
      {state === 'loading' && (
        <Loader2
          size={14}
          className='animate-spin'
        />
      )}
      {state === 'success' && <CheckCircle2 size={14} />}
      {state === 'loading'
        ? '保存中...'
        : state === 'success'
          ? '已保存'
          : '保存'}
    </Button>
  )
}

type FetchButtonProps = {
  state: LoadingState
  onClick: () => void
}

const FetchButton: React.FC<FetchButtonProps> = ({ state, onClick }) => {
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={onClick}
      disabled={state === 'loading'}
      className='gap-1.5'
    >
      {state === 'loading' && (
        <Loader2
          size={14}
          className='animate-spin'
        />
      )}
      {state === 'success' && <CheckCircle2 size={14} />}
      {state === 'loading'
        ? '获取中...'
        : state === 'success'
          ? '已完成'
          : '获取模型列表'}
    </Button>
  )
}
