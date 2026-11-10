import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/handle-server-error'
import { updateActivity } from '../api/activities'
import { type Activity } from '../data/schema'

/**
 * Centang/batal centang satu aktivitas. Cache `['activities']` diperbarui lebih
 * dulu supaya checkbox langsung berubah, lalu di-rollback bila request gagal.
 */
export function useToggleActivityDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activity: Activity) =>
      updateActivity(activity.id, { is_done: !activity.is_done }),

    onMutate: async (activity) => {
      await queryClient.cancelQueries({ queryKey: ['activities'] })

      const snapshot = queryClient.getQueriesData<Activity[]>({
        queryKey: ['activities'],
      })

      queryClient.setQueriesData<Activity[]>(
        { queryKey: ['activities'] },
        (activities) =>
          activities?.map((item) =>
            item.id === activity.id
              ? { ...item, is_done: !activity.is_done }
              : item
          )
      )

      return { snapshot }
    },

    onError: (error, _activity, context) => {
      context?.snapshot.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast.error(getErrorMessage(error))
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
