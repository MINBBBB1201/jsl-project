"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Logo } from '@/components/logo'
import { Mail, Phone, MapPin } from 'lucide-react'
import { company } from '@/config/landing-content'
import { useContent } from '@/config/use-content'

const newsletterSchema = z.object({
  email: z.string().email({
    message: "올바른 이메일 주소를 입력해 주세요.",
  }),
})


export function LandingFooter() {
  const { footer } = useContent()

  /*
    아이콘만 여기서 붙인다. 값과 라벨(대표 문의 / 한국지사)은 use-content 가
    company 와 messages 에서 조립해 준다 — 주소는 화면 언어에 따라 국문/영문이
    갈리므로 컴포넌트에서 고르지 않는다.
  */
  const lineIcons = { email: Mail, phone: Phone, address: MapPin } as const
  const contactLines = footer.contactLines.map((line) => ({
    ...line,
    icon: lineIcons[line.kind],
  }))

  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  })

  // TODO: 실제 구독 API가 준비되면 연결 (현재는 콘솔 출력만)
  function onSubmit(values: z.infer<typeof newsletterSchema>) {
    console.log(values)
    form.reset()
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        <div className="mb-16">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold mb-4">{footer.newsletter.title}</h3>
            <p className="text-muted-foreground mb-6">
              {footer.newsletter.description}
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 max-w-md mx-auto sm:flex-row">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={footer.newsletter.placeholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="cursor-pointer">
                  {footer.newsletter.submitLabel}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid gap-8 grid-cols-4 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-4 lg:col-span-2 max-w-2xl">
            <div className="flex items-center space-x-2 mb-4 max-lg:justify-center">
              <a href="/landing" className="flex items-center space-x-2 cursor-pointer">
                <Logo size={32} />
                <span className="font-bold text-xl">{company.name}</span>
              </a>
            </div>
            <p className="text-muted-foreground mb-6 max-lg:text-center">
              {footer.description}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground max-lg:flex max-lg:flex-col max-lg:items-center">
              {contactLines.map((line) => (
                <li key={line.value} className="flex items-start gap-2">
                  <line.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    {/*
                      메일이 둘이라 라벨 없이는 어느 쪽이 대표 문의인지 알 수 없다.
                      라벨은 값과 같은 줄에 두되 한 단계 흐리게 둔다.
                    */}
                    {line.label ? (
                      <span className="text-muted-foreground/70">{line.label} </span>
                    ) : null}
                    {line.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Columns */}
          {Object.entries(footer.links).map(([heading, links]) => (
            <div key={heading} className='max-md:col-span-2 lg:col-span-1'>
              <h4 className="font-semibold mb-4">{heading}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/*
          사업자 정보 — 법적 고지 목적의 최소 표기만 남긴다.

          등록·인증(국제물류주선업 등록번호, KIFFA 회원번호, 중소기업 확인)은
          랜딩의 인증 배지 섹션(certifications-bar.tsx)으로 옮겼다. 같은 내용을
          두 곳에 두면 번호를 고칠 때 한쪽만 고쳐질 위험이 있고, 푸터에서는
          여덟 항목이 한 덩어리로 뭉쳐 정작 법적으로 필요한 상호·대표자·
          등록번호가 묻혔다.

          이 푸터는 PublicPageShell 을 통해 /privacy, /terms, /tracking,
          /consulting 에서도 렌더되므로 여기 한 번 적어 두면 공개 페이지 전체가
          같은 표기를 갖는다. 배지 섹션은 랜딩에만 있으니 이 줄을 지우면 안 된다.
        */}
        <div className="mb-8 text-xs text-muted-foreground max-lg:text-center">
          <p className="flex flex-wrap gap-x-3 gap-y-1 max-lg:justify-center">
            {footer.legalInfo.map((item) => (
              <span key={item.label}>
                <span className="text-muted-foreground/70">{item.label}</span>{" "}
                {item.value}
              </span>
            ))}
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">{company.name}</span>
            <span className="hidden sm:inline">•</span>
            <span>© {new Date().getFullYear()} {footer.rights}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-4 md:mt-0">
            {footer.legalLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
