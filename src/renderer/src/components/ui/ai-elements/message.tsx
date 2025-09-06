import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@renderer/components/ui/avatar'
import { cn } from '@renderer/lib/utils'
import type { UIMessage } from 'ai'
import type { ComponentProps, HTMLAttributes } from 'react'

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-end gap-2 py-4',
      from === 'user'
        ? 'is-user justify-end [&>div]:max-w-[80%]'
        : 'is-assistant w-full justify-start [&>div]:max-w-none',
      className
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      'flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-sm text-foreground',
      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
      'group-[.is-assistant]:w-full group-[.is-assistant]:rounded-none group-[.is-assistant]:bg-transparent group-[.is-assistant]:px-0 group-[.is-assistant]:py-0 group-[.is-assistant]:text-foreground',
      'is-user:dark',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string
  name?: string
}

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar
    className={cn('size-8 ring-1 ring-border', className)}
    {...props}
  >
    <AvatarImage
      alt=''
      className='mb-0 mt-0'
      src={src}
    />
    <AvatarFallback>{name?.slice(0, 2) || 'ME'}</AvatarFallback>
  </Avatar>
)
