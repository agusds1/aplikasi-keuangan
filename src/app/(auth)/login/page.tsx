import { LoginForm } from './login-form'
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/select-profile')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-2xl font-bold">Keuangan Keluarga</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola keuangan bersama pasangan
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}