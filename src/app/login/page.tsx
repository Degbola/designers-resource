'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Login failed')
        return
      }

      const from = searchParams.get('from') || '/'
      router.push(from)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-3xl" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'linear-gradient(#1A4332 1px, transparent 1px), linear-gradient(90deg, #1A4332 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="w-full max-w-[360px] relative animate-fade-in">

        {/* Brand wordmark */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-[38px] font-normal text-dark-100 leading-tight tracking-tight mb-1">
            Seysey Studios
          </h1>
          <p className="text-xs text-dark-400 tracking-widest uppercase font-medium">
            Designer Resource Hub
          </p>
        </div>

        {/* Form card */}
        <div className="glass-strong rounded-lg overflow-hidden">

          {/* Card header strip */}
          <div className="px-6 py-4 border-b border-dark-600 dark:border-[rgba(255,255,255,0.06)] bg-dark-800/30 dark:bg-[rgba(255,255,255,0.02)]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-dark-400">Sign in</p>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/8 dark:bg-red-500/10 border border-red-400/20 dark:border-red-400/25 rounded px-3 py-2.5 text-xs text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}

              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-dark-300">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="!pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={15} />
                      Sign In
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-5 pt-5 border-t border-dark-600/50 dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between">
              <p className="text-xs text-dark-400">
                Don&apos;t have an account?
              </p>
              <Link href="/signup" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors">
                Sign up <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>

        {/* Palette accent dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {['#1A4332', '#2d6a4f', '#52b788', '#95d5b2', '#d8f3dc'].map((c, i) => (
            <span
              key={i}
              className="rounded-full border border-white/10"
              style={{
                backgroundColor: c,
                width: `${7 - i * 0.5}px`,
                height: `${7 - i * 0.5}px`,
                opacity: 0.55 - i * 0.04,
              }}
            />
          ))}
        </div>

        <p className="text-center text-[10px] text-dark-400/50 mt-4 tracking-wide">
          © Seysey Studios
        </p>
      </div>
    </div>
  )
}
