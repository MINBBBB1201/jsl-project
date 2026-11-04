"use client"

import React from 'react'
import { useTranslations } from 'next-intl'
import { Palette, RotateCcw, Settings, X, Dices, Upload, ExternalLink, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useThemeManager } from '@/hooks/use-theme-manager'
import { useCircularTransition } from '@/hooks/use-circular-transition'
import { colorThemes, tweakcnThemes } from '@/config/theme-data'
import { radiusOptions, baseColors } from '@/config/theme-customizer-constants'
import { ColorPicker } from '@/components/color-picker'
import { ImportModal } from '@/components/theme-customizer/import-modal'
import { cn } from '@/lib/utils'
import type { ImportedTheme } from '@/types/theme-customizer'
import "@/components/theme-customizer/circular-transition.css"

interface LandingThemeCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LandingThemeCustomizer({ open, onOpenChange }: LandingThemeCustomizerProps) {
  const {
    applyImportedTheme,
    isDarkMode,
    resetTheme,
    applyRadius,
    setBrandColorsValues,
    applyTheme,
    applyTweakcnTheme,
    brandColorsValues,
    handleColorChange
  } = useThemeManager()

  const { toggleTheme } = useCircularTransition()

  // 빈 값으로 시작한다. "default" 로 두면 마운트 직후 shadcn 기본(무채색) 프리셋을
  // <html> 인라인 스타일로 덮어써서 globals.css 의 JSL 브랜드 컬러가 묻힌다.
  // 사용자가 커스터마이저에서 프리셋을 고르면 그때부터 적용된다.
  const [selectedTheme, setSelectedTheme] = React.useState("")
  const [selectedTweakcnTheme, setSelectedTweakcnTheme] = React.useState("")
  const [selectedRadius, setSelectedRadius] = React.useState("0.5rem")
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [importedTheme, setImportedTheme] = React.useState<ImportedTheme | null>(null)

