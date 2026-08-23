import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Toaster } from "@/components/ui/sonner";
import { beVietnamPro, generalSans, poppins } from "@/lib/fonts";

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
  /*
    suppressHydrationWarning 은 아래 <html> 태그 하나에만 해당한다 (자식으로
    내려가지 않는다). ThemeProvider 가 마운트되면서 localStorage 와 시스템 테마
    설정을 읽어 className 에 'dark' 를 붙이는데, 서버는 그 둘을 알 수 없으므로
    서버 HTML 과 클라이언트 첫 렌더의 className 이 반드시 달라진다. React 는
    이걸 하이드레이션 불일치로 보고 콘솔에 경고를 찍는다.

    이건 고칠 수 있는 버그가 아니라 테마를 클라이언트에 저장하는 방식의 구조적
    결과다. 서버에서 맞히려면 테마를 쿠키로 옮겨야 하는데 그러면 정적 프리렌더를
    포기해야 한다. React 가 이 속성을 둔 이유가 정확히 이런 경우다.

    ⚠️ 실제 불일치를 덮어 버릴 수 있으므로 테마·로케일이 붙는 최상위 태그 밖으로
       퍼뜨리지 말 것.
  */
  return (
    <html
      lang="ko"
      className={`${generalSans.variable} ${poppins.variable} ${beVietnamPro.variable} antialiased`}
      suppressHydrationWarning
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
