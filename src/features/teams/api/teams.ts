import { supabase } from '@/lib/supabase'

export type Team = {
  id: number
  name: string
  leader: string | null // UUID as string, nullable for form handling
  created_at: string
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createTeam(
  team: Omit<Team, 'id' | 'created_at'>
): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: team.name,
      leader: team.leader,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTeam(
  id: number,
  team: Partial<Omit<Team, 'id' | 'created_at'>>
): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update({
      name: team.name,
      leader: team.leader,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTeam(id: number): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id)

  if (error) throw error
}
