import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Command, X, ExternalLink } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'

interface QuickAction {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
  action: () => void
}

const QuickWindow: React.FC = () => {
  const [searchValue, setSearchValue] = useState<string>('')
  const [filteredActions, setFilteredActions] = useState<QuickAction[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 示例操作列表 - 可以根据需要扩展
  const allActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'settings',
        title: '打开设置',
        description: '打开应用程序设置',
        icon: <Command size={16} />,
        action: () => {
          window.electron.openSettings()
          window.electron.hideQuickWindow()
        }
      },
      {
        id: 'open-website',
        title: '访问官网',
        description: '在浏览器中访问官网',
        icon: <ExternalLink size={16} />,
        action: () => {
          window.electron.openExternalUrl('https://example.com')
          window.electron.hideQuickWindow()
        }
      }
      // 可以根据需要添加更多操作
    ],
    []
  )

  // 过滤操作
  useEffect(() => {
    if (searchValue.trim() === '') {
      setFilteredActions(allActions)
    } else {
      const filtered = allActions.filter(
        action =>
          action.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          action.description.toLowerCase().includes(searchValue.toLowerCase())
      )
      setFilteredActions(filtered)
    }
    setSelectedIndex(0)
  }, [searchValue, allActions])

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < filteredActions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Enter' && filteredActions.length > 0) {
      filteredActions[selectedIndex].action()
    }
  }

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className='flex h-screen flex-col'>
      {/* 背景遮罩层 - 深色半透明背景 */}
      {/* <div className="absolute inset-0 bg-black/20" /> */}

      {/* 主内容区 - 带毛玻璃效果 */}
      <div className='relative flex h-full flex-col p-6 backdrop-blur-xl backdrop-saturate-150'>
        <div className='relative mb-4'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <Search className='h-5 w-5 text-gray-400' />
          </div>
          <Input
            id='quick-search-input'
            ref={inputRef}
            type='text'
            className='pl-10'
            placeholder='搜索命令...'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchValue && (
            <Button
              variant='ghost'
              size='icon'
              className='absolute inset-y-0 right-0 my-1.5 mr-1.5'
              onClick={() => setSearchValue('')}
              title='清除'
            >
              <X className='h-5 w-5 opacity-70' />
            </Button>
          )}
        </div>

        <div className='flex-1 overflow-y-auto'>
          {filteredActions.length > 0 ? (
            <ul className='space-y-2'>
              {filteredActions.map((action, index) => (
                <li
                  key={action.id}
                  className={`flex cursor-pointer items-center rounded-lg p-3 backdrop-blur-sm ${
                    index === selectedIndex
                      ? 'bg-blue-600/80 text-white'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => action.action()}
                >
                  {action.icon && <div className='mr-3'>{action.icon}</div>}
                  <div>
                    <p className='font-medium'>{action.title}</p>
                    <p className='text-xs text-gray-400'>
                      {action.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className='flex h-full items-center justify-center text-gray-400'>
              <p>没有找到匹配的命令</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuickWindow
