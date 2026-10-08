'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'wouter'
import { ApiRequestError, apiRequest, getAdminSession } from '@/lib/api'

export default function LoginPage() {
  const [, setLocation] = useLocation()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let mounted = true
    getAdminSession()
      .then((session) => {
        if (mounted && session.authenticated) setLocation('/admin')
      })
      .catch(() => {
        // A database error is surfaced on submit; an unauthenticated visitor can still view this page.
      })
      .finally(() => {
        if (mounted) setCheckingSession(false)
      })
    return () => {
      mounted = false
    }
  }, [setLocation])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      await apiRequest('/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        }),
      })
      setLocation('/admin')
    } catch (reason) {
      setMessage(
        reason instanceof ApiRequestError
          ? reason.message
          : 'Sign-in failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-page"><div className="auth-card">
    <Link href="/" className="brand"><span>LinkUps</span><small>ADVENTURES</small></Link>
    <span className="eyebrow">Team access</span><h1>Admin sign in</h1>
    <p>Sign in to manage booking requests, enquiries and published adventures.</p>
    <form onSubmit={submit} className="auth-form">
      <label>Email address<input name="email" required type="email" autoComplete="username" placeholder="admin@example.com" /></label>
      <label>Password<input name="password" required minLength={8} type="password" autoComplete="current-password" placeholder="Your admin password" /></label>
      {message && <div className="error-box" role="alert">{message}</div>}
      <button className="button orange" type="submit" disabled={loading || checkingSession}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="auth-foot">Customer accounts are not enabled. <Link href="/plan">Send a booking request</Link></p>
  </div></main>
}
