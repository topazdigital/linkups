'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'wouter'
import { getGetAuthSessionQueryKey, useGetAuthSession, useRegister } from '@workspace/api-client-react'
import { useQueryClient } from '@tanstack/react-query'

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Your account could not be created. Please try again.'
}

export default function RegisterPage() {
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const session = useGetAuthSession()
  const register = useRegister()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session.data?.authenticated) {
      setLocation(session.data.role === 'admin' ? '/admin' : '/dashboard')
    }
  }, [session.data, setLocation])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    if (password !== String(form.get('confirmPassword') ?? '')) {
      setMessage('Those passwords do not match.')
      return
    }
    try {
      const nextSession = await register.mutateAsync({
        data: {
          name: String(form.get('name') ?? '').trim(),
          email: String(form.get('email') ?? '').trim(),
          phone: String(form.get('phone') ?? '').trim() || undefined,
          password,
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
    return <main className="auth-page"><div className="auth-card" role="status" data-testid="status-session-check"><div className="skeleton" /><p>Preparing your account…</p></div></main>
  }

  return <main className="auth-page"><div className="auth-card">
    <Link href="/" className="brand" data-testid="link-register-home"><span>LinkUps</span><small>ADVENTURES</small></Link>
    <span className="eyebrow">Start collecting stories</span>
    <h1>Create your account.</h1>
    <p>Keep your profile and booking requests together. You can update your details any time.</p>
    <form onSubmit={submit} className="auth-form" data-testid="form-register">
      <label>Full name<input data-testid="input-register-name" name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" /></label>
      <label>Email address<input data-testid="input-register-email" name="email" required type="email" maxLength={190} autoComplete="email" placeholder="you@example.com" /></label>
      <label>Phone number <span className="muted">(optional)</span><input data-testid="input-register-phone" name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="+254 7…" /></label>
      <label>Password<input data-testid="input-register-password" name="password" required minLength={8} maxLength={200} type="password" autoComplete="new-password" placeholder="At least 8 characters" /></label>
      <label>Confirm password<input data-testid="input-register-confirm-password" name="confirmPassword" required minLength={8} type="password" autoComplete="new-password" placeholder="Enter it again" /></label>
      {message && <div className="error-box" role="alert" data-testid="error-register">{message}</div>}
      <button data-testid="button-register-submit" className="button orange" type="submit" disabled={register.isPending}>{register.isPending ? 'Creating your account…' : 'Create account'}</button>
    </form>
    <p className="auth-foot">Already travelling with us? <Link href="/login" data-testid="link-register-login">Sign in</Link></p>
  </div></main>
}
