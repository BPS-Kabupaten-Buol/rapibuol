import { useQuery } from '@tanstack/react-query'
import { getTeams } from '@/features/teams/api/teams'
import { getErrorMessage } from '@/lib/handle-server-error'

export function useTeams() {
  const query = useQuery({
    queryKey: ['teams', 'options'],
    queryFn: getTeams,
  })

  return {
    teams: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  }
}
