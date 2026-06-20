export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F5F2] dark:bg-[#0C120E]">
      {/* Header — mirrors dashboard glass-header */}
      <header className="glass-header sticky top-0 z-40 h-14 flex items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[11px]">SS</span>
          </div>
          <div className="leading-none">
            <p className="font-serif text-dark-100 text-[15px] tracking-tight leading-none">Seysey Studios</p>
            <p className="text-[9px] uppercase tracking-widest text-dark-400 mt-0.5">Client Portal</p>
          </div>
        </div>
        <span className="text-[11px] text-dark-400 hidden sm:block tracking-wide">Your dedicated project space</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-7 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  )
}
