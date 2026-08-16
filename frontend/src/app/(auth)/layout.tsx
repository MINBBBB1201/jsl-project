import type { Metadata } from "next";

import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "로그인 - JSL Logistics",
  description: "JSL 업무 포털 로그인",
  // 내부 업무 화면이라 검색 결과에 노출될 이유가 없다
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </AuthProvider>
  );
}
