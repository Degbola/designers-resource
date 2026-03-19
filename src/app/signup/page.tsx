'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserPlus, ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Signup failed')
        return
      }

      router.push('/')
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
            <p className="text-[11px] font-semibold uppercase tracking-widest text-dark-400">Create account</p>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/8 dark:bg-red-500/10 border border-red-400/20 dark:border-red-400/25 rounded px-3 py-2.5 text-xs text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}

              <Input
                id="name"
                label="Full name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />

              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />

              <Input
                id="confirmPassword"
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="pt-1">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={15} />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-5 pt-5 border-t border-dark-600/50 dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between">
              <p className="text-xs text-dark-400">
                Already have an account?
              </p>
              <Link href="/login" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors">
                <ArrowLeft size={11} /> Sign in
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
