export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="h-16 glass-header border-b border-white/30 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">DH</span>
          </div>
          <span className="font-semibold text-dark-100">Client Portal</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
