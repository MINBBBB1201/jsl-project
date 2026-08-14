export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="px-4 py-6 lg:px-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">JSL Logistics</span>
            <span> &copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            물류 운영 관리 시스템
          </p>
        </div>
      </div>
    </footer>
  )
}
