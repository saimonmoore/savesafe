import * as React from "react"
import { useDropzone } from "react-dropzone"
import { UploadIcon, Trash2 } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { D } from "node_modules/react-router/dist/production/fog-of-war-BDQTYoRQ.d.mts"

export interface FileUploaderProps {
  maxFiles?: number
  maxSize?: number
  onFilesUploaded?: (files: File[]) => void
  accept?: Record<string, string[]>
  dropzoneText?: {
    title?: string
    description?: string
    browse?: string
    dragActive?: string
    fileCount?: string
    allowedTypes?: string
  }
}

export function FileUploader({
  maxFiles = 8,
  maxSize = 8 * 1024 * 1024, // 8MB default
  onFilesUploaded,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
  },
  dropzoneText = {
    title: "Upload files",
    description: "Drag and drop your files here or click to browse.",
    browse: "browse",
    dragActive: "Drop your files here",
    fileCount: `You can upload ${maxFiles} files (up to ${Math.round(maxSize / 1024 / 1024)}MB each)`,
    allowedTypes: "Allowed file types:",
  },
}: FileUploaderProps) {
  const [open, setOpen] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [invalidFileType, setInvalidFileType] = React.useState(false)

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setSelectedFiles((prev) => {
        const newFiles = [...prev, ...acceptedFiles]
        return newFiles.slice(0, maxFiles)
      })
      setInvalidFileType(rejectedFiles.length > 0)
    },
    [maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: maxFiles - selectedFiles.length,
    maxSize,
    accept,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => {
      setDragActive(false)
      setInvalidFileType(false)
    },
  })

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      onFilesUploaded?.(selectedFiles)
    }
    setOpen(false)
    setSelectedFiles([])
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedFiles([])
    setInvalidFileType(false)
  }

  const allowedExtensions = Object.values(accept).flat().join(', ')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <UploadIcon className="mr-2 h-4 w-4" />
        {dropzoneText.title}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dropzoneText.title}</DialogTitle>
          <DialogDescription>{dropzoneText.description}</DialogDescription>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={cn(
            "relative grid cursor-pointer place-items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-8 text-center transition-colors hover:bg-accent/50",
            dragActive && "border-primary bg-accent/50",
            (isDragReject || invalidFileType) && "border-destructive bg-destructive/10 cursor-no-drop"
          )}
        >
          <input {...getInputProps()} />
          <UploadIcon className={cn(
            "h-8 w-8 text-muted-foreground",
            (isDragReject || invalidFileType) && "text-destructive"
          )} />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive
                ? dropzoneText.dragActive
                : isDragReject || invalidFileType
                ? "File type not allowed"
                : dropzoneText.description}
            </p>
            <p className="text-sm text-muted-foreground">{dropzoneText.fileCount}</p>
          </div>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium">{dropzoneText.allowedTypes}</span> {allowedExtensions}
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Selected files:</p>
            <ul className="max-h-[200px] space-y-2 overflow-auto">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="mt-4 flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedFiles.length === 0}
          >
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}