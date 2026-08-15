"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { ThemeProviderContext } from "@/contexts/theme-context"

const Toaster = ({ ...props }: ToasterProps) => {
  // 이 프로젝트는 next-themes 가 아닌 자체 ThemeProvider 를 사용한다
  const { theme = "system" } = React.useContext(ThemeProviderContext)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
