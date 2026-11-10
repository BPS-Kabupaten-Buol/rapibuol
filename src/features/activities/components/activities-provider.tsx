import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Activity, type ActivityQuadrant } from '../data/schema'
import { useToggleActivityDone } from '../hooks/use-toggle-activity-done'

type ActivitiesDialogType = 'create' | 'update' | 'delete' | 'import'

type ActivitiesContextType = {
  open: ActivitiesDialogType | null
  setOpen: (str: ActivitiesDialogType | null) => void
  defaultDate: Date | null
  setDefaultDate: (date: Date | null) => void
  /** Kuadran awal saat membuat aktivitas dari kolom board. */
  defaultQuadrant: ActivityQuadrant | null
  setDefaultQuadrant: (quadrant: ActivityQuadrant | null) => void
  currentRow: Activity | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Activity | null>>
  detailActivity: Activity | null
  setDetailActivity: (activity: Activity | null) => void
  toggleDone: (activity: Activity) => void
  selectionMode: boolean
  setSelectionMode: (value: boolean) => void
}

const ActivitiesContext = React.createContext<ActivitiesContextType | null>(
  null
)

export function ActivitiesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<ActivitiesDialogType>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [defaultQuadrant, setDefaultQuadrant] =
    useState<ActivityQuadrant | null>(null)
  const [currentRow, setCurrentRow] = useState<Activity | null>(null)
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const { mutate: toggleDone } = useToggleActivityDone()

  return (
    <ActivitiesContext
      value={{
        open,
        setOpen,
        defaultDate,
        setDefaultDate,
        defaultQuadrant,
        setDefaultQuadrant,
        currentRow,
        setCurrentRow,
        detailActivity,
        setDetailActivity,
        toggleDone,
        selectionMode,
        setSelectionMode,
      }}
    >
      {children}
    </ActivitiesContext>
  )
}

export const useActivities = () => {
  const activitiesContext = React.useContext(ActivitiesContext)

  if (!activitiesContext) {
    throw new Error('useActivities has to be used within <ActivitiesContext>')
  }

  return activitiesContext
}
