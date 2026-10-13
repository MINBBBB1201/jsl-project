"use client"

import { Link } from "@/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  FormDescription,
} from "@/components/ui/form"
import { Loader2, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { inquiryCopy } from '@/lib/contact-inquiry-copy'
import { inquiryPayload, readNotice, readReceipt, retryIdentity, type ContactNotice, type InquiryReceipt, type InquiryLanguage } from '@/lib/contact-inquiry'
import { useContent } from '@/config/use-content'
import { API_BASE_URL } from '@/lib/api'

export function ContactSection() {
  const { contact } = useContent()
  const language = useLocale() as InquiryLanguage
  const copy = inquiryCopy[language] ?? inquiryCopy.ko
  const [notice, setNotice] = useState<ContactNotice | null>(null)
  const [noticeAttempt, setNoticeAttempt] = useState(0)
  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null)
  const [failure, setFailure] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  const retryRef = useRef<{ identity: string; key: string } | null>(null)
  const sendingRef = useRef(false)
  const contactFormSchema = z.object({
    company: z.string().trim().max(200, copy.invalid),
    name: z.string().trim().min(1, copy.invalid).max(100, copy.invalid),
    email: z.string().trim().email(copy.invalid).max(320, copy.invalid),
    subject: z.string().trim().max(200, copy.invalid),
    message: z.string().trim().min(1, copy.invalid).max(5000, copy.invalid),
    privacyConsent: z.boolean().refine(value => value === true, copy.consent),
  })
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { company: '', name: '', email: '', subject: '', message: '', privacyConsent: false },
  })
  const { setValue } = form
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    let active = true
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contact/notice?language=${language}`, { signal: controller.signal, cache: 'no-store' })
        const current = response.ok ? readNotice(await response.json(), language) : null
        if (active) { setNotice(current); setValue('privacyConsent', false) }
      } catch { if (active) setNotice(null) }
      finally { clearTimeout(timeout) }
    }
    void load()
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [language, noticeAttempt, setValue])
  useEffect(() => { if (failure) errorRef.current?.focus() }, [failure])
  const isSubmitting = form.formState.isSubmitting
  const hasConsented = useWatch({ control: form.control, name: 'privacyConsent' })
  const currentNotice = notice?.language === language ? notice : null
  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    if (!currentNotice || sendingRef.current) return
    sendingRef.current = true
    setFailure('')
    setReceipt(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const identity = retryIdentity({ ...values, company: currentNotice.items.includes('companyName') ? values.company : '', subject: currentNotice.items.includes('subject') ? values.subject : '' }, language)
      if (retryRef.current?.identity !== identity) retryRef.current = { identity, key: crypto.randomUUID() }
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': retryRef.current.key },
        body: JSON.stringify(inquiryPayload(values, currentNotice)),
      })
      const result = await response.json().catch(() => null)
      if (response.status === 409 && Array.isArray(result?.errors) && result.errors.some((error: { code?: string }) => error?.code === 'NOTICE_CHANGED')) {
        setValue('privacyConsent', false)
        setNotice(null)
        setNoticeAttempt(value => value + 1)
        setFailure(copy.changed)
        return
      }
      const confirmed = response.ok ? readReceipt(result) : null
      if (!confirmed) { setFailure(copy.failed); return }
      setReceipt(confirmed)
    } catch { setFailure(copy.failed) }
    finally { clearTimeout(timeout); sendingRef.current = false }
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
                  <form noValidate onSubmit={event => { void form.handleSubmit(onSubmit)(event) }} className="space-y-6">
                    {!currentNotice && <div role="status" className="rounded-lg border p-4"><p>{copy.unavailable}</p><Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => setNoticeAttempt(value => value + 1)}>{copy.retry}</Button></div>}
                    {failure && <p ref={errorRef} role="alert" tabIndex={-1} className="rounded-lg border p-4">{failure}</p>}
                    {receipt && <p role="status" aria-live="polite" className="break-all rounded-lg border p-4">{contact.successTitle} · {copy.receipt}: {receipt.id}</p>}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{contact.fields.company} ({copy.optional})</FormLabel>
                            <FormControl>
                              <Input maxLength={200} disabled={isSubmitting || !currentNotice?.items.includes('companyName')} autoComplete="organization" placeholder={contact.formPlaceholders.company} {...field} />
                            </FormControl>
                            <FormDescription className="sr-only">{copy.optional}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{contact.fields.name} ({copy.required})</FormLabel>
                            <FormControl>
                              <Input aria-required maxLength={100} disabled={isSubmitting || !currentNotice} autoComplete="name" placeholder={contact.formPlaceholders.name} {...field} />
                            </FormControl>
                            <FormDescription className="sr-only">{copy.required}</FormDescription>
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
                          <FormLabel>{contact.fields.email} ({copy.required})</FormLabel>
                          <FormControl>
                            <Input aria-required type="email" maxLength={320} disabled={isSubmitting || !currentNotice} autoComplete="email" placeholder={contact.formPlaceholders.email} {...field} />
                          </FormControl>
                          <FormDescription className="sr-only">{copy.required}</FormDescription>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{contact.fields.subject} ({copy.optional})</FormLabel>
                          <FormControl>
                            <Input maxLength={200} disabled={isSubmitting || !currentNotice?.items.includes('subject')} autoComplete="off" placeholder={contact.formPlaceholders.subject} {...field} />
                          </FormControl>
                          <FormDescription className="sr-only">{copy.optional}</FormDescription>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{contact.fields.message} ({copy.required})</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={contact.formPlaceholders.message}
                              aria-required
                              rows={10}
                              maxLength={5000}
                              disabled={isSubmitting || !currentNotice}
                              className="min-h-50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="sr-only">{copy.required}</FormDescription>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="privacyConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-4">
                          <FormControl>
                            <Checkbox
                              aria-required
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              disabled={isSubmitting || !currentNotice}
                              className="mt-0.5 h-6 w-6 cursor-pointer"
                            />
                          </FormControl>
                          <div className="space-y-1.5">
                            {/*
                              링크는 FormLabel 밖에 둔다. label 안의 링크는
                              클릭 시 체크박스까지 토글되고 접근성상으로도
                              중첩 인터랙티브 요소가 된다.
                            */}
                            <div className="flex flex-wrap items-center gap-x-2">
                              <FormLabel className="font-normal cursor-pointer">
                                {contact.consentLabel}
                              </FormLabel>
                              <Link
                                href="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline underline-offset-4 text-muted-foreground hover:text-primary"
                              >
                                {contact.consentLink}
                              </Link>
                            </div>
                            <FormDescription className="text-sm text-foreground break-words">
                              {currentNotice ? <>
                                <span className="block">{copy.purpose}: {currentNotice.purpose}</span>
                                <span className="block">{copy.items}: {currentNotice.items.map(item => ({ companyName: contact.fields.company, contactName: contact.fields.name, email: contact.fields.email, subject: contact.fields.subject, message: contact.fields.message })[item]).join(', ')}</span>
                                <span className="block">{copy.retention}: {currentNotice.retentionDescription}</span>
                                <span className="block">{copy.refusal}: {currentNotice.refusalConsequence}</span>
                                <span className="block">{copy.contact}: {currentNotice.privacyContact}</span>
                                <span className="block">{copy.date}: {currentNotice.effectiveDate}</span>
                              </> : copy.unavailable}
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full min-h-11 cursor-pointer"
                      disabled={isSubmitting || !hasConsented || !currentNotice}
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isSubmitting ? contact.submittingLabel : contact.submitLabel}
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
