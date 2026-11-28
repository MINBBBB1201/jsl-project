"use client"

import * as React from "react"
import {
  EllipsisVertical,
  LogOut,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { ROLE_LABELS } from "@/lib/auth"

/**
 * 이름 첫 글자를 담은 사각 칸. 예전에는 모든 사용자에게 회사 로고 타일을 아바타처럼
 * 보여 줬는데, 누가 로그인했는지 구분되지 않고 네이비 타일이 이 면에서 색이 따로 놀았다.
 */
function UserInitial({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="bg-sidebar-accent text-sidebar-accent-foreground grid size-8 shrink-0 place-items-center text-sm font-semibold"
    >
      {name.trim().charAt(0) || "—"}
    </span>
  )
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = React.useCallback(async () => {
    await logout()
    router.replace("/sign-in")
  }, [logout, router])

  // RequireAuth 를 통과한 뒤에만 그려지므로 user 는 사실상 항상 있다.
  // 그래도 렌더 순서에 따라 잠깐 비어 있을 수 있어 대체 문구를 둔다.
  const name = user?.name ?? "—"
  const email = user?.email ?? ""
  const roleLabel = user ? ROLE_LABELS[user.role] : ""

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <UserInitial name={name} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {email}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserInitial name={name} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {name}
                    {roleLabel && (
                      <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                        {roleLabel}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role === "admin" && (
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/sign-up">
                    <UserPlus />
                    직원 계정 발급
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            {user?.role === "admin" && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
              <LogOut />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
