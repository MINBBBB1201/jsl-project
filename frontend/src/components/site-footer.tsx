import { company } from "@/config/landing-content"

/** 업무 포털 바닥줄. 랜딩의 작은 라벨과 같은 모양으로 한 줄만 둔다 */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="portal-eyebrow portal-eyebrow--quiet flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 lg:px-6">
        <span>JSL Operations portal</span>
        <span>
          &copy; {new Date().getFullYear()} {company.legalName}
        </span>
      </div>
    </footer>
  )
}
