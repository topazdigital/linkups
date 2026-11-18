'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'wouter'
import { useLogin, useGetAuthSession, getGetAuthSessionQueryKey } from '@workspace/api-client-react'
import { useQueryClient } from '@tanstack/react-query'
import { Logo } from '@/components/site-shell'

function errorMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message
  return 'Sign-in could not be completed. Please try again.'
}

export default function LoginPage() {
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const session = useGetAuthSession()
  const login = useLogin()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!session.data?.authenticated) return
    setLocation(session.data.role === 'admin' ? '/admin' : '/dashboard')
  }, [session.data, setLocation])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      const nextSession = await login.mutateAsync({
        data: {
          email: String(form.get('email') ?? '').trim(),
          password: String(form.get('password') ?? ''),
        },
      })
      queryClient.setQueryData(getGetAuthSessionQueryKey(), nextSession)
      await queryClient.invalidateQueries({ queryKey: getGetAuthSessionQueryKey() })
      setLocation(nextSession.role === 'admin' ? '/admin' : '/dashboard')
    } catch (reason) {
      setMessage(errorMessage(reason))
    }
  }

  if (session.isLoading) {
    return <main className="auth-page"><div className="auth-card auth-card-login" role="status" data-testid="status-session-check"><div className="skeleton" /><p>Checking your LinkUps account…</p></div></main>
  }

  return <main className="auth-page"><div className="auth-card auth-card-login">
    <Logo data-testid="link-login-home" />
    <span className="eyebrow">Your next adventure, one step closer</span>
    <h1>Welcome back.</h1>
    <p>Sign in to manage your saved trips and booking requests.</p>
    <form onSubmit={submit} className="auth-form" data-testid="form-login">
      <label>Email address<input data-testid="input-login-email" name="email" required type="email" autoComplete="email" placeholder="you@example.com" /></label>
      <label>Password<input data-testid="input-login-password" name="password" required minLength={8} type="password" autoComplete="current-password" placeholder="At least 8 characters" /></label>
      {message && <div className="error-box" role="alert" data-testid="error-login">{message}</div>}
      <button data-testid="button-login-submit" className="button orange" type="submit" disabled={login.isPending}>{login.isPending ? 'Signing you in…' : 'Sign in'}</button>
    </form>
    <p className="auth-foot">New to LinkUps? <Link href="/register" data-testid="link-login-register">Create your account</Link></p>
  </div></main>
}
