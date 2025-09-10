'use client'

import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useCallback } from 'react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

export type ConversationProps = ComponentProps<typeof StickToBottom>

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn('relative overflow-y-auto', className)}
    initial='auto'
    resize='auto'
    role='log'
    {...props}
  />
)

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content
    className={cn('p-4', className)}
    {...props}
  />
)

export type ConversationScrollButtonProps = ComponentProps<typeof Button>

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  const handleScrollToBottom = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      const container = (e?.currentTarget as HTMLElement | null)?.closest(
        '[role="log"]'
      ) as HTMLElement | null
      if (container) {
        container.scrollTop = container.scrollHeight
      } else {
        // Fallback to library method if container not found
        scrollToBottom()
      }
    },
    [scrollToBottom]
  )

  return (
    !isAtBottom && (
      <Button
        className={cn(
          'absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full',
          className
        )}
        onClick={handleScrollToBottom}
        size='icon'
        type='button'
        variant='outline'
        {...props}
      >
        <ArrowDownIcon className='size-4' />
      </Button>
    )
  )
}
