import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Toaster } from "@/components/ui/sonner";
import { generalSans, pretendard } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "JSL Logistics",
  description: "JSL Logistics 물류 운영 관리 시스템",
  // 파비콘은 로고에서 뽑은 정사각 마크를 쓴다 (public/logo-mark.png 기준)
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${generalSans.variable} ${pretendard.variable} antialiased`}
    >
      <body>
        <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
          <SidebarConfigProvider>
            {children}
            <Toaster richColors position="top-center" />
          </SidebarConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
