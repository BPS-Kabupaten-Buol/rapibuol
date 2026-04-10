import { useAuth } from '@/context/auth-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AccountForm() {
  const { user } = useAuth()

  const email = user?.email ?? ''
  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''

  return (
    <div className='space-y-6'>
      <div className='grid gap-2'>
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div className='grid gap-2'>
        <Label>Display Name</Label>
        <Input value={displayName} disabled />
      </div>
    </div>
  )
}
