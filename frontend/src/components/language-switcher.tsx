"use client"

import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useTransition } from "react"
import { Check, Globe, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "@/i18n/navigation"
import { LOCALE_LABELS, routing, type Locale } from "@/i18n/routing"

/**
 * 언어 스위처
 *
 * next-intl 의 usePathname 은 로케일 프리픽스를 뺀 경로를 돌려주므로,
 * 같은 경로를 유지한 채 언어만 바꿔 이동할 수 있다.
 */
export function LanguageSwitcher({
  className,
  align = "end",
}: {
  className?: string
  align?: "start" | "center" | "end"
}) {
  const t = useTranslations("common")
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const switchTo = (next: Locale) => {
    if (next === locale) return
    startTransition(() => {
      // params 를 함께 넘겨야 동적 세그먼트가 있는 경로도 유지된다
      router.replace(
        // @ts-expect-error -- pathname 은 라우팅 타입상 리터럴이어야 하지만
        // 여기서는 현재 경로를 그대로 재사용한다
        { pathname, params },
        { locale: next }
      )
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("languageLabel")}
          className={cn("cursor-pointer gap-1.5", className)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Globe className="size-4" aria-hidden />
          )}
          <span className="text-xs font-medium">{LOCALE_LABELS[locale].short}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="min-w-40">
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => switchTo(code)}
            className="cursor-pointer justify-between"
          >
            <span>{LOCALE_LABELS[code].label}</span>
            {code === locale && <Check className="size-4" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
