import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Team } from '../data/schema'
import { useTeams } from '../hooks'

const formSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  leader: z.string().optional().nullable(),
})

type TeamForm = z.infer<typeof formSchema>

interface TeamActionDialogProps {
  team?: Team
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamsActionDialog({
  team,
  open,
  onOpenChange,
}: TeamActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { teams } = useTeams()
  const form = useForm<TeamForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: team?.name ?? '',
      leader: team?.leader ?? undefined,
    },
  })

  const onSubmit = async (values: TeamForm) => {
    setIsLoading(true)
    try {
      if (team) {
        // Update existing team
        // Implementation would go here
        toast.success('Team updated successfully')
      } else {
        // Create new team
        // Implementation would go here
        toast.success('Team created successfully')
      }
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save team'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{team ? 'Edit Team' : 'Add New Team'}</DialogTitle>
          <DialogDescription>
            {team ? 'Update the team here.' : 'Create new team here.'}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <Form {...form}>
            <form
              id='team-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter team name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='leader'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Leader</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select a leader' />
                        </SelectTrigger>
                        <SelectContent>
                          {teams
                            .filter((t) => t.leader) // Only show teams with leaders as potential leaders
                            .map((t) => (
                              <SelectItem key={t.id} value={t.leader}>
                                {t.name} (Leader)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='team-form' disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {team ? 'Update Team' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
