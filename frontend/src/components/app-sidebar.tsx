"use client"

import * as React from "react"
import {
  LayoutDashboard,
  MessageCircle,
  ScanSearch,
  Settings,
  LayoutTemplate,
  FileText,
  Megaphone,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

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
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "User Settings",
              url: "/settings/user",
            },
            {
              title: "Account Settings",
              url: "/settings/account",
            },
            {
              title: "Plans & Billing",
              url: "/settings/billing",
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
            },
            {
              title: "Connections",
              url: "/settings/connections",
            },
          ],
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">JSL Logistics</span>
                  <span className="truncate text-xs">Logistics Dashboard</span>
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
