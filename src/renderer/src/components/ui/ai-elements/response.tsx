'use client'

import { cn } from '@renderer/lib/utils'
import { type ComponentProps, memo } from 'react'
import ReactMarkdown from 'react-markdown'

type ResponseProps = ComponentProps<typeof ReactMarkdown>

export const Response = memo(
  ({ className, ...props }: ResponseProps & { className?: string }) => (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert size-full max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className
      )}
    >
      <ReactMarkdown {...props} />
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
)

Response.displayName = 'Response'
