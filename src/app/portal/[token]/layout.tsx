export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="h-16 glass-strong border-b border-white/30 dark:border-white/10 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm font-display">SS</span>
          </div>
          <div>
            <span className="font-display font-bold text-dark-100 text-sm tracking-tight">Seysey Studios</span>
            <p className="text-[10px] text-dark-400 -mt-0.5">Client Portal</p>
          </div>
        </div>
        <span className="text-xs text-dark-400 hidden sm:block">Your dedicated project space</span>
      </header>
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
