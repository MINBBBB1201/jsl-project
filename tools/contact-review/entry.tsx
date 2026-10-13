import { createRoot } from 'react-dom/client'
import { NextIntlClientProvider } from 'next-intl'
import { ContactSection } from '@/app/landing/components/contact-section'
import ko from '@/messages/ko.json'
import en from '@/messages/en.json'
import zh from '@/messages/zh.json'
import vi from '@/messages/vi.json'
const language = new URLSearchParams(location.search).get('language') ?? 'ko'
const messages = { ko, en, zh, vi }
document.documentElement.lang = language
if (new URLSearchParams(location.search).get('theme') === 'dark') document.documentElement.classList.add('dark')
createRoot(document.getElementById('root')!).render(<NextIntlClientProvider locale={language} messages={messages[language as keyof typeof messages]}><ContactSection /></NextIntlClientProvider>)
