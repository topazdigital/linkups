'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation } from 'wouter'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetAuthSessionQueryKey,
  getGetPublicSiteContentQueryKey,
  getListAdminAdventuresQueryKey,
  getListAdminBookingsQueryKey,
  getListAdminDestinationsQueryKey,
  getListAdminEnquiriesQueryKey,
  getListAdminSiteContentQueryKey,
  getListAdminUsersQueryKey,
  getListPublicAdventuresQueryKey,
  getListPublicDestinationsQueryKey,
  useAdminLogout,
  useCreateAdventure,
  useCreateDestination,
  useGetAuthSession,
  useListAdminAdventures,
  useListAdminBookings,
  useListAdminDestinations,
  useListAdminEnquiries,
  useListAdminSiteContent,
  useListAdminUsers,
  useSaveAdminSiteContent,
  useUpdateAdminUser,
  useUpdateAdventure,
  useUpdateBooking,
  useUpdateDestination,
  useUpdateEnquiry,
} from '@workspace/api-client-react'
import type { AdminUser, Adventure, Booking, Destination, Enquiry, SiteContent, SiteContentInput } from '@workspace/api-client-react'
import { Logo } from '@/components/site-shell'
import {
  CalendarCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Map,
  Menu,
  Plus,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'

type Section = 'Overview' | 'Bookings' | 'Enquiries' | 'Adventures' | 'Users' | 'Destinations' | 'Website content'
type AdventureForm = {
  slug: string
  title: string
  category: string
  durationDays: string
  durationNights: string
  price: string
  description: string
  heroImageUrl: string
  isFeatured: boolean
  isPublished: boolean
}
type DestinationForm = {
  name: string
  slug: string
  summary: string
  description: string
  imageUrl: string
  isFeatured: boolean
  isPublished: boolean
}
type ContentForm = {
  pageKey: string
  pageTitle: string
  heroTitle: string
  heroSubtitle: string
  seoDescription: string
  bodyContent: string
  heroImageUrl: string
  isPublished: boolean
}

const sections: { name: Section; icon: typeof LayoutDashboard }[] = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Bookings', icon: CalendarCheck },
  { name: 'Enquiries', icon: Mail },
  { name: 'Adventures', icon: Map },
  { name: 'Users', icon: Users },
  { name: 'Destinations', icon: Map },
  { name: 'Website content', icon: FileText },
]
const bookingStatuses: Booking['status'][] = ['new', 'confirmed', 'in_progress', 'completed', 'cancelled']
const enquiryStatuses: Enquiry['status'][] = ['new', 'read', 'replied', 'archived']
const blankAdventure: AdventureForm = {
  slug: '', title: '', category: '', durationDays: '1', durationNights: '0', price: '0',
  description: '', heroImageUrl: '', isFeatured: false, isPublished: false,
}
const blankDestination: DestinationForm = {
  name: '', slug: '', summary: '', description: '', imageUrl: '', isFeatured: false, isPublished: false,
}
const blankContent: ContentForm = {
  pageKey: '', pageTitle: '', heroTitle: '', heroSubtitle: '', seoDescription: '',
  bodyContent: '', heroImageUrl: '', isPublished: false,
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-KE', { dateStyle: 'medium' })
}
function readable(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}
function money(value: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value)
}
function errorText(reason: unknown) {
  return reason instanceof Error ? reason.message : 'The request could not be completed. Please try again.'
}
function isUnauthorized(reason: unknown) {
  return typeof reason === 'object' && reason !== null && 'status' in reason && (reason.status === 401 || reason.status === 403)
}
function statusClass(value: string) {
  if (value === 'cancelled' || value === 'archived' || value === 'failed') return 'cancelled'
  if (value === 'confirmed' || value === 'completed' || value === 'paid' || value === 'published' || value === 'active') return 'confirmed'
  return 'new'
}

function AuthGate() {
  const [, setLocation] = useLocation()
  const session = useGetAuthSession()
  useEffect(() => {
    if (isUnauthorized(session.error)) {
      setLocation('/login')
      return
    }
    if (!session.data) return
    if (!session.data.authenticated || !session.data.role) setLocation('/login')
    else if (session.data.role !== 'admin') setLocation('/dashboard')
  }, [session.data, session.error, setLocation])

  if (session.isLoading) {
    return <main className="auth-page"><div className="auth-card" role="status" data-testid="status-admin-access"><div className="skeleton" /><p>Checking workspace access…</p></div></main>
  }
  if (session.error) {
    return <main className="auth-page"><div className="auth-card" role="alert" data-testid="error-admin-session"><span className="eyebrow">Workspace access</span><h1>We couldn’t check your access.</h1><p>{errorText(session.error)}</p><button className="button orange" data-testid="button-admin-session-retry" onClick={() => { void session.refetch() }}>Try again</button></div></main>
  }
  if (!session.data?.authenticated || session.data.role !== 'admin') {
    return <main className="auth-page"><div className="auth-card" role="status" data-testid="status-admin-redirect"><span className="eyebrow">LinkUps Adventures</span><h1>Taking you to your account.</h1><p>Administrator access is required for this workspace.</p><button className="button orange" data-testid="button-admin-login" onClick={() => setLocation(session.data?.role === 'customer' ? '/dashboard' : '/login')}>Continue</button></div></main>
  }
  return <AdminWorkspace adminEmail={session.data.email || 'Administrator'} />
}

