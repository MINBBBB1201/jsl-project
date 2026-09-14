"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

/**
 * 폼 필드 공통 껍데기.
 *
 * 라벨 · 에러 · 선택 표시를 한 군데서 처리한다. 무역서류 폼은 필드가 30개가
 * 넘어서, 각 필드마다 라벨과 에러를 따로 붙이면 어느 하나는 반드시 빠진다.
 */

function FieldShell({
  id,
  label,
  error,
  hint,
  optional,
  className,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  optional?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs">
        {label}
        {optional && (
          <span className="text-muted-foreground ml-1 font-normal">({optional})</span>
        )}
      </Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  placeholder,
  type = "text",
  inputMode,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  optional?: string
  placeholder?: string
  type?: "text" | "date"
  inputMode?: "decimal" | "numeric"
  className?: string
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      optional={optional}
      className={className}
    >
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(error && "border-destructive")}
      />
    </FieldShell>
  )
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: {
  id: string
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <FieldShell id={id} label={label} className={className}>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        {/* Radix Select 는 label 의 htmlFor 로 연결되지 않아 aria-label 을 직접 준다 */}
        <SelectTrigger id={id} className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}
