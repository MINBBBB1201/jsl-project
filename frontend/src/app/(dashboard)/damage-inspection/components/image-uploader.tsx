"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { ImageUp, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, validateFile } from "../use-damage-inspection"

interface ImageUploaderProps {
  onInspect: (file: File) => void
  isInspecting: boolean
  onValidationError: (message: string) => void
  onClear: () => void
}

export function ImageUploader({
  onInspect,
  isInspecting,
  onValidationError,
  onClear,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const selectFile = useCallback(
    (next: File | undefined) => {
      if (!next) return
      const invalid = validateFile(next)
      if (invalid) {
        onValidationError(invalid)
        return
      }
      setFile(next)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(next)
      })
    },
    [onValidationError]
  )

  const clear = useCallback(() => {
    setFile(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    if (inputRef.current) inputRef.current.value = ""
    onClear()
  }, [onClear])

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="화물 사진 업로드"
        onClick={() => !isInspecting && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isInspecting) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!isInspecting) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (isInspecting) return
          selectFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "relative flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
          isInspecting && "pointer-events-none opacity-60"
        )}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="업로드한 화물 사진 미리보기"
            width={480}
            height={320}
            unoptimized
            className="max-h-72 w-auto rounded-md object-contain"
          />
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-3">
              <ImageUp className="size-6 text-primary" aria-hidden />
            </div>
            <div className="text-center">
              <p className="font-medium">화물 사진을 끌어다 놓거나 클릭해 선택하세요</p>
              <p className="mt-1 text-sm text-muted-foreground">
                jpg · png · 최대 {MAX_UPLOAD_BYTES / 1024 / 1024}MB
              </p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => selectFile(e.target.files?.[0])}
        />
      </div>

      {file && (
        <p className="truncate text-sm text-muted-foreground">
          선택됨: {file.name} ({(file.size / 1024).toFixed(0)}KB)
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => file && onInspect(file)}
          disabled={!file || isInspecting}
          className="flex-1 cursor-pointer"
        >
          {isInspecting && <Loader2 className="size-4 animate-spin" />}
          {isInspecting ? "판정 중..." : "파손 여부 판정하기"}
        </Button>

        {file && (
          <Button
            variant="outline"
            onClick={clear}
            disabled={isInspecting}
            className="cursor-pointer"
          >
            <X className="size-4" />
            <span className="sr-only">선택 취소</span>
          </Button>
        )}
      </div>
    </div>
  )
}
