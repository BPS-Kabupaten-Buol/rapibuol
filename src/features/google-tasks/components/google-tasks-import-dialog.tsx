import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { AlertCircle, Check, CloudDownload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/handle-server-error'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  isMissingColumn,
  missingColumnHint,
} from '@/features/activities/lib/schema-column-error'
import {
  getGoogleClientId,
  getTasksToken,
  listTaskLists,
  listTasks,
  type GoogleTaskList,
} from '../api/google-tasks'
import {
  mapGoogleTasks,
  type GoogleTaskActivity,
} from '../lib/map-google-tasks'

const EXTERNAL_ID_MIGRATION =
  'docs/migrations/2026-11-10-activity-external-id.sql'

type Step = 'connect' | 'pick' | 'preview' | 'importing' | 'complete'

type GoogleTasksImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDue(date: string): string {
  return format(parseISO(date), 'd MMM yyyy', { locale: localeId })
}

export function GoogleTasksImportDialog({
  open,
  onOpenChange,
}: GoogleTasksImportDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('connect')
  const [lists, setLists] = useState<GoogleTaskList[]>([])
  const [listId, setListId] = useState('')
  const [rows, setRows] = useState<GoogleTaskActivity[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [duplicates, setDuplicates] = useState(0)
  const [skipped, setSkipped] = useState({ noDue: 0, invalid: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState(0)

  const clientId = getGoogleClientId()

  const reset = () => {
    setStep('connect')
    setLists([])
    setListId('')
    setRows([])
    setSelected(new Set())
    setDuplicates(0)
    setSkipped({ noDue: 0, invalid: 0 })
    setBusy(false)
    setError(null)
    setImported(0)
  }

  const handleClose = (value: boolean) => {
    if (!value) reset()
    onOpenChange(value)
  }

  const connect = async () => {
    if (!clientId) return

    setBusy(true)
    setError(null)

    try {
      const token = await getTasksToken(clientId)
      const taskLists = await listTaskLists(token)

      if (taskLists.length === 0) {
        throw new Error('Tidak ada task list di akun Google ini.')
      }

      setLists(taskLists)
      setListId((current) => current || taskLists[0].id)
      setStep('pick')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const loadTasks = async () => {
    if (!clientId || !user || !listId) return

    setBusy(true)
    setError(null)

    try {
      const token = await getTasksToken(clientId)
      const tasks = await listTasks(token, listId)
      const mapped = mapGoogleTasks(tasks)

      const { data: existing, error: existingError } = await supabase
        .from('activities')
        .select('external_id')
        .eq('user_id', user.id)
        .not('external_id', 'is', null)

      if (existingError) throw existingError

      const existingIds = new Set(
        (existing ?? [])
          .map((row) => row.external_id)
          .filter((value): value is string => typeof value === 'string')
      )

      const fresh = mapped.rows.filter(
        (row) => !existingIds.has(row.externalId)
      )

      setRows(fresh)
      setDuplicates(mapped.rows.length - fresh.length)
      setSkipped({ noDue: mapped.skippedNoDue, invalid: mapped.skippedInvalid })
      setSelected(new Set(fresh.map((row) => row.externalId)))
      setStep('preview')
    } catch (err) {
      setError(
        isMissingColumn(err, 'external_id')
          ? missingColumnHint('external_id', EXTERNAL_ID_MIGRATION)
          : getErrorMessage(err)
      )
    } finally {
      setBusy(false)
    }
  }

  const importSelected = async () => {
    if (!user) return

    const payload = rows
      .filter((row) => selected.has(row.externalId))
      .map((row) => ({
        description: row.description,
        date: row.date,
        end_date: null,
        start_time: null,
        end_time: null,
        volume: null,
        unit: null,
        assignor: null,
        is_done: row.isDone,
        user_id: user.id,
        link_bukti_dukung: null,
        coordinates: null,
        external_id: row.externalId,
      }))

    if (payload.length === 0) return

    setStep('importing')
    setError(null)

    const { error: insertError } = await supabase
      .from('activities')
      .insert(payload)

    if (insertError) {
      setError(
        isMissingColumn(insertError, 'external_id')
          ? missingColumnHint('external_id', EXTERNAL_ID_MIGRATION)
          : getErrorMessage(insertError)
      )
      setStep('preview')
      return
    }

    setImported(payload.length)
    setStep('complete')
    queryClient.invalidateQueries({ queryKey: ['activities'] })
    queryClient.invalidateQueries({ queryKey: ['tasks_period'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['heatmap'] })
    toast.success(`${payload.length} aktivitas diimpor dari Google Tasks.`)
  }

  const toggleRow = (externalId: string) => {
    const next = new Set(selected)

    if (next.has(externalId)) next.delete(externalId)
    else next.add(externalId)

    setSelected(next)
  }

  const toggleAll = () => {
    setSelected(
      selected.size === rows.length
        ? new Set()
        : new Set(rows.map((row) => row.externalId))
    )
  }

  const errorBox = error && (
    <div className='flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive'>
      <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
      <p className='break-words'>{error}</p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='flex max-h-[85vh] max-w-md flex-col overflow-hidden sm:max-w-2xl'>
        {step === 'connect' && (
          <>
            <DialogHeader className='text-start'>
              <DialogTitle>Impor dari Google Tasks</DialogTitle>
              <DialogDescription>
                Hubungkan akun Google, pilih daftar task, lalu impor ke
                aktivitas. Task yang sudah selesai ikut diimpor.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 py-2'>
              {!clientId ? (
                <div className='space-y-2 rounded-md border border-dashed p-4 text-xs text-muted-foreground'>
                  <p className='font-medium text-foreground'>
                    Client ID Google belum diatur.
                  </p>
                  <p>
                    Tambahkan <code>VITE_GOOGLE_CLIENT_ID</code> di berkas{' '}
                    <code>.env</code>, lalu jalankan ulang dev server.
                  </p>
                  <p>
                    Buat OAuth client tipe “Web application” di Google Cloud
                    Console, aktifkan Google Tasks API, dan daftarkan origin
                    aplikasi ini. Panduan lengkap ada di
                    docs/GOOGLE-TASKS.md.
                  </p>
                </div>
              ) : (
                <>
                  <p className='text-sm text-muted-foreground'>
                    RapiBuol hanya meminta akses baca ke Google Tasks. Token
                    disimpan di memori browser, tidak dikirim ke server mana
                    pun.
                  </p>
                  {errorBox}
                </>
              )}
            </div>

            <DialogFooter className='gap-2'>
              <DialogClose asChild>
                <Button variant='outline'>Tutup</Button>
              </DialogClose>
              <Button
                className='gap-1'
                onClick={connect}
                disabled={!clientId || busy}
              >
                {busy ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <CloudDownload className='h-4 w-4' />
                )}
                Hubungkan Google
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'pick' && (
          <>
            <DialogHeader className='text-start'>
              <DialogTitle>Pilih daftar task</DialogTitle>
              <DialogDescription>
                Task dari daftar yang dipilih akan ditarik beserta yang sudah
                selesai.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 py-2'>
              <Select value={listId} onValueChange={setListId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Pilih task list' />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errorBox}
            </div>

            <DialogFooter className='gap-2'>
              <Button variant='outline' onClick={() => setStep('connect')}>
                Kembali
              </Button>
              <Button
                className='gap-1'
                onClick={loadTasks}
                disabled={!listId || busy}
              >
                {busy ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <CloudDownload className='h-4 w-4' />
                )}
                Muat task
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'preview' && (
          <>
            <DialogHeader className='text-start'>
              <DialogTitle>Pratinjau task</DialogTitle>
              <DialogDescription>
                {rows.length} task siap diimpor
                {duplicates > 0 && `, ${duplicates} sudah pernah diimpor`}
                {skipped.noDue > 0 &&
                  `, ${skipped.noDue} tanpa tanggal dilewati`}
                {skipped.invalid > 0 &&
                  `, ${skipped.invalid} tidak valid dilewati`}
                .
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 overflow-hidden py-2'>
              {errorBox}

              {rows.length === 0 ? (
                <p className='rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground'>
                  Tidak ada task baru untuk diimpor dari daftar ini.
                </p>
              ) : (
                <div className='max-h-[45vh] overflow-auto rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-10'>
                          <Checkbox
                            checked={
                              selected.size === rows.length && rows.length > 0
                            }
                            onCheckedChange={toggleAll}
                            aria-label='Pilih semua'
                          />
                        </TableHead>
                        <TableHead>Tenggat</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead className='w-24'>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.externalId}
                          className={
                            selected.has(row.externalId) ? '' : 'opacity-50'
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selected.has(row.externalId)}
                              onCheckedChange={() => toggleRow(row.externalId)}
                              aria-label={`Pilih ${row.description}`}
                            />
                          </TableCell>
                          <TableCell className='whitespace-nowrap text-muted-foreground'>
                            {formatDue(row.date)}
                          </TableCell>
                          <TableCell className='max-w-[280px] truncate'>
                            {row.description}
                          </TableCell>
                          <TableCell>
                            {row.isDone ? (
                              <Badge
                                variant='default'
                                className='bg-green-500'
                              >
                                Selesai
                              </Badge>
                            ) : (
                              <Badge variant='secondary'>Belum</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter className='gap-2'>
              <Button variant='outline' onClick={() => setStep('pick')}>
                Kembali
              </Button>
              <Button
                className='gap-1'
                onClick={importSelected}
                disabled={selected.size === 0}
              >
                Impor {selected.size} aktivitas
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'importing' && (
          <>
            <DialogHeader className='text-start'>
              <DialogTitle>Mengimpor...</DialogTitle>
              <DialogDescription>
                Menyimpan {selected.size} aktivitas dari Google Tasks.
              </DialogDescription>
            </DialogHeader>
            <div className='flex flex-col items-center justify-center py-8'>
              <Loader2 className='h-10 w-10 animate-spin text-primary' />
            </div>
          </>
        )}

        {step === 'complete' && (
          <>
            <DialogHeader className='text-start'>
              <DialogTitle>Impor selesai</DialogTitle>
              <DialogDescription>
                {imported} aktivitas dari Google Tasks berhasil ditambahkan.
              </DialogDescription>
            </DialogHeader>
            <div className='flex flex-col items-center justify-center gap-3 py-8'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
                <Check className='h-6 w-6 text-green-600' />
              </div>
              <p className='text-sm text-muted-foreground'>
                Aktivitas selesai ikut tercatat dengan status selesai.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={() => handleClose(false)}>Tutup</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
