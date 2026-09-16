"use client"

import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, Megaphone, Pin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/i18n/routing"
import { formatDate } from "./format-date"
import { usePublicNotices, type PublicNotice } from "./use-public-notices"

function NoticeCard({ notice }: { notice: PublicNotice }) {
  const locale = useLocale() as Locale
  const t = useTranslations("notices")

  return (
    <Card className={notice.isPinned ? "border-primary/40" : undefined}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          {notice.isPinned && (
            <Pin className="text-primary size-4 shrink-0 fill-current" aria-hidden />
          )}
          {notice.title}
          <Badge variant="outline" className="ms-auto">
            {t(`categories.${notice.category}`)}
          </Badge>
        </CardTitle>
        <p className="text-muted-foreground text-xs">{formatDate(notice.publishedAt, locale)}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{notice.body}</p>
      </CardContent>
    </Card>
  )
}

export function NoticesClient() {
  const t = useTranslations("notices")
  const { notices, isLoading, error } = usePublicNotices()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="mb-10 text-center">
        <div className="text-muted-foreground mb-3 flex items-center justify-center gap-2">
          <Megaphone className="size-5" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
      </header>

      {error ? (
        <Card className="border-destructive/50">
          <CardContent className="flex gap-3 p-5">
            <AlertCircle className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  )
}
