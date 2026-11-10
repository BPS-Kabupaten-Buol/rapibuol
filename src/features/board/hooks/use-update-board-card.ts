import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/handle-server-error'
import { updateActivity } from '@/features/activities/api/activities'
import {
  type Activity,
  type ActivityQuadrant,
  type UpdateActivityInput,
} from '@/features/activities/data/schema'
import {
  isMissingColumn,
  missingColumnHint,
} from '@/features/activities/lib/schema-column-error'

export type UpdateBoardCardPayload = {
  activity: Activity
  /** Kuadran tujuan; kosongkan kalau hanya mengubah status selesai. */
  quadrant?: ActivityQuadrant
  /** Diisi untuk menandai selesai / membatalkan selesai. */
  isDone?: boolean
}

const QUADRANT_LABELS: Record<ActivityQuadrant, string> = {
  'do-first': 'DO FIRST',
  schedule: 'SCHEDULE',
  delegate: 'DELEGATE',
  eliminate: 'ELIMINATE',
}

function buildPatch({
  quadrant,
  isDone,
}: UpdateBoardCardPayload): UpdateActivityInput {
  const patch: UpdateActivityInput = {}

  if (quadrant) patch.quadrant = quadrant
  if (isDone !== undefined) patch.is_done = isDone

  return patch
}

/** Memindah kartu board ke kuadran lain dan/atau mengubah status selesai. */
export function useUpdateBoardCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateBoardCardPayload) =>
      updateActivity(payload.activity.id, buildPatch(payload)),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['activities'] })

      const snapshot = queryClient.getQueriesData<Activity[]>({
        queryKey: ['activities'],
      })
      const patch = buildPatch(payload)

      queryClient.setQueriesData<Activity[]>(
        { queryKey: ['activities'] },
        (activities) =>
          activities?.map((item) =>
            item.id === payload.activity.id ? { ...item, ...patch } : item
          )
      )

      return { snapshot }
    },

    onError: (error, _payload, context) => {
      context?.snapshot.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })

      toast.error(
        isMissingColumn(error, 'quadrant')
          ? missingColumnHint(
              'quadrant',
              'docs/migrations/2026-11-10-activity-quadrant.sql'
            )
          : getErrorMessage(error)
      )
    },

    onSuccess: (_activity, { quadrant, isDone }) => {
      if (isDone === true) {
        toast.success('Aktivitas ditandai selesai.')
        return
      }

      if (isDone === false) {
        toast.success('Aktivitas dikembalikan ke board.')
        return
      }

      if (quadrant) {
        toast.success(`Aktivitas dipindah ke ${QUADRANT_LABELS[quadrant]}.`)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