export default function AdminPage() {
  return <AuthGate />
}

function AdminWorkspace({ adminEmail }: { adminEmail: string }) {
  const [, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const [active, setActive] = useState<Section>('Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [editingAdventure, setEditingAdventure] = useState<number | null>(null)
  const [adventureForm, setAdventureForm] = useState<AdventureForm>(blankAdventure)
  const [editingDestination, setEditingDestination] = useState<number | null>(null)
  const [destinationForm, setDestinationForm] = useState<DestinationForm>(blankDestination)
  const [contentForm, setContentForm] = useState<ContentForm>(blankContent)
  const [editingPage, setEditingPage] = useState('')

  const bookingsQuery = useListAdminBookings()
  const enquiriesQuery = useListAdminEnquiries()
  const adventuresQuery = useListAdminAdventures()
  const usersQuery = useListAdminUsers()
  const destinationsQuery = useListAdminDestinations()
  const contentQuery = useListAdminSiteContent()

  const bookings = bookingsQuery.data ?? []
  const enquiries = enquiriesQuery.data ?? []
  const adventures = adventuresQuery.data ?? []
  const users = usersQuery.data ?? []
  const destinations = destinationsQuery.data ?? []
  const siteContent = contentQuery.data ?? []

  const updateBooking = useUpdateBooking()
  const updateEnquiry = useUpdateEnquiry()
  const createAdventure = useCreateAdventure()
  const updateAdventure = useUpdateAdventure()
  const updateUser = useUpdateAdminUser()
  const createDestination = useCreateDestination()
  const updateDestination = useUpdateDestination()
  const saveSiteContent = useSaveAdminSiteContent()
  const logout = useAdminLogout()

  const queryText = query.trim().toLowerCase()
  const visibleBookings = useMemo(() => bookings.filter((item) => `${item.reference} ${item.fullName} ${item.email} ${item.adventureTitle ?? ''}`.toLowerCase().includes(queryText)), [bookings, queryText])
  const visibleEnquiries = useMemo(() => enquiries.filter((item) => `${item.name} ${item.email} ${item.service ?? ''} ${item.message}`.toLowerCase().includes(queryText)), [enquiries, queryText])
  const visibleAdventures = useMemo(() => adventures.filter((item) => `${item.title} ${item.slug} ${item.category}`.toLowerCase().includes(queryText)), [adventures, queryText])
  const visibleUsers = useMemo(() => users.filter((item) => `${item.name} ${item.email} ${item.phone ?? ''} ${item.role}`.toLowerCase().includes(queryText)), [users, queryText])
  const visibleDestinations = useMemo(() => destinations.filter((item) => `${item.name} ${item.slug} ${item.summary ?? ''}`.toLowerCase().includes(queryText)), [destinations, queryText])
  const visibleContent = useMemo(() => siteContent.filter((item) => `${item.pageTitle} ${item.pageKey}`.toLowerCase().includes(queryText)), [siteContent, queryText])
  const allQueries = [bookingsQuery, enquiriesQuery, adventuresQuery, usersQuery, destinationsQuery, contentQuery]
  const loading = allQueries.some((item) => item.isLoading)
  const activeQueryError = active === 'Overview' ? allQueries.find((item) => item.error)?.error ?? null
    : active === 'Bookings' ? bookingsQuery.error
    : active === 'Enquiries' ? enquiriesQuery.error
      : active === 'Adventures' ? adventuresQuery.error
        : active === 'Users' ? usersQuery.error
          : active === 'Destinations' ? destinationsQuery.error
            : active === 'Website content' ? contentQuery.error : null

  function showError(reason: unknown) {
    setNotice('')
    setFormError(errorText(reason))
  }
  function clearMessages() {
    setNotice('')
    setFormError('')
  }
  async function refreshAll() {
    clearMessages()
    await Promise.all(allQueries.map((item) => item.refetch()))
  }
  async function signOut() {
    clearMessages()
    try {
      await logout.mutateAsync()
      await queryClient.invalidateQueries({ queryKey: getGetAuthSessionQueryKey() })
      setLocation('/login')
    } catch (reason) {
      showError(reason)
    }
  }

  async function setBookingStatus(booking: Booking, status: Booking['status']) {
    clearMessages()
    try {
      await updateBooking.mutateAsync({ id: booking.id, data: { status } })
      await queryClient.invalidateQueries({ queryKey: getListAdminBookingsQueryKey() })
      setNotice(`Booking ${booking.reference} updated.`)
    } catch (reason) { showError(reason) }
  }
  async function setEnquiryStatus(enquiry: Enquiry, status: Enquiry['status']) {
    clearMessages()
    try {
      await updateEnquiry.mutateAsync({ id: enquiry.id, data: { status } })
      await queryClient.invalidateQueries({ queryKey: getListAdminEnquiriesQueryKey() })
      setNotice('Enquiry status updated.')
    } catch (reason) { showError(reason) }
  }
  function beginAdventureEdit(adventure: Adventure) {
    clearMessages()
    setEditingAdventure(adventure.id)
    setAdventureForm({
      slug: adventure.slug, title: adventure.title, category: adventure.category,
      durationDays: String(adventure.durationDays), durationNights: String(adventure.durationNights),
      price: String(adventure.price), description: adventure.description ?? '',
      heroImageUrl: adventure.heroImageUrl ?? '', isFeatured: adventure.isFeatured, isPublished: adventure.isPublished,
    })
  }
  function resetAdventureForm() {
    setEditingAdventure(null)
    setAdventureForm(blankAdventure)
    clearMessages()
  }
  async function submitAdventure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    const data = {
      slug: adventureForm.slug.trim().toLowerCase(),
      title: adventureForm.title.trim(),
      category: adventureForm.category.trim(),
      durationDays: Number(adventureForm.durationDays),
      durationNights: Number(adventureForm.durationNights),
      price: Number(adventureForm.price),
      description: adventureForm.description.trim(),
      heroImageUrl: adventureForm.heroImageUrl.trim(),
      isFeatured: adventureForm.isFeatured,
      isPublished: adventureForm.isPublished,
    }
    try {
      if (editingAdventure === null) await createAdventure.mutateAsync({ data })
      else await updateAdventure.mutateAsync({ id: editingAdventure, data })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListAdminAdventuresQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListPublicAdventuresQueryKey() }),
      ])
      setNotice(editingAdventure === null ? 'Adventure created.' : 'Adventure updated.')
      setEditingAdventure(null)
      setAdventureForm(blankAdventure)
    } catch (reason) { showError(reason) }
  }
  function beginDestinationEdit(destination: Destination) {
    clearMessages()
    setEditingDestination(destination.id)
    setDestinationForm({
      name: destination.name, slug: destination.slug, summary: destination.summary ?? '',
      description: destination.description ?? '', imageUrl: destination.imageUrl ?? '',
      isFeatured: destination.isFeatured, isPublished: destination.isPublished,
    })
  }
  function resetDestinationForm() {
    setEditingDestination(null)
    setDestinationForm(blankDestination)
    clearMessages()
  }
  async function submitDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    const data = {
      name: destinationForm.name.trim(),
      slug: destinationForm.slug.trim().toLowerCase(),
      summary: destinationForm.summary.trim(),
      description: destinationForm.description.trim(),
      imageUrl: destinationForm.imageUrl.trim(),
      isFeatured: destinationForm.isFeatured,
      isPublished: destinationForm.isPublished,
    }
    try {
      if (editingDestination === null) await createDestination.mutateAsync({ data })
      else await updateDestination.mutateAsync({ id: editingDestination, data })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListAdminDestinationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListPublicDestinationsQueryKey() }),
      ])
      setNotice(editingDestination === null ? 'Destination created.' : 'Destination updated.')
      setEditingDestination(null)
      setDestinationForm(blankDestination)
    } catch (reason) { showError(reason) }
  }
  async function toggleUser(user: AdminUser) {
    clearMessages()
    try {
      await updateUser.mutateAsync({ id: user.id, data: { isActive: !user.isActive } })
      await queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() })
      setNotice(`${user.name} is now ${user.isActive ? 'suspended' : 'active'}.`)
    } catch (reason) { showError(reason) }
  }
  function editContent(item: SiteContent) {
    clearMessages()
    setEditingPage(item.pageKey)
    setContentForm({
      pageKey: item.pageKey, pageTitle: item.pageTitle, heroTitle: item.heroTitle ?? '',
      heroSubtitle: item.heroSubtitle ?? '', seoDescription: item.seoDescription ?? '',
      bodyContent: item.bodyContent ?? '', heroImageUrl: item.heroImageUrl ?? '', isPublished: item.isPublished,
    })
  }
  function resetContentForm() {
    setEditingPage('')
    setContentForm(blankContent)
    clearMessages()
  }
  async function submitContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    const data: SiteContentInput = {
      pageKey: contentForm.pageKey.trim().toLowerCase(),
      pageTitle: contentForm.pageTitle.trim(),
      heroTitle: contentForm.heroTitle.trim() || null,
      heroSubtitle: contentForm.heroSubtitle.trim() || null,
      seoDescription: contentForm.seoDescription.trim() || null,
      bodyContent: contentForm.bodyContent.trim() || null,
      heroImageUrl: contentForm.heroImageUrl.trim() || null,
      isPublished: contentForm.isPublished,
    }
    try {
      await saveSiteContent.mutateAsync({ data })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListAdminSiteContentQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetPublicSiteContentQueryKey(data.pageKey) }),
      ])
      setNotice(`Website content for “${data.pageTitle}” saved.`)
      setEditingPage(data.pageKey)
      setContentForm((current) => ({ ...current, pageKey: data.pageKey }))
    } catch (reason) { showError(reason) }
  }

  const isSavingAdventure = createAdventure.isPending || updateAdventure.isPending
  const isSavingDestination = createDestination.isPending || updateDestination.isPending
  const isSavingContent = saveSiteContent.isPending
  const newBookings = bookings.filter((item) => item.status === 'new').length
  const newEnquiries = enquiries.filter((item) => item.status === 'new').length
  const publishedAdventures = adventures.filter((item) => item.isPublished).length

  return <div className="admin-shell workspace-shell">
    <aside className={`admin-sidebar workspace-sidebar ${menuOpen ? 'open' : ''}`}>
      <Logo light className="admin-logo workspace-logo" data-testid="link-admin-logo" />
      <button className="workspace-close" aria-label="Close workspace menu" data-testid="button-admin-close-menu" onClick={() => setMenuOpen(false)}><X /></button>
      <nav aria-label="Admin workspace" className="workspace-nav">
        {sections.map(({ name, icon: Icon }) => <button key={name} type="button" className={active === name ? 'active' : ''} data-testid={`tab-admin-${name.toLowerCase().replaceAll(' ', '-')}`} onClick={() => { setActive(name); setMenuOpen(false); clearMessages() }}><Icon />{name}{name === 'Bookings' && newBookings > 0 && <span>{newBookings}</span>}{name === 'Enquiries' && newEnquiries > 0 && <span>{newEnquiries}</span>}</button>)}
      </nav>
      <div className="admin-bottom"><button className="workspace-logout" type="button" data-testid="button-admin-signout" onClick={signOut} disabled={logout.isPending}><LogOut />{logout.isPending ? 'Signing out…' : 'Sign out'}</button></div>
    </aside>
    <main className="admin-content">
      <header className="admin-header workspace-header">
        <button className="workspace-mobile-menu" aria-label="Open workspace menu" data-testid="button-admin-open-menu" onClick={() => setMenuOpen(true)}><Menu /></button>
        <div><p className="workspace-header-kicker">LinkUps Adventures</p><h1>Admin workspace</h1></div>
        <div className="admin-header-actions workspace-header-actions">
          <input className="admin-search" data-testid="input-admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workspace…" aria-label="Search workspace" />
          <div className="workspace-user"><span className="workspace-user-mark">{adminEmail.slice(0, 1).toUpperCase()}</span><div><b data-testid="text-admin-email">{adminEmail}</b><small>Administrator</small></div></div>
        </div>
      </header>
      <section className="admin-page">
        <div className="admin-title workspace-title"><div><span className="workspace-eyebrow">The trip desk</span><h2>{active}</h2></div><button className="admin-secondary" data-testid="button-admin-refresh" onClick={refreshAll} disabled={loading}><RefreshCw size={15} /> {loading ? 'Refreshing…' : 'Refresh data'}</button></div>
        {formError && <div className="error-box workspace-notice" role="alert" data-testid="error-admin-action">{formError}</div>}
        {notice && <div className="success-box workspace-notice" role="status" data-testid="status-admin-success">{notice}</div>}
        {activeQueryError && <div className="error-box workspace-notice" role="alert" data-testid="error-admin-list">{errorText(activeQueryError)} <button className="admin-secondary" data-testid="button-admin-retry-list" onClick={() => { void allQueries.find((item) => item.error === activeQueryError)?.refetch() }}>Retry</button></div>}

        {active === 'Overview' && <section className="admin-overview">
          <div className="stat-grid workspace-kpis">
            <article className="stat-card"><p>Booking requests</p><strong data-testid="value-admin-bookings">{bookings.length}</strong><small>{newBookings} awaiting review</small></article>
            <article className="stat-card"><p>Customer enquiries</p><strong data-testid="value-admin-enquiries">{enquiries.length}</strong><small>{newEnquiries} new messages</small></article>
            <article className="stat-card"><p>Published adventures</p><strong data-testid="value-admin-adventures">{publishedAdventures}</strong><small>{adventures.length} listings in catalogue</small></article>
            <article className="stat-card"><p>Customer accounts</p><strong data-testid="value-admin-users">{users.length}</strong><small>{users.filter((user) => user.isActive).length} active accounts</small></article>
          </div>
          {loading && <div className="workspace-skeletons" role="status" data-testid="status-admin-loading"><div className="skeleton" /><div className="skeleton" /></div>}
          <div className="admin-grid">
            <section className="panel workspace-panel"><div className="panel-head"><div><h3>Recent bookings</h3><p>Requests that need the trip desk’s attention.</p></div><button className="admin-secondary" data-testid="button-admin-view-bookings" onClick={() => setActive('Bookings')}>View bookings</button></div>
              {bookings.slice(0, 5).map((booking) => <div className="admin-list-row" key={booking.id} data-testid={`row-overview-booking-${booking.id}`}><div><b>{booking.fullName}</b><small>{booking.reference} · {booking.adventureTitle || 'Custom trip'}</small></div><span className={`status ${statusClass(booking.status)}`}>{readable(booking.status)}</span></div>)}
              {!loading && bookings.length === 0 && <p className="workspace-empty" data-testid="empty-admin-bookings">No booking requests yet.</p>}
            </section>
            <section className="panel workspace-panel"><div className="panel-head"><div><h3>Recent enquiries</h3><p>Messages from travellers planning their next escape.</p></div><button className="admin-secondary" data-testid="button-admin-view-enquiries" onClick={() => setActive('Enquiries')}>View enquiries</button></div>
              {enquiries.slice(0, 5).map((enquiry) => <div className="admin-list-row" key={enquiry.id} data-testid={`row-overview-enquiry-${enquiry.id}`}><div><b>{enquiry.name}</b><small>{enquiry.service || 'General enquiry'} · {formatDate(enquiry.createdAt)}</small></div><span className={`status ${statusClass(enquiry.status)}`}>{readable(enquiry.status)}</span></div>)}
              {!loading && enquiries.length === 0 && <p className="workspace-empty" data-testid="empty-admin-enquiries">No enquiries have come in yet.</p>}
            </section>
          </div>
        </section>}

        {active === 'Bookings' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Booking requests</h3><p>Review requested dates, travellers, payment state and follow-up status.</p></div></div>
          {bookingsQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /><div className="skeleton" /></div> : <div className="admin-table-card workspace-table-card"><table className="admin-table workspace-table"><thead><tr><th>Reference</th><th>Customer</th><th>Adventure</th><th>Date / people</th><th>Total / payment</th><th>Status</th></tr></thead><tbody>
            {visibleBookings.map((booking) => <tr key={booking.id} data-testid={`row-admin-booking-${booking.id}`}><td><b>{booking.reference}</b><small>{formatDate(booking.createdAt)}</small></td><td>{booking.fullName}<small><a href={`mailto:${booking.email}`}>{booking.email}</a><br />{booking.phone}</small></td><td>{booking.adventureTitle || 'Custom trip'}{booking.specialRequests && <details><summary>Request details</summary><small>{booking.specialRequests}</small></details>}</td><td>{formatDate(booking.travelDate)}<small>{booking.travellers} traveller{booking.travellers === 1 ? '' : 's'}</small></td><td>{money(booking.totalAmount)}<small>Payment: {readable(booking.paymentStatus)}</small></td><td><select className="workspace-input" data-testid={`select-booking-status-${booking.id}`} aria-label={`Status for ${booking.reference}`} value={booking.status} disabled={updateBooking.isPending} onChange={(event) => { void setBookingStatus(booking, event.target.value as Booking['status']) }}>{bookingStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></td></tr>)}
          </tbody></table>{!bookingsQuery.isLoading && visibleBookings.length === 0 && <p className="empty-state" data-testid="empty-admin-bookings-filtered">No booking requests match this search.</p>}</div>}
        </section>}

        {active === 'Enquiries' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Customer enquiries</h3><p>Read messages and track the team’s next step.</p></div></div>
          {enquiriesQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /></div> : <div className="admin-table-card workspace-table-card"><table className="admin-table workspace-table"><thead><tr><th>Received</th><th>Contact</th><th>Interest</th><th>Message</th><th>Status</th></tr></thead><tbody>
            {visibleEnquiries.map((enquiry) => <tr key={enquiry.id} data-testid={`row-admin-enquiry-${enquiry.id}`}><td>{formatDate(enquiry.createdAt)}</td><td><b>{enquiry.name}</b><small><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone && <><br />{enquiry.phone}</>}</small></td><td>{enquiry.service || 'General enquiry'}</td><td><details><summary>Read message</summary><small>{enquiry.message}</small></details></td><td><select className="workspace-input" data-testid={`select-enquiry-status-${enquiry.id}`} aria-label={`Status for enquiry from ${enquiry.name}`} value={enquiry.status} disabled={updateEnquiry.isPending} onChange={(event) => { void setEnquiryStatus(enquiry, event.target.value as Enquiry['status']) }}>{enquiryStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></td></tr>)}
          </tbody></table>{!enquiriesQuery.isLoading && visibleEnquiries.length === 0 && <p className="empty-state" data-testid="empty-admin-enquiries-filtered">No enquiries match this search.</p>}</div>}
        </section>}

        {active === 'Adventures' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Adventure catalogue</h3><p>Create and manage the published safaris, beach breaks and trips featured on LinkUps.</p></div><button className="admin-primary" data-testid="button-adventure-new" onClick={resetAdventureForm}><Plus size={16} /> New adventure</button></div>
          {adventuresQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /></div> : <div className="admin-table-card workspace-table-card"><table className="admin-table workspace-table"><thead><tr><th>Adventure</th><th>Category</th><th>Duration</th><th>Price / person</th><th>Visibility</th><th>Action</th></tr></thead><tbody>
            {visibleAdventures.map((adventure) => <tr key={adventure.id} data-testid={`row-admin-adventure-${adventure.id}`}><td><b>{adventure.title}</b><small>/{adventure.slug}</small></td><td>{adventure.category}</td><td>{adventure.durationDays} days · {adventure.durationNights} nights</td><td>{money(adventure.price)}</td><td><span className={`status ${adventure.isPublished ? 'confirmed' : 'new'}`}>{adventure.isPublished ? 'Published' : 'Draft'}</span>{adventure.isFeatured && <small>Featured</small>}</td><td><button className="admin-secondary" data-testid={`button-adventure-edit-${adventure.id}`} onClick={() => beginAdventureEdit(adventure)}>Edit</button></td></tr>)}
          </tbody></table>{visibleAdventures.length === 0 && <p className="empty-state" data-testid="empty-admin-adventures">No adventures found. Start with a new listing below.</p>}</div>}
          <form className="workspace-form" onSubmit={submitAdventure} data-testid="form-admin-adventure">
            <h3>{editingAdventure === null ? 'Add an adventure' : 'Edit adventure'}</h3>
            <label className="workspace-field">Adventure title<input className="workspace-input" data-testid="input-adventure-title" required minLength={2} maxLength={180} value={adventureForm.title} onChange={(event) => setAdventureForm({ ...adventureForm, title: event.target.value })} /></label>
            <label className="workspace-field">URL slug<input className="workspace-input" data-testid="input-adventure-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={200} value={adventureForm.slug} onChange={(event) => setAdventureForm({ ...adventureForm, slug: event.target.value })} /></label>
            <label className="workspace-field">Category<input className="workspace-input" data-testid="input-adventure-category" required minLength={2} maxLength={80} value={adventureForm.category} onChange={(event) => setAdventureForm({ ...adventureForm, category: event.target.value })} /></label>
            <label className="workspace-field">Days<input className="workspace-input" data-testid="input-adventure-days" type="number" min="1" max="90" required value={adventureForm.durationDays} onChange={(event) => setAdventureForm({ ...adventureForm, durationDays: event.target.value })} /></label>
            <label className="workspace-field">Nights<input className="workspace-input" data-testid="input-adventure-nights" type="number" min="0" max="90" required value={adventureForm.durationNights} onChange={(event) => setAdventureForm({ ...adventureForm, durationNights: event.target.value })} /></label>
            <label className="workspace-field">Price per person (KES)<input className="workspace-input" data-testid="input-adventure-price" type="number" min="0" step="1" required value={adventureForm.price} onChange={(event) => setAdventureForm({ ...adventureForm, price: event.target.value })} /></label>
            <label className="workspace-field wide">Hero image URL<input className="workspace-input" data-testid="input-adventure-image" type="url" maxLength={500} value={adventureForm.heroImageUrl} onChange={(event) => setAdventureForm({ ...adventureForm, heroImageUrl: event.target.value })} /></label>
            <label className="workspace-field wide">Description<textarea className="workspace-textarea" data-testid="input-adventure-description" maxLength={8000} rows={4} value={adventureForm.description} onChange={(event) => setAdventureForm({ ...adventureForm, description: event.target.value })} /></label>
            <label className="workspace-check"><input data-testid="check-adventure-featured" type="checkbox" checked={adventureForm.isFeatured} onChange={(event) => setAdventureForm({ ...adventureForm, isFeatured: event.target.checked })} /> Featured adventure</label>
            <label className="workspace-check"><input data-testid="check-adventure-published" type="checkbox" checked={adventureForm.isPublished} onChange={(event) => setAdventureForm({ ...adventureForm, isPublished: event.target.checked })} /> Published on website</label>
            <div className="workspace-form-actions wide"><button className="admin-primary" data-testid="button-adventure-save" type="submit" disabled={isSavingAdventure}>{isSavingAdventure ? 'Saving…' : editingAdventure === null ? 'Create adventure' : 'Save adventure'}</button>{editingAdventure !== null && <button className="admin-secondary" data-testid="button-adventure-cancel" type="button" onClick={resetAdventureForm}>Cancel</button>}</div>
          </form>
        </section>}

        {active === 'Users' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Accounts and access</h3><p>Review customer accounts and suspend or restore customer access.</p></div></div>
          {usersQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /></div> : <div className="admin-table-card workspace-table-card"><table className="admin-table workspace-table"><thead><tr><th>Customer</th><th>Contact</th><th>Role</th><th>Joined</th><th>Account</th><th>Action</th></tr></thead><tbody>
            {visibleUsers.map((user) => <tr key={user.id} data-testid={`row-admin-user-${user.id}`}><td><b data-testid={`text-admin-user-name-${user.id}`}>{user.name}</b></td><td>{user.email}<small>{user.phone || 'No phone added'}</small></td><td>{readable(user.role)}</td><td>{formatDate(user.createdAt)}</td><td><span className={`status ${user.isActive ? 'confirmed' : 'cancelled'}`} data-testid={`status-admin-user-${user.id}`}>{user.isActive ? 'Active' : 'Suspended'}</span></td><td>{user.role === 'customer' ? <button className="admin-secondary" data-testid={`button-user-toggle-${user.id}`} disabled={updateUser.isPending} onClick={() => { void toggleUser(user) }}>{user.isActive ? 'Suspend' : 'Restore'}</button> : <small>Administrator access</small>}</td></tr>)}
          </tbody></table>{visibleUsers.length === 0 && <p className="empty-state" data-testid="empty-admin-users">{queryText ? 'No accounts match this search.' : 'No customer accounts have been created yet.'}</p>}</div>}
        </section>}

        {active === 'Destinations' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Destination guide</h3><p>Manage the places travellers can discover across Kenya and beyond.</p></div><button className="admin-primary" data-testid="button-destination-new" onClick={resetDestinationForm}><Plus size={16} /> New destination</button></div>
          {destinationsQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /></div> : <div className="admin-table-card workspace-table-card"><table className="admin-table workspace-table"><thead><tr><th>Destination</th><th>Summary</th><th>Visibility</th><th>Featured</th><th>Action</th></tr></thead><tbody>
            {visibleDestinations.map((destination) => <tr key={destination.id} data-testid={`row-admin-destination-${destination.id}`}><td><b>{destination.name}</b><small>/{destination.slug}</small></td><td>{destination.summary || 'No summary yet'}</td><td><span className={`status ${destination.isPublished ? 'confirmed' : 'new'}`}>{destination.isPublished ? 'Published' : 'Draft'}</span></td><td>{destination.isFeatured ? 'Featured' : '—'}</td><td><button className="admin-secondary" data-testid={`button-destination-edit-${destination.id}`} onClick={() => beginDestinationEdit(destination)}>Edit</button></td></tr>)}
          </tbody></table>{visibleDestinations.length === 0 && <p className="empty-state" data-testid="empty-admin-destinations">{queryText ? 'No destinations match this search.' : 'No destinations yet. Add the first one below.'}</p>}</div>}
          <form className="workspace-form" onSubmit={submitDestination} data-testid="form-admin-destination">
            <h3>{editingDestination === null ? 'Add a destination' : 'Edit destination'}</h3>
            <label className="workspace-field">Destination name<input className="workspace-input" data-testid="input-destination-name" required minLength={2} maxLength={120} value={destinationForm.name} onChange={(event) => setDestinationForm({ ...destinationForm, name: event.target.value })} /></label>
            <label className="workspace-field">URL slug<input className="workspace-input" data-testid="input-destination-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} value={destinationForm.slug} onChange={(event) => setDestinationForm({ ...destinationForm, slug: event.target.value })} /></label>
            <label className="workspace-field wide">Short summary<input className="workspace-input" data-testid="input-destination-summary" maxLength={1000} value={destinationForm.summary} onChange={(event) => setDestinationForm({ ...destinationForm, summary: event.target.value })} /></label>
            <label className="workspace-field wide">Description<textarea className="workspace-textarea" data-testid="input-destination-description" maxLength={8000} rows={4} value={destinationForm.description} onChange={(event) => setDestinationForm({ ...destinationForm, description: event.target.value })} /></label>
            <label className="workspace-field wide">Image URL<input className="workspace-input" data-testid="input-destination-image" type="url" maxLength={500} value={destinationForm.imageUrl} onChange={(event) => setDestinationForm({ ...destinationForm, imageUrl: event.target.value })} /></label>
            <label className="workspace-check"><input data-testid="check-destination-featured" type="checkbox" checked={destinationForm.isFeatured} onChange={(event) => setDestinationForm({ ...destinationForm, isFeatured: event.target.checked })} /> Feature this destination</label>
            <label className="workspace-check"><input data-testid="check-destination-published" type="checkbox" checked={destinationForm.isPublished} onChange={(event) => setDestinationForm({ ...destinationForm, isPublished: event.target.checked })} /> Publish on website</label>
            <div className="workspace-form-actions wide"><button className="admin-primary" data-testid="button-destination-save" type="submit" disabled={isSavingDestination}>{isSavingDestination ? 'Saving…' : editingDestination === null ? 'Create destination' : 'Save destination'}</button>{editingDestination !== null && <button className="admin-secondary" data-testid="button-destination-cancel" type="button" onClick={resetDestinationForm}>Cancel</button>}</div>
          </form>
        </section>}

        {active === 'Website content' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Website pages</h3><p>Update homepage hero copy and the editable content for published pages.</p></div></div>
          {contentQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /></div> : <div className="workspace-card-grid" data-testid="list-admin-content">
            {visibleContent.map((item) => <article className="workspace-panel workspace-content-card" key={item.pageKey} data-testid={`card-site-content-${item.pageKey}`}><div><span className={`status ${item.isPublished ? 'confirmed' : 'new'}`}>{item.isPublished ? 'Published' : 'Draft'}</span><h3 style={{ marginTop: 12 }}>{item.pageTitle}</h3><p>/{item.pageKey} · Updated {formatDate(item.updatedAt)}</p></div><p>{item.heroTitle || item.seoDescription || 'No hero copy entered yet.'}</p><div className="workspace-form-actions"><button className="admin-secondary" data-testid={`button-content-edit-${item.pageKey}`} onClick={() => editContent(item)}>Edit page</button></div></article>)}
            {visibleContent.length === 0 && <div className="workspace-panel workspace-empty" data-testid="empty-admin-content">{queryText ? 'No pages match this search.' : 'No page content found. Add a page record below.'}</div>}
          </div>}
          <form className="workspace-form" onSubmit={submitContent} data-testid="form-admin-content">
            <h3>{editingPage ? `Edit ${contentForm.pageTitle || editingPage}` : 'Add or update a page'}</h3>
            <label className="workspace-field">Page key<input className="workspace-input" data-testid="input-content-page-key" required pattern="[a-z0-9-]+" maxLength={60} value={contentForm.pageKey} onChange={(event) => setContentForm({ ...contentForm, pageKey: event.target.value })} placeholder="home" /></label>
            <label className="workspace-field">Page title<input className="workspace-input" data-testid="input-content-page-title" required minLength={2} maxLength={160} value={contentForm.pageTitle} onChange={(event) => setContentForm({ ...contentForm, pageTitle: event.target.value })} placeholder="Home" /></label>
            <label className="workspace-field wide">Hero title<input className="workspace-input" data-testid="input-content-hero-title" maxLength={240} value={contentForm.heroTitle} onChange={(event) => setContentForm({ ...contentForm, heroTitle: event.target.value })} /></label>
            <label className="workspace-field wide">Hero subtitle<textarea className="workspace-textarea" data-testid="input-content-hero-subtitle" maxLength={2000} rows={3} value={contentForm.heroSubtitle} onChange={(event) => setContentForm({ ...contentForm, heroSubtitle: event.target.value })} /></label>
            <label className="workspace-field wide">SEO description<textarea className="workspace-textarea" data-testid="input-content-seo-description" maxLength={500} rows={2} value={contentForm.seoDescription} onChange={(event) => setContentForm({ ...contentForm, seoDescription: event.target.value })} /></label>
            <label className="workspace-field wide">Page body content<textarea className="workspace-textarea" data-testid="input-content-body" maxLength={20000} rows={7} value={contentForm.bodyContent} onChange={(event) => setContentForm({ ...contentForm, bodyContent: event.target.value })} /></label>
            <label className="workspace-field wide">Hero image URL<input className="workspace-input" data-testid="input-content-hero-image" type="url" maxLength={500} value={contentForm.heroImageUrl} onChange={(event) => setContentForm({ ...contentForm, heroImageUrl: event.target.value })} /></label>
            <label className="workspace-check"><input data-testid="check-content-published" type="checkbox" checked={contentForm.isPublished} onChange={(event) => setContentForm({ ...contentForm, isPublished: event.target.checked })} /> Publish this page content</label>
            <div className="workspace-form-actions wide"><button className="admin-primary" data-testid="button-content-save" type="submit" disabled={isSavingContent}>{isSavingContent ? 'Saving page…' : 'Save page content'}</button>{editingPage && <button className="admin-secondary" data-testid="button-content-cancel" type="button" onClick={resetContentForm}>Clear form</button>}</div>
          </form>
        </section>}
      </section>
    </main>
  </div>
}
