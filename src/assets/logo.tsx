import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'
import { FolderKanban } from 'lucide-react'

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
      <FolderKanban className='size-4' />
    </div>
  )
}
