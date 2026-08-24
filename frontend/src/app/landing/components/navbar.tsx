"use client"

import { useState } from 'react'
/*
  eslint-disable-next-line no-restricted-imports --
  공개 페이지 규칙의 의도적 예외다. 이 파일에서 next/link 로 남는 링크는
  /dashboard 와 /sign-in 넷뿐이고, 둘 다 사내용이라 번역 대상이 아니며
  middleware 의 LOCALIZED_SEGMENTS 에도 없다. app/[locale] 아래에 같은 라우트가
  없어서 로케일을 붙이면 /vi/dashboard 처럼 존재하지 않는 주소가 되어 404 가 난다.
  공개 라우트(/landing · /tracking · /consulting …)와 '#앵커' 는 이 아래
  LocaleLink · SiteLink 를 쓴다.
*/
import Link from 'next/link'
import { Link as LocaleLink } from '@/i18n/navigation'
import { SiteLink } from '@/components/site-link'
import { Menu, LayoutDashboard, ChevronDown, X, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Logo, LogoWordmark } from '@/components/logo'
import { MegaMenu } from '@/components/landing/mega-menu'
import { ModeToggle } from '@/components/mode-toggle'
import { useTheme } from '@/hooks/use-theme'
import { useContent, type MegaMenuAudience } from '@/config/use-content'
import { LanguageSwitcher } from '@/components/language-switcher'

// 모바일 메뉴용 — 데스크톱 메가메뉴와 동일한 항목을 평탄화해서 사용
type MobileMenuEntry = { title: string; name?: undefined; href?: undefined }
  | { title?: undefined; name: string; href: string }

