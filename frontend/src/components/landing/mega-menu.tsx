"use client"

import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useContent, type MegaMenuAudience } from '@/config/use-content'

/**
 * 방문자 세그먼트별 메가메뉴.
 *
 * 화주용/포워더용 드롭다운이 각각 열리며, 맨 위에 "화주이신가요?" 같은 안내 문구로
 * 지금 어느 경로를 보고 있는지 알려 준다. 항목 구성은 use-content.ts 의 megaMenus 참고.
 */
export function MegaMenu({ audience }: { audience: MegaMenuAudience }) {
  const { navigation } = useContent()
  const menu = navigation.megaMenus[audience]

  return (
    <div className="w-[700px] max-w-[95vw] bg-background p-4 sm:p-6 lg:p-8">
      {/* 세그먼트 안내 */}
      <div className="mb-6 border-b pb-4">
        <p className="text-base font-semibold text-foreground">{menu.question}</p>
        <p className="mt-1 text-sm text-muted-foreground">{menu.lead}</p>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-12',
          menu.sections.length > 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
        )}
      >
        {menu.sections.map((section) => (
          <div key={section.title} className="space-y-4 lg:space-y-6">
            {/* Section Header */}
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {section.title}
            </h3>

            {/* Section Links */}
            <div className="space-y-3 lg:space-y-4">
              {section.items.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="group block space-y-1 lg:space-y-2 hover:bg-accent rounded-md p-2 lg:p-3 -mx-2 lg:-mx-3 transition-colors my-0"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-6 lg:ml-7">
                    {item.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 세그먼트 전체 보기 */}
      <div className="mt-6 border-t pt-4">
        <a
          href={menu.cta.href}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          {menu.cta.label}
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  )
}
