import type { Metadata } from "next";
import "@/app/globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Toaster } from "@/components/ui/sonner";
import { beVietnamPro, generalSans, poppins } from "@/lib/fonts";

/**
 * 루트 레이아웃이 여러 개라서 <html> 문서 껍데기를 여기 한 곳에 둔다.
 *
 * 예전에는 app/layout.tsx 하나가 모든 경로를 감싸며 <html lang="ko"> 를 고정했다.
 * 루트 레이아웃은 [locale] 보다 위에 있어서 로케일을 알 수 없고, next-intl 의
 * getLocale() 로 읽으면 요청 헤더를 보게 되어 모든 페이지가 동적 렌더로 바뀐다.
 * 그래서 루트 레이아웃을 셋으로 나눴다 — 공개 페이지([locale]), 인증((auth)),
 * 대시보드((dashboard)). 각자 이 컴포넌트로 같은 문서를 그리고 lang 만 다르다.
 *
 * ⚠️ 루트 레이아웃끼리 오가는 이동(예: 랜딩 → 로그인)은 Next 가 전체 페이지를
 *    새로 불러온다. 클라이언트 상태가 이어지지 않는 것은 의도된 동작이다.
 */
export const rootMetadata: Metadata = {
  title: "JSL Logistics",
  description: "JSL Logistics 물류 운영 관리 시스템",
  // 파비콘은 로고에서 뽑은 정사각 마크를 쓴다 (public/logo-mark.png 기준)
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export function RootDocument({
  lang,
  children,
}: {
  lang: string;
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
      lang={lang}
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