// Smooth scroll function
const smoothScrollTo = (targetId: string) => {
  if (targetId.startsWith('#')) {
    const element = document.querySelector(targetId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }
}

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  // 화주/포워더 드롭다운을 각각 접었다 펼 수 있게 세그먼트별로 상태를 둔다
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const { setTheme, theme } = useTheme()
  const { company, navigation } = useContent()

  const navigationItems = navigation.items

  // 모바일에서는 메가메뉴를 섹션 제목 + 링크 목록으로 펼쳐 보여 준다
  const mobileMenuEntries = (audience: MegaMenuAudience): MobileMenuEntry[] =>
    navigation.megaMenus[audience].sections.flatMap((section) => [
      { title: section.title },
      ...section.items.map((item) => ({ name: item.title, href: item.href })),
    ])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/*
        헤더 높이 — 로고가 읽히는 크기를 먼저 정하고 거기서 역산했다.

        h-16(64px) 에 h-9/h-10(36/40px) 워드마크였는데, 워드마크는 정사각 마크와
        달리 "JSL LOGISTICS CO., LTD" 라는 작은 글자가 들어 있어서 40px 에서는
        회사명이 뭉개져 읽히지 않았다. 로고를 44/48px 로 올리고 위아래 여백
        (모바일 14px · sm 이상 16px)을 유지하도록 바를 72/80px 로 키웠다.

        스크롤 시 줄어드는 처리는 없다. 원래도 없었고 이번 범위 밖이다.
      */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-18 items-center justify-between sm:h-20">
        {/* Logo */}
        <div className="flex min-w-0 items-center space-x-2">
          {/*
            ⚠️ 여기만 LocaleLink 다. 아래 대시보드·로그인은 그대로 next/link 를
               쓴다 — 자세한 사정은 파일 아래 CTA 묶음 주석에.
          */}
          <LocaleLink href="/landing" className="flex min-w-0 items-center space-x-2 cursor-pointer">
            {/* 워드마크 안에 회사명이 이미 들어있어서 옆에 텍스트를 따로 두지 않는다.
                예전에는 정사각 마크 + 회사명 텍스트 조합이라, 베트남어처럼 라벨이 긴
                언어에서 텍스트가 첫 네비 항목과 겹쳐 넓은 폭에서 숨겨야 했다. */}
            <LogoWordmark className="h-11 shrink-0 sm:h-12" priority />
          </LocaleLink>
        </div>

        {/*
          Desktop Navigation

          3xl(1728px)부터 나온다. 예전에는 2xl(1536px)이었는데 거기서는 베트남어
          8개 항목(982px)이 로고와 우측 CTA 사이 자리(904px)에 들어가지 않아
          양쪽으로 39px 씩 겹쳤다. 자세한 계산은 globals.css 의 --breakpoint-3xl
          주석에 적어 뒀다. 그 아래 폭은 전부 오른쪽 햄버거 시트로 접힌다.
        */}
        <NavigationMenu className="hidden min-w-0 flex-1 justify-center 3xl:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                {item.megaMenu ? (
                  <>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent h-10 whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors hover:text-primary focus:text-primary cursor-pointer">
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <MegaMenu audience={item.megaMenu} />
                    </NavigationMenuContent>
                  </>
                ) : (
                  // href 를 실제로 넣는다. 예전에는 onClick 안에서
                  // window.location.href 로만 이동시켜 DOM 에 앵커가 없었는데,
                  // /tracking 처럼 라우트로 가는 항목이 생기면서 새 탭 열기·
                  // 스크린리더·크롤러가 링크를 인식하지 못하는 문제가 있었다.
                  // 페이지 내 앵커(#)일 때만 기본 동작을 막고 부드럽게 스크롤한다.
                  // asChild 로 SiteLink 를 안에 넣는다. radix 의
                  // NavigationMenuLink 는 href 를 받으면 순수 <a> 를 그리는데,
                  // 그러면 /tracking 이 로케일 없이 나가 베트남어로 보던 사람이
                  // 한국어 추적 페이지로 떨어진다 (실측으로 확인한 자리다).
                  <NavigationMenuLink asChild>
                    <SiteLink
                      href={item.href}
                      className="group inline-flex h-10 w-max items-center justify-center whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors hover:text-primary focus:text-primary focus:outline-none cursor-pointer"
                      onClick={(e: React.MouseEvent) => {
                        if (item.href.startsWith('#')) {
                          e.preventDefault()
                          smoothScrollTo(item.href)
                        }
                      }}
                    >
                      {item.name}
                    </SiteLink>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/*
          Desktop CTA

          바가 커진 만큼 버튼도 h-9(36px) 에서 h-10(40px) 으로 올려 네비 링크와
          높이를 맞춘다. 높이만 건드리고 글자 크기와 좌우 여백은 그대로 둔다.

          ⚠️ 여기서 글자를 키우거나 size="lg"(px-6) 로 바꾸지 말 것.
             네비 항목이 여덟 개라 가로 여유가 빠듯하다. 이 묶음이 넓어지면 그만큼
             가운데 네비 자리가 줄어든다 — 가장 긴 베트남어 기준으로 3xl(1728px)
             에서 남는 여백이 양쪽 57px 뿐이라, 여기서 한 버튼에 24px 을 더하면
             바로 겹침으로 돌아간다.
        */}
        {/*
          ⚠️ 아래 대시보드·로그인은 next/link 그대로 둘 것.

          /dashboard 와 /sign-in 은 사내용이라 번역 대상이 아니고 middleware 의
          LOCALIZED_SEGMENTS 에도 없다. app/[locale] 아래에 같은 라우트가 없으므로
          로케일을 붙이는 링크로 바꾸면 /vi/dashboard 처럼 존재하지 않는 주소가
          만들어져 404 가 난다. 공개 페이지(/landing · /tracking · /consulting ·
          /services · /privacy · /terms)만 LocaleLink · SiteLink 를 쓴다.
        */}
        <div className="hidden shrink-0 items-center space-x-1 3xl:flex">
          <LanguageSwitcher />
          <ModeToggle variant="ghost" />
          <Button variant="outline" asChild className="h-10 cursor-pointer">
            <Link href="/dashboard" target="_blank" rel="noopener noreferrer">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {navigation.dashboard}
            </Link>
          </Button>
          <Button variant="ghost" asChild className="h-10 cursor-pointer">
            <Link href="/sign-in">{navigation.signIn}</Link>
          </Button>
          <Button variant="brand" asChild className="h-10 cursor-pointer">
            <SiteLink href="#contact">{navigation.quoteCta}</SiteLink>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="3xl:hidden">
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0 gap-0 [&>button]:hidden overflow-hidden flex flex-col">
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="space-y-0 p-4 pb-2 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Logo size={16} />
                  </div>
                  <SheetTitle className="text-lg font-semibold">{company.name}</SheetTitle>
                  <div className="ml-auto flex items-center gap-1">
                    {/* 데스크톱 네비가 3xl 부터라, 그 아래 폭에서는 여기가 유일한 언어 전환 지점이다 */}
                    <LanguageSwitcher align="end" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                      className="cursor-pointer h-8 w-8"
                    >
                      <Moon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Sun className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="cursor-pointer h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-6 space-y-1">
                  {navigationItems.map((item) => (
                    <div key={item.name}>
                      {item.megaMenu ? (
                        <Collapsible
                          open={openMenus[item.megaMenu] ?? false}
                          onOpenChange={(open) =>
                            setOpenMenus((prev) => ({ ...prev, [item.megaMenu as string]: open }))
                          }
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            {item.name}
                            <ChevronDown className={`h-4 w-4 transition-transform ${openMenus[item.megaMenu] ? 'rotate-180' : ''}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-4 space-y-1">
                            {/* 세그먼트 안내 문구 — 데스크톱 메가메뉴와 같은 맥락을 준다 */}
                            <p className="px-4 pt-3 text-sm text-muted-foreground">
                              {navigation.megaMenus[item.megaMenu].question}
                            </p>
                            {/*
                              ⚠️ 판정을 solution.title 이 아니라 href 로 한다.
                                 두 갈래는 { title } 아니면 { name, href } 인데,
                                 title 로 가르면 TS 가 "빈 문자열 title" 가능성
                                 때문에 else 쪽에서도 href 를 string | undefined
                                 로 본다. href 가 있는 쪽에만 href 가 필수라
                                 이걸로 가르면 정확히 좁혀진다.
                            */}
                            {mobileMenuEntries(item.megaMenu).map((solution, index) => (
                              solution.href === undefined ? (
                                <div
                                  key={`title-${index}`}
                                  className="px-4 mt-5 py-2 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider"
                                >
                                  {solution.title}
                                </div>
                              ) : (
                                <SiteLink
                                  key={solution.name}
                                  href={solution.href}
                                  className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  onClick={(e) => {
                                    setIsOpen(false)
                                    if (solution.href.startsWith('#')) {
                                      e.preventDefault()
                                      setTimeout(() => smoothScrollTo(solution.href), 100)
                                    }
                                  }}
                                >
                                  {solution.name}
                                </SiteLink>
                              )
                            ))}
                            <SiteLink
                              href={navigation.megaMenus[item.megaMenu].cta.href}
                              onClick={() => setIsOpen(false)}
                              className="mt-3 flex items-center px-4 py-2 text-sm font-medium text-primary rounded-lg transition-colors hover:bg-accent cursor-pointer"
                            >
                              {navigation.megaMenus[item.megaMenu].cta.label}
                            </SiteLink>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SiteLink
                          href={item.href}
                          className="flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          onClick={(e) => {
                            setIsOpen(false)
                            if (item.href.startsWith('#')) {
                              e.preventDefault()
                              setTimeout(() => smoothScrollTo(item.href), 100)
                            }
                          }}
                        >
                          {item.name}
                        </SiteLink>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Footer Actions */}
              <div className="border-t p-6 space-y-4">

                {/* Primary Actions */}
                <div className="space-y-3">
                  <Button variant="outline" size="lg" asChild className="w-full cursor-pointer">
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-4" />
                      {navigation.dashboard}
                    </Link>
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" asChild className="cursor-pointer">
                      <Link href="/sign-in">{navigation.signIn}</Link>
                    </Button>
                    <Button variant="brand" asChild size="lg" className="cursor-pointer" >
                      <SiteLink href="#contact" onClick={() => setIsOpen(false)}>견적 문의</SiteLink>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
