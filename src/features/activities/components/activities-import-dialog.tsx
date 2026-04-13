import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, FileText, Upload, AlertCircle, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  parseDocxFromFile,
  convertParsedToActivityInput,
  type ParsedActivityRow,
} from '@/lib/import-docx'
import { useAuth } from '@/context/auth-provider'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createActivity } from '../api/activities'

type Step = 'upload' | 'preview' | 'importing' | 'complete'

type ActivityImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivitiesImportDialog({
  open,
  onOpenChange,
}: ActivityImportDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [parsedData, setParsedData] = useState<ParsedActivityRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [importedCount, setImportedCount] = useState(0)
  const [isParsing, setIsParsing] = useState(false)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const resetState = () => {
    setStep('upload')
    setParsedData([])
    setErrors([])
    setSelectedRows(new Set())
    setImportedCount(0)
    setIsParsing(false)
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      resetState()
    }
    onOpenChange(val)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (
      !selectedFile.name.endsWith('.docx') &&
      selectedFile.type !==
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      toast.error('Format file tidak didukung. Silakan upload file .docx')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB')
      return
    }

    setIsParsing(true)
    setStep('preview')

    try {
      const result = await parseDocxFromFile(selectedFile)

      if (!result.success || result.data.length === 0) {
        // Show parse errors and helpful message
        const errorMessages =
          result.errors.length > 0
            ? result.errors
            : ['Tidak dapat menemukan data aktivitas dalam dokumen']

        setErrors(errorMessages)
        setParsedData([])

        // Log for debugging
        console.error('Document parse result:', {
          file: selectedFile.name,
          success: result.success,
          dataCount: result.data.length,
          errors: result.errors,
        })

        setIsParsing(false)
        return
      }

      // Successfully parsed data
      setParsedData(result.data)

      // Show warnings if any
      if (result.errors.length > 0) {
        console.warn('Parse warnings:', result.errors)
        setErrors(result.errors)
      } else {
        setErrors([])
      }

      setSelectedRows(new Set(result.data.map((_, i) => i)))
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan tidak terduga saat memproses file'

      setErrors([`Error: ${errorMessage}`])
      setParsedData([])

      // Log error for debugging
      console.error('File processing error:', {
        file: selectedFile.name,
        error: err,
      })
    } finally {
      setIsParsing(false)
    }
  }

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const toggleAll = () => {
    if (selectedRows.size === parsedData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(parsedData.map((_, i) => i)))
    }
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const rowsToImport = parsedData.filter((_, i) => selectedRows.has(i))

      if (rowsToImport.length === 0) {
        throw new Error('Silakan pilih minimal 1 aktivitas untuk diimpor')
      }

      let count = 0

      for (const row of rowsToImport) {
        try {
          // All fields default to null per schema
          const input = convertParsedToActivityInput(row, user.id)
          await createActivity(input)
          count++
        } catch (error) {
          console.error('Error importing row:', { row, error })
          throw error
        }
      }

      return count
    },
    onMutate: () => {
      setStep('importing')
    },
    onSuccess: (count) => {
      setImportedCount(count)
      setStep('complete')
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success(`${count} aktivitas berhasil diimpor`)
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Gagal mengimpor aktivitas'
      toast.error(errorMessage)
      console.error('Import error:', {
        message: errorMessage,
        error: err,
      })
      setStep('preview')
    },
  })

  const renderUploadStep = () => (
    <>
      <DialogHeader className='text-start'>
        <DialogTitle>Impor Aktivitas dari DOCX</DialogTitle>
        <DialogDescription>
          Upload file .docx yang berisi data aktivitas. Data akan diparsing dan
          ditampilkan untuk konfirmasi sebelum diimpor.
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-4 py-4'>
        <div className='grid w-full max-w-sm items-center gap-1.5'>
          <Label htmlFor='docx-file'>File DOCX</Label>
          <Input
            id='docx-file'
            type='file'
            accept='.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            onChange={handleFileChange}
            className='cursor-pointer'
          />
        </div>

        <div className='rounded-md border border-dashed p-4'>
          <div className='flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground'>
            <FileText className='h-8 w-8' />
            <p>Pilih file .docx untuk import data aktivitas</p>
            <p className='text-xs'>
              Format yang didukung: tabel dengan kolom Tanggal, Waktu, Deskripsi
            </p>
          </div>
        </div>
      </div>

      <DialogFooter className='gap-2'>
        <DialogClose asChild>
          <Button variant='outline'>Tutup</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )

  const renderPreviewStep = () => (
    <>
      <DialogHeader className='text-start'>
        <DialogTitle>Pratinjau Data</DialogTitle>
        <DialogDescription>
          {parsedData.length} aktivitas ditemukan. Pilih data yang ingin
          diimpor.
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-4 py-4'>
        {errors.length > 0 && (
          <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
            <div className='flex items-center gap-2 font-semibold'>
              <AlertCircle className='h-4 w-4' />
              Peringatan:
            </div>
            <ul className='mt-1 list-inside list-disc'>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className='w-full overflow-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox
                    checked={
                      selectedRows.size === parsedData.length &&
                      parsedData.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Deskripsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.map((row, i) => (
                <TableRow
                  key={i}
                  className={selectedRows.has(i) ? '' : 'opacity-50'}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(i)}
                      onCheckedChange={() => toggleRow(i)}
                    />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    {row.startTime}
                    {row.endTime ? ` - ${row.endTime}` : ''}
                  </TableCell>
                  <TableCell
                    className='max-w-[150px] truncate sm:max-w-[250px]'
                    title={row.description}
                  >
                    {row.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DialogFooter className='gap-2'>
        <Button variant='outline' onClick={resetState}>
          Batal
        </Button>
        <Button
          onClick={() => importMutation.mutate()}
          disabled={selectedRows.size === 0}
        >
          <Upload className='mr-2 h-4 w-4' />
          Impor {selectedRows.size} Aktivitas
        </Button>
      </DialogFooter>
    </>
  )

  const renderImportingStep = () => (
    <>
      <DialogHeader className='text-start'>
        <DialogTitle>Mengimpor...</DialogTitle>
        <DialogDescription>
          Sedang mengimpor {selectedRows.size} aktivitas.
        </DialogDescription>
      </DialogHeader>

      <div className='flex flex-col items-center justify-center py-8'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='mt-4 text-sm text-muted-foreground'>Mohon tunggu...</p>
      </div>
    </>
  )

  const renderCompleteStep = () => (
    <>
      <DialogHeader className='text-start'>
        <DialogTitle>Impor Selesai</DialogTitle>
        <DialogDescription>
          {importedCount} aktivitas berhasil diimpor.
        </DialogDescription>
      </DialogHeader>

      <div className='flex flex-col items-center justify-center py-8'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
          <Check className='h-6 w-6 text-green-600' />
        </div>
        <p className='mt-4 text-sm text-muted-foreground'>
          Data aktivitas berhasil ditambahkan ke daftar Anda.
        </p>
      </div>

      <DialogFooter className='gap-2'>
        <DialogClose asChild>
          <Button onClick={() => handleClose(false)}>Tutup</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md gap-2 overflow-hidden sm:max-w-2xl'>
        {isParsing && (
          <div className='flex flex-col items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p className='mt-2 text-sm text-muted-foreground'>
              Memproses file...
            </p>
          </div>
        )}

        {!isParsing && step === 'upload' && renderUploadStep()}
        {!isParsing && step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
        {step === 'complete' && renderCompleteStep()}
      </DialogContent>
    </Dialog>
  )
}