  const handleReset = () => {
    // Reset all state variables to initial values
    setSelectedTheme("")
    setSelectedTweakcnTheme("")
    setSelectedRadius("0.5rem")
    setImportedTheme(null)
    setBrandColorsValues({})

    // Reset theme and radius to defaults
    resetTheme()
    applyRadius("0.5rem")
  }

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData)
    // Clear other selections to indicate custom import is active
    setSelectedTheme("")
    setSelectedTweakcnTheme("")

    // Apply the imported theme
    applyImportedTheme(themeData, isDarkMode)
  }

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  const handleRandomShadcn = () => {
    // Apply a random shadcn theme
    const randomTheme = colorThemes[Math.floor(Math.random() * colorThemes.length)]
    setSelectedTheme(randomTheme.value)
    setSelectedTweakcnTheme("")
    setBrandColorsValues({})
    setImportedTheme(null)
    applyTheme(randomTheme.value, isDarkMode)
  }

  const handleRandomTweakcn = () => {
    // Apply a random tweakcn theme
    const randomTheme = tweakcnThemes[Math.floor(Math.random() * tweakcnThemes.length)]
    setSelectedTweakcnTheme(randomTheme.value)
    setSelectedTheme("")
    setBrandColorsValues({})
    setImportedTheme(null)
    applyTweakcnTheme(randomTheme.preset, isDarkMode)
  }

  const handleRadiusSelect = (radius: string) => {
    setSelectedRadius(radius)
    applyRadius(radius)
  }

  const handleLightMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDarkMode === false) return
    toggleTheme(event)
  }

  const handleDarkMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDarkMode === true) return
    toggleTheme(event)
  }

  // Re-apply themes when theme mode changes
  React.useEffect(() => {
    if (importedTheme) {
      applyImportedTheme(importedTheme, isDarkMode)
    } else if (selectedTheme) {
      applyTheme(selectedTheme, isDarkMode)
    } else if (selectedTweakcnTheme) {
      const selectedPreset = tweakcnThemes.find(t => t.value === selectedTweakcnTheme)?.preset
      if (selectedPreset) {
        applyTweakcnTheme(selectedPreset, isDarkMode)
      }
    }
  }, [isDarkMode, importedTheme, selectedTheme, selectedTweakcnTheme, applyImportedTheme, applyTheme, applyTweakcnTheme])

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side="right"
          className="w-[400px] p-0 gap-0 pointer-events-auto [&>button]:hidden overflow-hidden flex flex-col"
          // SheetTrigger 없이 여는 패널이라 Radix 가 포커스를 돌려줄 곳을 모른다. 여는 버튼으로 돌려준다.
          onCloseAutoFocus={(e) => {
            const trigger = document.querySelector<HTMLElement>(`[${TRIGGER_ATTRIBUTE}]`)
            if (!trigger) return
            e.preventDefault()
            trigger.focus({ preventScroll: true })
          }}
          onInteractOutside={(e) => {
            // Prevent the sheet from closing when dialog is open
            if (importModalOpen) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader className="space-y-0 p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <SheetTitle className="text-lg font-semibold">Theme Customizer</SheetTitle>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleReset} className="cursor-pointer h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} className="cursor-pointer h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SheetDescription className="text-sm text-muted-foreground">
              Customize the theme and colors of your landing page.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Mode Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={!isDarkMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleLightMode}
                  className="cursor-pointer mode-toggle-button relative overflow-hidden"
                >
                  <Sun className="h-4 w-4 mr-1 transition-transform duration-300" />
                  Light
                </Button>
                <Button
                  variant={isDarkMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleDarkMode}
                  className="cursor-pointer mode-toggle-button relative overflow-hidden"
                >
                  <Moon className="h-4 w-4 mr-1 transition-transform duration-300" />
                  Dark
                </Button>
              </div>
            </div>

            <Separator />

            {/* Shadcn UI Theme Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Shadcn UI Theme Presets</Label>
                <Button variant="outline" size="sm" onClick={handleRandomShadcn} className="cursor-pointer">
                  <Dices className="h-3.5 w-3.5 mr-1.5" />
                  Random
                </Button>
              </div>

              <Select value={selectedTheme} onValueChange={(value) => {
                setSelectedTheme(value)
                setSelectedTweakcnTheme("")
                setBrandColorsValues({})
                setImportedTheme(null)
                applyTheme(value, isDarkMode)
              }}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Choose Shadcn Theme" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="p-2">
                    {colorThemes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.primary }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.secondary }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.accent }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.muted }}
                            />
                          </div>
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Tweakcn Theme Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tweakcn Theme Presets</Label>
                <Button variant="outline" size="sm" onClick={handleRandomTweakcn} className="cursor-pointer">
                  <Dices className="h-3.5 w-3.5 mr-1.5" />
                  Random
                </Button>
              </div>

              <Select value={selectedTweakcnTheme} onValueChange={(value) => {
                setSelectedTweakcnTheme(value)
                setSelectedTheme("")
                setBrandColorsValues({})
                setImportedTheme(null)
                const selectedPreset = tweakcnThemes.find(t => t.value === value)?.preset
                if (selectedPreset) {
                  applyTweakcnTheme(selectedPreset, isDarkMode)
                }
              }}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Choose Tweakcn Theme" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="p-2">
                    {tweakcnThemes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.primary }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.secondary }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.accent }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-border/20"
                              style={{ backgroundColor: theme.preset.styles.light.muted }}
                            />
                          </div>
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Radius Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Radius</Label>
              <div className="grid grid-cols-5 gap-2">
                {radiusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-md p-3 border transition-colors ${
                      selectedRadius === option.value
                        ? "border-primary"
                        : "border-border hover:border-border/60"
                    }`}
                    onClick={() => handleRadiusSelect(option.value)}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium">{option.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Import Theme Button */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleImportClick}
                className="w-full cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Import Theme
              </Button>
            </div>

            {/* Brand Colors Section */}
            <Accordion type="single" collapsible className="w-full border-b rounded-lg">
              <AccordionItem value="brand-colors" className="border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
                  <Label className="text-sm font-medium cursor-pointer">Brand Colors</Label>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-3 border-t border-border bg-muted/20">
                  {baseColors.map((color) => (
                    <div key={color.cssVar} className="flex items-center justify-between">
                      <ColorPicker
                        label={color.name}
                        cssVar={color.cssVar}
                        value={brandColorsValues[color.cssVar] || ""}
                        onChange={handleColorChange}
                      />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Tweakcn */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Advanced Customization</span>
              </div>
              <p className="text-xs text-muted-foreground">
                For advanced theme customization with real-time preview, visual color picker, and hundreds of prebuilt themes, visit{" "}
                <a
                  href="https://tweakcn.com/editor/theme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium cursor-pointer"
                >
                  tweakcn.com
                </a>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-pointer"
                onClick={() => window.open('https://tweakcn.com/editor/theme', '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open Tweakcn
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
      />
    </>
  )
}

/*
  떠 있는 버튼이 비켜야 하는 조작부. 운송 시퀀스의 모드 탭(01 ROAD~04 AIR)은 고정 구간 내내
  화면 아래에 붙어 있어, 좁은 폭에서는 04 · AIR 탭이 버튼 밑에 깔린다. 낮은 화면(320×640)에서는
  첫 화면의 히어로 화물조회 칸도 같은 자리에 온다. 엔진 마크업은 생성 파일이라 바꾸지 않고 위치만 읽는다.
*/
const TRIGGER_AVOID_SELECTORS = ["#jsl-marine-native .mm-mode-nav", ".journey-track-form"]
// 테마 패널이 닫힐 때 포커스를 돌려줄 버튼 표시
const TRIGGER_ATTRIBUTE = "data-landing-theme-trigger"
// 아래 className 의 bottom-6 · right-4 · h-12 w-12 와 같은 값
const TRIGGER_BOTTOM = 24
const TRIGGER_RIGHT = 16
const TRIGGER_SIZE = 48
const TRIGGER_GAP = 12

/** 기본 자리에서 조작부와 겹치면 그 위로 올릴 거리(px), 아니면 0 */
function measureTriggerLift() {
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight
  const left = viewportWidth - TRIGGER_RIGHT - TRIGGER_SIZE
  const top = viewportHeight - TRIGGER_BOTTOM - TRIGGER_SIZE
  let lift = 0
  for (const selector of TRIGGER_AVOID_SELECTORS) {
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      const rect = element.getBoundingClientRect()
      if (!rect.width || !rect.height || getComputedStyle(element).visibility === "hidden") continue
      const overlaps =
        rect.left < left + TRIGGER_SIZE + TRIGGER_GAP && rect.right > left - TRIGGER_GAP &&
        rect.top < top + TRIGGER_SIZE + TRIGGER_GAP && rect.bottom > top - TRIGGER_GAP
      // 조작부 윗변에서 간격만큼 띄운 자리로 버튼 아랫변을 올린다.
      if (overlaps) lift = Math.max(lift, viewportHeight - TRIGGER_BOTTOM - rect.top + TRIGGER_GAP)
    }
  }
  return Math.round(lift)
}

// Floating trigger button for landing page
export function LandingThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  const t = useTranslations("common")
  const [lift, setLift] = React.useState(0)

  // Measure at most once per frame, plus once after scrolling settles.
  // Target observers handle the engine appearing or changing visibility while idle.
  React.useEffect(() => {
    let frame = 0
    let settle = 0
    let targets: HTMLElement[] = []
    const update = () => {
      frame = 0
      setLift(measureTriggerLift())
    }
    const scheduleFrame = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const schedule = () => {
      scheduleFrame()
      window.clearTimeout(settle)
      settle = window.setTimeout(scheduleFrame, 450)
    }
    const targetChanges = new MutationObserver(scheduleFrame)
    const targetSizes = new ResizeObserver(scheduleFrame)
    const watchTargets = () => {
      const next = TRIGGER_AVOID_SELECTORS.flatMap(selector => Array.from(document.querySelectorAll<HTMLElement>(selector)))
      if (next.length === targets.length && next.every((item, index) => item === targets[index])) return
      targetChanges.disconnect()
      targetSizes.disconnect()
      targets = next
      for (const target of targets) {
        targetChanges.observe(target, { attributes: true, attributeFilter: ["style", "class", "hidden"] })
        targetSizes.observe(target)
      }
      scheduleFrame()
    }
    // The transport markup loads later and can be replaced when reduced motion changes.
    const structure = new MutationObserver(records => {
      // Ignore the engine's routine text updates; only rebind when a target or its container changes.
      const relevant = ".journey-track-form, .multimodal-guest, #jsl-marine-native, .mm-mode-nav"
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node =>
        node instanceof Element && (node.matches(relevant) || !!node.querySelector(relevant))
      ))) watchTargets()
    })
    const journey = document.querySelector(".journey")
    if (journey) structure.observe(journey, { childList: true, subtree: true })
    watchTargets()
    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    document.fonts.addEventListener("loadingdone", scheduleFrame)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settle)
      targetChanges.disconnect()
      targetSizes.disconnect()
      structure.disconnect()
      document.fonts.removeEventListener("loadingdone", scheduleFrame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])

  return (
    <Button
      onClick={onClick}
      style={{ transform: lift ? `translateY(-${lift}px)` : undefined, transition: "none" }}
      size="icon"
      /*
        아이콘만 있고 글자가 없는 버튼이라 aria-label 이 없으면 스크린리더가
        "버튼"이라고만 읽는다 (axe: button-name). 톱니 아이콘은 aria-hidden 인
        장식이므로 이름은 이 라벨에서만 나온다.
      */
      aria-label={t("themeSettingsLabel")}
      {...{ [TRIGGER_ATTRIBUTE]: "" }}
      // 세로 가운데에 두면 모바일 히어로 화물조회 칸과 데스크톱 진행 막대를 가려 오른쪽 아래로 둔다.
      className={cn(
        "fixed bottom-6 h-12 w-12 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer right-4 motion-reduce:transition-none"
      )}
    >
      <Settings className="h-5 w-5" aria-hidden="true" />
    </Button>
  )
}
