import { twMerge } from 'tailwind-merge'
import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type DebouncedFunction<T extends (...args: any[]) => any> = T & {
  flush: () => void
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null = null
  let args: Parameters<T> | null = null

  function flush(this: any) {
    if (timeout && args) {
      clearTimeout(timeout)
      func.apply(this, args)
    }
  }

  function debounced(this: any, ...newArgs: Parameters<T>) {
    args = newArgs
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      if (args) {
        func.apply(this, args)
      }
    }, wait)
  }

  return Object.assign(debounced, { flush }) as DebouncedFunction<T>
}
