"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AlertCircle, Loader2 } from "lucide-react"

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/contexts/auth-context"

const loginFormSchema = z.object({
  email: z.email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

/** 로그인 후 돌아갈 경로. 외부 도메인으로 튕겨나가지 않도록 내부 경로만 허용한다. */
const safeNextPath = (raw: string | null) => {
  if (!raw) return "/dashboard"
  // '//evil.com' 같은 프로토콜 상대 URL 을 막는다
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard"
  return raw
}

export function LoginForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setError(null)
    try {
      await login(values.email, values.password)
      router.replace(safeNextPath(searchParams.get("next")))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요."
      )
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">JSL 업무 포털 로그인</CardTitle>
          <CardDescription>
            사내 계정으로 로그인하세요. 화물 조회는 로그인 없이 이용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="username"
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
                        <div className="flex items-center">
                          <FormLabel>비밀번호</FormLabel>
                          <Link
                            href="/forgot-password"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            비밀번호를 잊으셨나요?
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
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

                  <Button
                    type="submit"
                    className="w-full cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    )}
                    {isSubmitting ? "로그인 중..." : "로그인"}
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  계정이 필요하신가요?{" "}
                  <Link href="/sign-up" className="underline underline-offset-4">
                    계정 발급 안내
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        로그인하면 <Link href="/terms">이용약관</Link> 및{" "}
        <Link href="/privacy">개인정보처리방침</Link>에 동의하는 것으로 봅니다.
      </div>
    </div>
  )
}
