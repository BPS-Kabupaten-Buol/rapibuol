import { supabase } from '@/lib/supabase'
import {
  type CreateTaskInput,
  type Task,
  type UpdateTaskInput,
} from '../data/schema'

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('activities')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(
  id: number,
  input: UpdateTaskInput
): Promise<Task> {
  const { data, error } = await supabase
    .from('activities')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(id: number): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id)

  if (error) throw error
}

export async function deleteTasks(ids: number[]): Promise<void> {
  const { error } = await supabase.from('activities').delete().in('id', ids)

  if (error) throw error
}
