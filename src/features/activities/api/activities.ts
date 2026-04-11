import { supabase } from '@/lib/supabase'
import {
  type CreateActivityInput,
  type Activity,
  type UpdateActivityInput,
} from '../data/schema'

export async function getActivities(userId?: string): Promise<Activity[]> {
  let query = supabase
    .from('activities')
    .select('*')
    .order('date', {
      ascending: false,
    })
    .order('end_time', {
      ascending: false,
    })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createActivity(
  input: CreateActivityInput
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateActivity(
  id: number,
  input: UpdateActivityInput
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteActivity(id: number): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id)

  if (error) throw error
}

export async function deleteActivities(ids: number[]): Promise<void> {
  const { error } = await supabase.from('activities').delete().in('id', ids)

  if (error) throw error
}
