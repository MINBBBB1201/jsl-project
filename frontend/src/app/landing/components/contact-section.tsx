"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Mail } from 'lucide-react'
import { contact } from '@/config/landing-content'

const contactFormSchema = z.object({
  company: z.string().min(2, {
    message: "회사명을 2자 이상 입력해 주세요.",
  }),
  name: z.string().min(2, {
    message: "담당자명을 2자 이상 입력해 주세요.",
  }),
  email: z.string().email({
    message: "올바른 이메일 주소를 입력해 주세요.",
  }),
  subject: z.string().min(5, {
    message: "제목을 5자 이상 입력해 주세요.",
  }),
  message: z.string().min(10, {
    message: "문의 내용을 10자 이상 입력해 주세요.",
  }),
})

export function ContactSection() {
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      company: "",
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  // TODO: 실제 문의 접수 API가 준비되면 연결 (현재는 콘솔 출력만)
  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    console.log(values)
    form.reset()
  }

  return (
    <section id="contact" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">{contact.badge}</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {contact.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {contact.description}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Channels */}
          <div className="space-y-6 order-2 lg:order-1">
            {contact.channels.map((channel) => (
              <Card key={channel.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <channel.icon className="h-5 w-5 text-primary" />
                    {channel.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {channel.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {contact.formTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>회사명</FormLabel>
                            <FormControl>
                              <Input placeholder={contact.formPlaceholders.company} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>담당자명</FormLabel>
                            <FormControl>
                              <Input placeholder={contact.formPlaceholders.name} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이메일</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={contact.formPlaceholders.email} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>제목</FormLabel>
                          <FormControl>
                            <Input placeholder={contact.formPlaceholders.subject} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>문의 내용</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={contact.formPlaceholders.message}
                              rows={10}
                              className="min-h-50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full cursor-pointer">
                      {contact.submitLabel}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
