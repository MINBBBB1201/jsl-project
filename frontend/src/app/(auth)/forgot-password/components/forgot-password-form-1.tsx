"use client"

import Link from "next/link"
import { KeyRound, Mail } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { company } from "@/config/landing-content"

/**
 * 비밀번호 재설정 안내.
 *
 * 재설정 메일을 보내는 척하는 폼은 두지 않았다. 아직 메일 발송 인프라
 * (SMTP/발송 서비스·재설정 토큰 저장소)가 없어서, 폼을 남겨 두면 "보냈습니다"만
 * 뜨고 아무 일도 일어나지 않는다. 내부 직원 계정은 관리자가 직접 재발급하는 편이
 * 빠르므로 그 경로를 안내한다.
 *
 * TODO: 메일 발송이 붙으면 여기에 재설정 요청 폼과
 *       POST /api/auth/forgot-password 를 추가할 것.
 */
export function ForgotPasswordForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">비밀번호 재설정</CardTitle>
          <CardDescription>
            사내 계정 비밀번호는 관리자가 재발급합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              재설정 요청
            </p>
            <a
              href={`mailto:${company.contact.email}?subject=JSL 업무 포털 비밀번호 재설정 요청`}
              className="mt-1 block underline underline-offset-4"
            >
              {company.contact.email}
            </a>
            <p className="mt-2 text-muted-foreground">
              계정 이메일을 알려 주시면 임시 비밀번호를 발급해 드립니다.
            </p>
          </div>

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <KeyRound className="size-4" aria-hidden />
              관리자용
            </p>
            <p className="mt-1">
              시드 스크립트로 관리자 비밀번호를 재발급할 수 있습니다:
            </p>
            <code className="mt-2 block rounded bg-muted px-2 py-1 font-mono text-xs">
              npm run seed:admin -- --reset-password
            </code>
          </div>

          <Button asChild variant="outline" className="w-full cursor-pointer">
            <Link href="/sign-in">로그인 화면으로 돌아가기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
