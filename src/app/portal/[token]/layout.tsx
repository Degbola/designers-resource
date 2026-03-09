export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900">
      <header className="h-16 bg-dark-800 border-b border-dark-600 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">DH</span>
          </div>
          <span className="font-semibold text-white">Client Portal</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
