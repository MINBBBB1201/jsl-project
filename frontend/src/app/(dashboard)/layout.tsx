import { RootDocument, rootMetadata } from "@/components/layout/root-document";

import { DashboardLayoutClient } from "./dashboard-shell";

export const metadata = rootMetadata;

/** 대시보드 루트 레이아웃 — 내부용이라 한국어로만 제공한다 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootDocument lang="ko">
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </RootDocument>
  );
}
