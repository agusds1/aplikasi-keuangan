import { cn } from '@/lib/utils'

type MemberBadgeProps = {
  name: string
  avatar: string
  color: string
  size?: 'sm' | 'md'
  showName?: boolean
}

export function MemberBadge({
  name,
  avatar,
  color,
  size = 'sm',
  showName = true,
}: MemberBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={cn(
          'rounded-full flex items-center justify-center shrink-0',
          size === 'sm' ? 'w-5 h-5 text-xs' : 'w-7 h-7 text-sm'
        )}
        style={{ backgroundColor: `${color}30` }}
      >
        {avatar}
      </div>
      {showName && (
        <span
          className={cn(
            'font-medium',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
          style={{ color }}
        >
          {name}
        </span>
      )}
    </div>
  )
}