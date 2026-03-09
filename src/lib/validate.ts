import { NextResponse } from 'next/server'

type Rule = {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'email'
  minLength?: number
  maxLength?: number
  min?: number
}

export function validate(body: Record<string, unknown>, rules: Rule[]): string | null {
  for (const rule of rules) {
    const value = body[rule.field]

    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${rule.field} is required`
    }

    if (value === undefined || value === null || value === '') continue

    if (rule.type === 'number' && typeof value !== 'number') {
      return `${rule.field} must be a number`
    }

    if (rule.type === 'string' && typeof value !== 'string') {
      return `${rule.field} must be a string`
    }

    if (rule.type === 'email' && typeof value === 'string') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${rule.field} must be a valid email`
      }
    }

    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return `${rule.field} must be at least ${rule.minLength} characters`
    }

    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return `${rule.field} must be at most ${rule.maxLength} characters`
    }

    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      return `${rule.field} must be at least ${rule.min}`
    }
  }

  return null
}

export function validationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}
