'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'wouter'
import { getGetAuthSessionQueryKey, getGetCustomerDashboardQueryKey, useGetAuthSession, useGetCustomerDashboard, useLogout, useUpdateCustomerProfile } from '@workspace/api-client-react'
import type { Booking } from '@workspace/api-client-react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, LogOut, UserRound } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'

function formatDate(value: string | null) {
  if (!value) return 'Date to be confirmed'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-KE', { dateStyle: 'medium' })
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value)
}

function readable(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}
function isUnauthorized(reason: unknown) {
  return typeof reason === 'object' && reason !== null && 'status' in reason && (reason.status === 401 || reason.status === 403)
}

function BookingCard({ booking }: { booking: Booking }) {
  return <article className="booking-row" data-testid={`booking-${booking.id}`}>
    <div>
      <h3 data-testid={`text-booking-adventure-${booking.id}`}>{booking.adventureTitle || 'Custom LinkUps trip'}</h3>
      <p>{formatDate(booking.travelDate)} · {booking.travellers} traveller{booking.travellers === 1 ? '' : 's'}</p>
      <span className="booking-reference" data-testid={`text-booking-reference-${booking.id}`}>{booking.reference}</span>
    </div>
    <div style={{ display: 'grid', justifyItems: 'end', gap: 8 }}>
      <span className={`account-status ${booking.status}`} data-testid={`status-booking-${booking.id}`}>{readable(booking.status)}</span>
      <small data-testid={`status-payment-${booking.id}`} style={{ color: 'var(--muted)', fontSize: 11 }}>{readable(booking.paymentStatus)} · {formatMoney(booking.totalAmount)}</small>
    </div>
  </article>
}

export default function DashboardPage() {
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const session = useGetAuthSession()
  const dashboard = useGetCustomerDashboard({
    query: {
      enabled: session.data?.authenticated === true && session.data.role === 'customer',
      queryKey: getGetCustomerDashboardQueryKey(),
    },
  })
  const updateProfile = useUpdateCustomerProfile()
  const logout = useLogout()
  const initialized = useRef(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (isUnauthorized(session.error)) {
      setLocation('/login')
      return
    }
    if (!session.data) return
    if (!session.data.authenticated) setLocation('/login')
    else if (session.data.role === 'admin') setLocation('/admin')
  }, [session.data, session.error, setLocation])

  useEffect(() => {
    if (!dashboard.data || initialized.current) return
    initialized.current = true
    setName(dashboard.data.profile.name)
    setPhone(dashboard.data.profile.phone ?? '')
  }, [dashboard.data])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setNotice('')
    try {
      await updateProfile.mutateAsync({ data: { name: name.trim(), phone: phone.trim() || null } })
      await queryClient.invalidateQueries({ queryKey: getGetCustomerDashboardQueryKey() })
      setNotice('Your profile has been updated.')
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Your profile could not be saved.')
    }
  }

  async function signOut() {
    try {
      await logout.mutateAsync()
      await queryClient.invalidateQueries({ queryKey: getGetAuthSessionQueryKey() })
      await queryClient.invalidateQueries({ queryKey: getGetCustomerDashboardQueryKey() })
      setLocation('/')
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Sign out could not be completed.')
    }
  }

  if (session.isLoading || (session.data?.role === 'customer' && dashboard.isLoading)) {
    return <PageFrame><section className="account-page"><div className="account-heading"><div><span className="eyebrow">Your LinkUps</span><h1>Your adventures.</h1></div></div><div className="account-grid"><div className="account-panel account-skeleton"><div className="skeleton" /><div className="skeleton" /></div><div className="account-panel account-skeleton"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div></div></section></PageFrame>
  }

  if (session.error || dashboard.error) {
    const message = session.error instanceof Error ? session.error.message : dashboard.error instanceof Error ? dashboard.error.message : 'Your account could not be loaded.'
    return <PageFrame><section className="account-page"><div className="account-panel" role="alert" data-testid="error-dashboard"><h2>We couldn’t open your account</h2><p>{message}</p><button className="button dark" data-testid="button-dashboard-retry" onClick={() => { void session.refetch(); void dashboard.refetch() }}>Try again</button></div></section></PageFrame>
  }

  if (!session.data?.authenticated || session.data.role !== 'customer' || !dashboard.data) {
    return <PageFrame><section className="account-page"><div className="account-panel" role="status" data-testid="status-dashboard-redirect">Opening your LinkUps account…</div></section></PageFrame>
  }

  return <PageFrame>
    <section className="account-page">
      <div className="account-heading">
        <div><span className="eyebrow">Your LinkUps</span><h1>Welcome, {dashboard.data.profile.name.split(' ')[0]}.</h1><p>Booking requests and travel details, all in one place.</p></div>
        <button className="button dark" data-testid="button-dashboard-signout" onClick={signOut} disabled={logout.isPending}><LogOut size={16} />{logout.isPending ? 'Signing out…' : 'Sign out'}</button>
      </div>
      {notice && <div className="success-box form-message" role="status" data-testid="status-profile-success">{notice}</div>}
      {formError && <div className="error-box form-message" role="alert" data-testid="error-profile">{formError}</div>}
      <div className="account-grid">
        <section className="account-panel">
          <UserRound size={20} color="var(--orange)" />
          <h2>Profile details</h2>
          <p>Keep your contact details current so our team can reach you about your trip.</p>
          <form className="account-form" onSubmit={saveProfile} data-testid="form-profile">
            <label>Full name<input data-testid="input-profile-name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>Email address<input data-testid="input-profile-email" type="email" value={dashboard.data.profile.email} readOnly /></label>
            <label>Phone number<input data-testid="input-profile-phone" type="tel" maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Add a phone number" /></label>
            <button className="button orange" data-testid="button-profile-save" type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Saving details…' : 'Save profile'}</button>
          </form>
        </section>
        <section className="account-panel">
          <CalendarDays size={20} color="var(--orange)" />
          <h2>Your booking requests</h2>
          <p>We’ll confirm availability and next steps with you directly.</p>
          {dashboard.data.bookings.length > 0 ? <div className="booking-list" data-testid="list-customer-bookings">{dashboard.data.bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}</div> :
            <div className="account-empty" data-testid="empty-customer-bookings"><strong>Your next story starts somewhere.</strong><p>You have no booking requests yet. Browse an adventure and send us the dates you have in mind.</p><Link href="/adventures" className="button orange" data-testid="link-dashboard-adventures">Explore adventures <ArrowRight size={16} /></Link></div>}
        </section>
      </div>
    </section>
  </PageFrame>
}
