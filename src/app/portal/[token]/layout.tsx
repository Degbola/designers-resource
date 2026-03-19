export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#F7F5F2' }}>
      {/* Letterpress texture — same as dashboard body::before, but scoped */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

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
