import { supabase } from '@/lib/supabase'

export type Unit = {
  id: number
  name: string
  description: string | null
  created_at: string
}

export async function getUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('unit_measurement')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}
