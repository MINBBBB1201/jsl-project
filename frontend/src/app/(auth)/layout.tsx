import type { Metadata } from "next";

import { AuthProvider } from "@/contexts/auth-context";
import { RootDocument, rootMetadata } from "@/components/layout/root-document";

export const metadata: Metadata = {
  ...rootMetadata,
  title: "로그인 - JSL Logistics",
  description: "JSL 업무 포털 로그인",
  // 내부 업무 화면이라 검색 결과에 노출될 이유가 없다
  robots: { index: false, follow: false },
};

/** 인증 화면 루트 레이아웃 — 내부용이라 한국어로만 제공한다 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootDocument lang="ko">
      <AuthProvider>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </AuthProvider>
    </RootDocument>
  );
}
