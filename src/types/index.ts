export interface Client {
  id: number
  name: string
  email: string
  phone: string
  company: string
  address: string
  status: 'lead' | 'active' | 'completed' | 'archived'
  onboarding_step: number
  portal_token: string
  notes: string
  avatar_color: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  client_id: number
  name: string
  description: string
  status: 'not_started' | 'in_progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high'
  start_date: string
  due_date: string
  budget: number
  progress: number
  created_at: string
  updated_at: string
  client_name?: string
}

export interface Invoice {
  id: number
  invoice_number: string
  client_id: number
  project_id: number | null
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes: string
  paid_date: string | null
  created_at: string
  client_name?: string
  client_email?: string
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: number
  invoice_id: number
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Income {
  id: number
  client_id: number | null
  invoice_id: number | null
  amount: number
  category: string
  description: string
  date: string
  created_at: string
  client_name?: string
}

export interface Expense {
  id: number
  amount: number
  category: string
  description: string
  vendor: string
  date: string
  receipt_url: string
  created_at: string
}

export interface Resource {
  id: number
  title: string
  description: string
  url: string
  category: 'tools' | 'inspiration' | 'fonts' | 'colors' | 'icons' | 'stock' | 'learning'
  tags: string
  is_favorite: number
  created_at: string
}

export interface ProjectFile {
  id: number
  project_id: number
  name: string
  file_path: string
  file_type: string
  size: number
  uploaded_at: string
}

export interface WorkApproval {
  id: number
  project_id: number
  title: string
  description: string
  status: 'pending' | 'approved' | 'revision'
  client_feedback: string
  created_at: string
  project_name?: string
}

export interface FinanceSummary {
  total_income: number
  total_expenses: number
  net_profit: number
  monthly_data: { month: string; income: number; expenses: number }[]
  expense_categories: { category: string; total: number }[]
  income_categories: { category: string; total: number }[]
}

export interface User {
  id: number
  email: string
  password_hash: string
  name: string
  role: 'admin' | 'member'
  is_active: number
  permissions: string
  created_at: string
  updated_at: string
}

export type SafeUser = Omit<User, 'password_hash'>

export interface Session {
  id: number
  user_id: number
  token: string
  expires_at: string
  created_at: string
}
