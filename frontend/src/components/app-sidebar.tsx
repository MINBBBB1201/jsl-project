"use client"

import * as React from "react"
import {
  LayoutDashboard,
  MessageCircle,
  ScanSearch,
  LayoutTemplate,
  FileText,
  Megaphone,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navGroups: [
    {
      label: "운영",
      items: [
        {
          title: "대시보드",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "업무 도구",
      items: [
        {
          title: "AI 업무 지원",
          url: "/chat",
          icon: MessageCircle,
        },
        {
          title: "화물 파손 판정",
          url: "/damage-inspection",
          icon: ScanSearch,
        },
        {
          title: "무역서류",
          url: "/trade-documents",
          icon: FileText,
        },
        {
          title: "공지사항",
          url: "/announcements",
          icon: Megaphone,
        },
      ],
    },
    {
      label: "외부 사이트",
      items: [
        {
          title: "JSL 홈페이지",
          url: "/landing",
          target: "_blank",
          icon: LayoutTemplate,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                {/*
                  사이드바는 라이트·다크 모두 어두운 면이라 어두운 바탕용 워드마크를
                  고정해서 쓴다. 정사각 마크(logo-mark.png)는 네이비 배경이 박혀 있어
                  이 면 위에서 색이 따로 논다.
                */}
                <Image
                  src="/logo-wordmark-dark.png"
                  alt="JSL LOGISTICS CO., LTD"
                  width={311}
                  height={240}
                  className="h-9 w-auto shrink-0 object-contain"
                />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="portal-eyebrow truncate !text-[#bcad9d]">Operations portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* 사용자 정보는 로그인 상태(AuthProvider)에서 직접 읽는다 */}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
