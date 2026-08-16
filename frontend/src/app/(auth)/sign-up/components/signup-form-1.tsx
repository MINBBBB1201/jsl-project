"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { apiFetch, ROLE_LABELS, type AuthUser } from "@/lib/auth"
// 인증 화면은 [locale] 밖이라 번역 컨텍스트가 없다. 회사 정보는 상수에서 직접 가져온다.
import { company } from "@/config/landing-content"

/**
 * 계정 발급 화면.
 *
 * ⚠️ 공개 회원가입이 아니다. 여기서 만드는 계정은 대시보드와 화물 데이터 변경
 *    권한을 갖는 내부 직원 계정이라, 누구나 스스로 만들 수 있으면 로그인 게이트를
 *    세운 의미가 없다. 그래서 발급은 admin 계정으로 로그인한 상태에서만 가능하고,
 *    그 밖의 방문자에게는 발급 요청 안내를 보여 준다.
 *    (백엔드도 POST /api/auth/register 를 admin 역할로 제한한다.)
 */

const signupFormSchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  email: z.email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(10, "비밀번호는 10자 이상이어야 합니다."),
  role: z.enum(["admin", "operations", "sales"]),
})

type SignupFormValues = z.infer<typeof signupFormSchema>

const ROLE_HINTS: Record<SignupFormValues["role"], string> = {
  admin: "전체 권한 · 계정 발급 가능",
  operations: "화물 상태·위치 변경 가능",
  sales: "조회 전용",
}

function GuidanceCard({ status }: { status: "loading" | "unauthenticated" | "sales" }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">계정 발급 안내</CardTitle>
        <CardDescription>
          JSL 업무 포털은 사내 계정으로만 이용할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {status === "sales"
            ? "계정 발급은 관리자(admin) 권한이 있는 담당자만 할 수 있습니다."
            : "계정이 필요하시면 담당 관리자에게 요청해 주세요. 요청 시 이름·소속·필요한 권한(운영/영업)을 함께 알려 주시면 빠르게 처리됩니다."}
        </p>

        <div className="rounded-lg border p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Mail className="size-4 text-muted-foreground" aria-hidden />
            발급 요청
          </p>
          <a
            href={`mailto:${company.contact.email}?subject=JSL 업무 포털 계정 발급 요청`}
            className="mt-1 block underline underline-offset-4"
          >
            {company.contact.email}
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          화물 조회는 계정 없이 이용하실 수 있습니다.{" "}
          <Link href="/tracking" className="underline underline-offset-4">
            화물추적 바로가기
          </Link>
        </p>

        <Button asChild variant="outline" className="w-full cursor-pointer">
          <Link href="/sign-in">
            {status === "loading" ? "로그인 화면으로" : "로그인 화면으로 돌아가기"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function SignupForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { user, status } = useAuth()
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<AuthUser | null>(null)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", password: "", role: "sales" },
  })

  const onSubmit = async (values: SignupFormValues) => {
    setError(null)
    try {
      const data = await apiFetch<{ user: AuthUser }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      setCreated(data.user)
      form.reset()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "계정 발급에 실패했습니다."
      )
    }
  }

  if (status !== "authenticated" || user?.role !== "admin") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <GuidanceCard
          status={
            status === "loading"
              ? "loading"
              : status === "authenticated"
                ? "sales"
                : "unauthenticated"
          }
        />
      </div>
    )
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">직원 계정 발급</CardTitle>
          <CardDescription>
            관리자({user.email})로 로그인되어 있습니다. 새 직원 계정을 발급합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름</FormLabel>
                      <FormControl>
                        <Input placeholder="홍길동" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="off"
                          placeholder="name@jsl-logis.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>임시 비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormDescription>
                        10자 이상. 발급 후 본인에게 안전한 경로로 전달하세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>역할</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(ROLE_HINTS) as SignupFormValues["role"][]).map(
                            (role) => (
                              <SelectItem key={role} value={role} className="cursor-pointer">
                                {ROLE_LABELS[role]} — {ROLE_HINTS[role]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/50 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {error}
                  </p>
                )}

                {created && (
                  <p
                    role="status"
                    className="flex items-start gap-2 rounded-md border border-primary/40 p-3 text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {created.email} 계정을 발급했습니다 ({ROLE_LABELS[created.role]}).
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {isSubmitting ? "발급 중..." : "계정 발급"}
                </Button>

                <Button asChild variant="ghost" className="w-full cursor-pointer">
                  <Link href="/dashboard">대시보드로 돌아가기</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
