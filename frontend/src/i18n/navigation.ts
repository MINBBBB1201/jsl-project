import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

/**
 * 로케일을 자동으로 붙여주는 Link / router.
 * 공개 페이지에서는 next/link 대신 이 Link 를 쓴다.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
