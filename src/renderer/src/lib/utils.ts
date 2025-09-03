import { twMerge } from 'tailwind-merge'
import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

type DebouncedFunction<T extends (...args: unknown[]) => unknown> = ((
  ...args: Parameters<T>
) => void) & {
  flush: () => void
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let args: Parameters<T> | null = null
  let context: ThisParameterType<T> | null = null

  function flush(this: ThisParameterType<T>): void {
    if (timeout && args) {
      clearTimeout(timeout)
      timeout = null
      func.apply(context ?? this, args)
    }
  }

  function debounced(
    this: ThisParameterType<T>,
    ...newArgs: Parameters<T>
  ): void {
    context = this
    args = newArgs
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      if (args) {
        func.apply(context as ThisParameterType<T>, args)
      }
    }, wait)
  }

  return Object.assign(debounced, { flush }) as DebouncedFunction<T>
}
