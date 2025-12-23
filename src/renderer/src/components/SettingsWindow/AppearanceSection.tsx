import { cn } from '@renderer/lib/utils'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Theme, ColorTheme } from '@renderer/types/theme'
import { getAllPalettes } from '@renderer/theme/palettes'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'

type AppearanceSectionProps = {
  currentTheme: Theme
  colorTheme: ColorTheme
  onThemeChange: (theme: Theme) => void
  onColorThemeChange: (palette: ColorTheme) => void
  isMacOS: boolean
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  currentTheme,
  colorTheme,
  onThemeChange,
  onColorThemeChange,
  isMacOS
}) => {
  return (
    <div className='space-y-6'>
      <div>
        <h3
          className={cn(
            'font-medium leading-none',
            isMacOS ? 'text-sm' : 'text-base'
          )}
        >
          主题
        </h3>
        <p className='mt-1.5 text-sm text-muted-foreground'>
          选择你喜欢的主题外观。
        </p>
        <div className='mt-3 flex items-center gap-2'>
          <ThemeButton
            active={currentTheme === 'light'}
            onClick={() => onThemeChange('light')}
            icon={<Sun size={16} />}
            label='浅色'
            isMacOS={isMacOS}
          />
          <ThemeButton
            active={currentTheme === 'dark'}
            onClick={() => onThemeChange('dark')}
            icon={<Moon size={16} />}
            label='深色'
            isMacOS={isMacOS}
          />
          <ThemeButton
            active={currentTheme === 'system'}
            onClick={() => onThemeChange('system')}
            icon={<Monitor size={16} />}
            label='跟随系统'
            isMacOS={isMacOS}
          />
        </div>
      </div>

      <div>
        <h4
          className={cn(
            'font-medium leading-none',
            isMacOS ? 'text-sm' : 'text-base'
          )}
        >
          配色
        </h4>
        <div className='mt-3 w-full md:w-[280px]'>
          <Select
            value={colorTheme}
            onValueChange={v => onColorThemeChange(v as ColorTheme)}
          >
            <SelectTrigger>
              <SelectValue placeholder='选择配色' />
            </SelectTrigger>
            <SelectContent>
              {getAllPalettes().map(p => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                >
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

type ThemeButtonProps = {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  isMacOS: boolean
}

const ThemeButton: React.FC<ThemeButtonProps> = ({
  active,
  onClick,
  icon,
  label,
  isMacOS
}) => {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size={isMacOS ? 'sm' : 'default'}
      onClick={onClick}
      className='gap-2'
    >
      {icon} {label}
    </Button>
  )
}
