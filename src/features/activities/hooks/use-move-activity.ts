import { useMutation, useQueryClient } from '@tanstack/react-query'
import { parseISO } from 'date-fns'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/handle-server-error'
import { updateActivity } from '../api/activities'
import { type Activity } from '../data/schema'
import { shiftIsoDate } from '../lib/shift-date'

export type MoveActivityPayload = {
  activity: Activity
  deltaDays: number
}

/**
 * Menggeser tanggal aktivitas (dan end_date kalau ada) sebanyak `deltaDays`.
 * Cache `['activities']` diperbarui lebih dulu supaya bar langsung pindah.
 */
export function useMoveActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activity, deltaDays }: MoveActivityPayload) =>
      updateActivity(activity.id, {
        date: shiftIsoDate(activity.date, deltaDays),
        end_date: activity.end_date
          ? shiftIsoDate(activity.end_date, deltaDays)
          : null,
      }),

    onMutate: async ({ activity, deltaDays }) => {
      await queryClient.cancelQueries({ queryKey: ['activities'] })

      const snapshot = queryClient.getQueriesData<Activity[]>({
        queryKey: ['activities'],
      })

      queryClient.setQueriesData<Activity[]>(
        { queryKey: ['activities'] },
        (activities) =>
          activities?.map((item) =>
            item.id === activity.id
              ? {
                  ...item,
                  date: shiftIsoDate(item.date, deltaDays),
                  end_date: item.end_date
                    ? shiftIsoDate(item.end_date, deltaDays)
                    : null,
                }
              : item
          )
      )

      return { snapshot }
    },

    onError: (error, _payload, context) => {
      context?.snapshot.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast.error(getErrorMessage(error))
    },

    onSuccess: (activity) => {
      toast.success(
        `Aktivitas dipindah ke ${parseISO(activity.date).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}.`
      )
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
