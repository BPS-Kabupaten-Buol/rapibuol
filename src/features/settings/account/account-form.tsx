import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface Profile {
  name: string
  email: string
}

export function AccountForm() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
        setIsLoading(false)
      })
  }, [user?.id])

  return (
    <div className='space-y-6'>
      <div className='grid gap-2'>
        <Label>Email</Label>
        {isLoading ? (
          <Skeleton className='h-9 w-full' />
        ) : (
          <Input value={profile?.email ?? user?.email ?? ''} disabled />
        )}
      </div>
      <div className='grid gap-2'>
        <Label>Nama</Label>
        {isLoading ? (
          <Skeleton className='h-9 w-full' />
        ) : (
          <Input value={profile?.name ?? ''} disabled />
        )}
      </div>
    </div>
  )
}
