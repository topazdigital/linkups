'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Adventure, Booking, Enquiry } from '@workspace/api-client-react'
import { CalendarCheck, LayoutDashboard, LogOut, Mail, Map, Menu, Plus, RefreshCw, X } from 'lucide-react'
import { useLocation } from 'wouter'
import { ApiRequestError, apiRequest, formatKes, getAdminBookings, getAdminEnquiries, getAdminSession } from '@/lib/api'

type AdminSection = 'Overview' | 'Bookings' | 'Enquiries' | 'Adventures'
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

const emptyAdventure: AdventureForm = {
  slug: '',
  title: '',
  category: '',
  durationDays: '1',
  durationNights: '0',
  price: '0',
  description: '',
  heroImageUrl: '',
  isFeatured: false,
  isPublished: false,
}

const sections: { name: AdminSection; icon: typeof LayoutDashboard }[] = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Bookings', icon: CalendarCheck },
  { name: 'Enquiries', icon: Mail },
  { name: 'Adventures', icon: Map },
]

const bookingStatuses: Booking['status'][] = ['new', 'confirmed', 'in_progress', 'completed', 'cancelled']
const enquiryStatuses: Enquiry['status'][] = ['new', 'read', 'replied', 'archived']

function formatDate(value: string | null): string {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-KE', { dateStyle: 'medium' })
}

function readableStatus(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

export default function AdminPage() {
  const [, setLocation] = useLocation()
  const [authorized, setAuthorized] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const [active, setActive] = useState<AdminSection>('Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [adventures, setAdventures] = useState<Adventure[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [adventureForm, setAdventureForm] = useState<AdventureForm>(emptyAdventure)
  const [saving, setSaving] = useState(false)

  const refreshRecords = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [nextBookings, nextEnquiries, nextAdventures] = await Promise.all([
        getAdminBookings(),
        getAdminEnquiries(),
        apiRequest<Adventure[]>('/admin/adventures'),
      ])
      setBookings(nextBookings)
      setEnquiries(nextEnquiries)
      setAdventures(nextAdventures)
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Admin records could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    getAdminSession()
      .then(async (session) => {
        if (!mounted) return
        if (!session.authenticated) {
          setLocation('/login')
          return
        }
        setAdminEmail(session.email ?? 'Administrator')
        setAuthorized(true)
        await refreshRecords()
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setLoadError(reason instanceof Error ? reason.message : 'Admin access could not be checked.')
        }
      })
      .finally(() => {
        if (mounted) setAuthChecking(false)
      })
    return () => {
      mounted = false
    }
  }, [refreshRecords, setLocation])

  async function logout() {
    try {
      await apiRequest<void>('/admin/logout', { method: 'POST' })
    } finally {
      setLocation('/login')
    }
  }

  async function updateBookingStatus(booking: Booking, status: Booking['status']) {
    setFormError('')
    setNotice('')
    try {
      await apiRequest<Booking>(`/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNotice(`Booking ${booking.reference} updated.`)
      await refreshRecords()
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Booking status could not be updated.')
    }
  }

  async function updateEnquiryStatus(enquiry: Enquiry, status: Enquiry['status']) {
    setFormError('')
    setNotice('')
    try {
      await apiRequest<Enquiry>(`/admin/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNotice('Enquiry status updated.')
      await refreshRecords()
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Enquiry status could not be updated.')
    }
  }

  function startEdit(adventure: Adventure) {
    setEditingId(adventure.id)
    setAdventureForm({
      slug: adventure.slug,
      title: adventure.title,
      category: adventure.category,
      durationDays: String(adventure.durationDays),
      durationNights: String(adventure.durationNights),
      price: String(adventure.price),
      description: adventure.description ?? '',
      heroImageUrl: adventure.heroImageUrl ?? '',
      isFeatured: adventure.isFeatured,
      isPublished: adventure.isPublished,
    })
    setFormError('')
    setNotice('')
  }

  function resetAdventureForm() {
    setEditingId(null)
    setAdventureForm(emptyAdventure)
    setFormError('')
  }

  async function saveAdventure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    setNotice('')
    const payload = {
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
      await apiRequest<Adventure>(
        editingId === null ? '/admin/adventures' : `/admin/adventures/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PATCH',
          body: JSON.stringify(payload),
        },
      )
      setNotice(editingId === null ? 'Adventure created.' : 'Adventure updated.')
      resetAdventureForm()
      await refreshRecords()
    } catch (reason) {
      setFormError(
        reason instanceof ApiRequestError
          ? reason.message
          : 'Adventure could not be saved.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (authChecking) {
    return <main className="auth-page"><div className="auth-card" role="status">Checking administrator access…</div></main>
  }
  if (!authorized) {
    return <main className="auth-page"><div className="auth-card"><h1>Admin access unavailable</h1><p>{loadError || 'Redirecting to admin sign in…'}</p><button className="button orange" onClick={() => setLocation('/login')}>Go to sign in</button></div></main>
  }

  const queryText = query.trim().toLowerCase()
  const visibleBookings = bookings.filter((item) => `${item.reference} ${item.fullName} ${item.email} ${item.adventureTitle ?? ''}`.toLowerCase().includes(queryText))
  const visibleEnquiries = enquiries.filter((item) => `${item.name} ${item.email} ${item.service ?? ''} ${item.message}`.toLowerCase().includes(queryText))
  const visibleAdventures = adventures.filter((item) => `${item.title} ${item.slug} ${item.category}`.toLowerCase().includes(queryText))
  const newBookings = bookings.filter((item) => item.status === 'new').length
  const newEnquiries = enquiries.filter((item) => item.status === 'new').length
  const publishedAdventures = adventures.filter((item) => item.isPublished).length

  return <div className="admin-shell">
    <aside className={menuOpen ? 'admin-sidebar open' : 'admin-sidebar'}>
      <div className="admin-logo"><span>Linkups</span><small>ADVENTURES ADMIN</small></div>
      <button className="admin-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
      <nav>{sections.map(({ name, icon: Icon }) => <button className={active === name ? 'active' : ''} key={name} onClick={() => { setActive(name); setMenuOpen(false) }}><Icon />{name}</button>)}</nav>
      <div className="admin-bottom"><button onClick={logout}><LogOut />Sign out</button></div>
    </aside>
    <main className="admin-content">
      <header className="admin-header">
        <button className="admin-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
        <div><p>LinkUps Adventures</p><h1>Admin workspace</h1></div>
        <div className="admin-header-actions">
          <input className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records…" aria-label="Search records" />
          <div className="admin-user"><span>{adminEmail.slice(0, 1).toUpperCase()}</span><div><b>{adminEmail}</b><small>Administrator</small></div></div>
        </div>
      </header>
      <section className="admin-page">
        <div className="admin-title"><div><span className="admin-eyebrow">Manage customer requests and catalogue</span><h2>{active}</h2></div><button className="admin-secondary" onClick={refreshRecords} disabled={loading}><RefreshCw /> {loading ? 'Refreshing…' : 'Refresh'}</button></div>
        {loadError && <div className="error-box" role="alert">{loadError}</div>}
        {formError && <div className="error-box" role="alert">{formError}</div>}
        {notice && <div className="success-box" role="status">{notice}</div>}
        {loading && <div role="status" className="catalogue-message">Loading records…</div>}

        {active === 'Overview' && <div className="admin-overview">
          <div className="stat-grid">
            <article className="stat-card"><p>Booking requests</p><strong>{bookings.length}</strong><small>{newBookings} new</small></article>
            <article className="stat-card"><p>Enquiries</p><strong>{enquiries.length}</strong><small>{newEnquiries} new</small></article>
            <article className="stat-card"><p>Published adventures</p><strong>{publishedAdventures}</strong><small>{adventures.length} total listings</small></article>
            <article className="stat-card"><p>Pending bookings</p><strong>{bookings.filter((item) => item.status === 'new' || item.status === 'confirmed').length}</strong><small>Awaiting follow-up or travel</small></article>
          </div>
          <div className="admin-grid">
            <section className="panel"><div className="panel-head"><div><h3>Recent bookings</h3><p>Latest requests submitted on the website.</p></div><button className="admin-secondary" onClick={() => setActive('Bookings')}>View all</button></div>
              {bookings.slice(0, 5).map((booking) => <div className="admin-list-row" key={booking.id}><div><b>{booking.fullName}</b><small>{booking.reference} · {booking.adventureTitle ?? 'Custom trip'}</small></div><span className={`status ${booking.status}`}>{readableStatus(booking.status)}</span></div>)}
              {bookings.length === 0 && <p>No booking requests yet.</p>}
            </section>
            <section className="panel"><div className="panel-head"><div><h3>Recent enquiries</h3><p>Messages sent from the contact form.</p></div><button className="admin-secondary" onClick={() => setActive('Enquiries')}>View all</button></div>
              {enquiries.slice(0, 5).map((enquiry) => <div className="admin-list-row" key={enquiry.id}><div><b>{enquiry.name}</b><small>{enquiry.service || 'General enquiry'} · {formatDate(enquiry.createdAt)}</small></div><span className={`status ${enquiry.status}`}>{readableStatus(enquiry.status)}</span></div>)}
              {enquiries.length === 0 && <p>No enquiries yet.</p>}
            </section>
          </div>
        </div>}

        {active === 'Bookings' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Booking requests</h3><p>Review contact details, requested dates and status.</p></div></div>
          <div className="admin-table-card"><table className="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Adventure</th><th>Date / people</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{visibleBookings.map((booking) => <tr key={booking.id}><td><b>{booking.reference}</b><small>{formatDate(booking.createdAt)}</small></td><td>{booking.fullName}<small><a href={`mailto:${booking.email}`}>{booking.email}</a><br />{booking.phone}</small></td><td>{booking.adventureTitle ?? 'Custom trip'}{booking.specialRequests && <details><summary>Request details</summary><p>{booking.specialRequests}</p></details>}</td><td>{formatDate(booking.travelDate)}<small>{booking.travellers} traveller{booking.travellers === 1 ? '' : 's'}</small></td><td>{formatKes(booking.totalAmount)}</td><td><select aria-label={`Status for ${booking.reference}`} value={booking.status} onChange={(event) => updateBookingStatus(booking, event.target.value as Booking['status'])}>{bookingStatuses.map((status) => <option value={status} key={status}>{readableStatus(status)}</option>)}</select></td></tr>)}</tbody>
          </table>{visibleBookings.length === 0 && <p className="empty-state">No booking requests found.</p>}</div>
        </section>}

        {active === 'Enquiries' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Customer enquiries</h3><p>Read messages and track follow-up status.</p></div></div>
          <div className="admin-table-card"><table className="admin-table"><thead><tr><th>Received</th><th>Contact</th><th>Interest</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>{visibleEnquiries.map((enquiry) => <tr key={enquiry.id}><td>{formatDate(enquiry.createdAt)}</td><td><b>{enquiry.name}</b><small><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone && <><br />{enquiry.phone}</>}</small></td><td>{enquiry.service || 'General enquiry'}</td><td><details><summary>Read message</summary><p>{enquiry.message}</p></details></td><td><select aria-label={`Status for enquiry from ${enquiry.name}`} value={enquiry.status} onChange={(event) => updateEnquiryStatus(enquiry, event.target.value as Enquiry['status'])}>{enquiryStatuses.map((status) => <option value={status} key={status}>{readableStatus(status)}</option>)}</select></td></tr>)}</tbody>
          </table>{visibleEnquiries.length === 0 && <p className="empty-state">No enquiries found.</p>}</div>
        </section>}

        {active === 'Adventures' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Adventure catalogue</h3><p>Create, edit, price, feature and publish the trips shown on the website.</p></div><button className="admin-primary" onClick={() => { resetAdventureForm(); setNotice('') }}><Plus /> New adventure</button></div>
          <div className="admin-table-card"><table className="admin-table"><thead><tr><th>Adventure</th><th>Category</th><th>Duration</th><th>Price / person</th><th>Visibility</th><th>Action</th></tr></thead>
            <tbody>{visibleAdventures.map((adventure) => <tr key={adventure.id}><td><b>{adventure.title}</b><small>/{adventure.slug}</small></td><td>{adventure.category}</td><td>{adventure.durationDays} days · {adventure.durationNights} nights</td><td>{formatKes(adventure.price)}</td><td><span className={`status ${adventure.isPublished ? 'confirmed' : 'new'}`}>{adventure.isPublished ? 'Published' : 'Draft'}</span>{adventure.isFeatured && <small>Featured</small>}</td><td><button className="admin-secondary" onClick={() => startEdit(adventure)}>Edit</button></td></tr>)}</tbody>
          </table>{visibleAdventures.length === 0 && <p className="empty-state">No adventures found. Add one below.</p>}</div>
          <form className="admin-form-grid" onSubmit={saveAdventure}>
            <h3 className="full">{editingId === null ? 'Create an adventure' : 'Edit adventure'}</h3>
            <label className="admin-field">Title<input className="admin-input" required minLength={2} maxLength={180} value={adventureForm.title} onChange={(event) => setAdventureForm({ ...adventureForm, title: event.target.value })} /></label>
            <label className="admin-field">URL slug<input className="admin-input" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={200} value={adventureForm.slug} onChange={(event) => setAdventureForm({ ...adventureForm, slug: event.target.value })} /><small>Use lowercase letters, numbers and hyphens.</small></label>
            <label className="admin-field">Category<input className="admin-input" required minLength={2} maxLength={80} value={adventureForm.category} onChange={(event) => setAdventureForm({ ...adventureForm, category: event.target.value })} /></label>
            <label className="admin-field">Duration in days<input className="admin-input" type="number" required min="1" max="90" value={adventureForm.durationDays} onChange={(event) => setAdventureForm({ ...adventureForm, durationDays: event.target.value })} /></label>
            <label className="admin-field">Duration in nights<input className="admin-input" type="number" required min="0" max="90" value={adventureForm.durationNights} onChange={(event) => setAdventureForm({ ...adventureForm, durationNights: event.target.value })} /></label>
            <label className="admin-field">Price per person (KES)<input className="admin-input" type="number" required min="0" step="1" value={adventureForm.price} onChange={(event) => setAdventureForm({ ...adventureForm, price: event.target.value })} /></label>
            <label className="admin-field full">Hero image URL<input className="admin-input" type="url" maxLength={500} value={adventureForm.heroImageUrl} onChange={(event) => setAdventureForm({ ...adventureForm, heroImageUrl: event.target.value })} placeholder="/images/adventure-hero.png" /></label>
            <label className="admin-field full">Description<textarea className="admin-textarea" maxLength={8000} rows={4} value={adventureForm.description} onChange={(event) => setAdventureForm({ ...adventureForm, description: event.target.value })} /></label>
            <label className="admin-field check"><input type="checkbox" checked={adventureForm.isFeatured} onChange={(event) => setAdventureForm({ ...adventureForm, isFeatured: event.target.checked })} /> Feature this adventure</label>
            <label className="admin-field check"><input type="checkbox" checked={adventureForm.isPublished} onChange={(event) => setAdventureForm({ ...adventureForm, isPublished: event.target.checked })} /> Publish on the website</label>
            <div className="admin-actions full"><button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId === null ? 'Create adventure' : 'Save changes'}</button>{editingId !== null && <button className="admin-secondary" type="button" onClick={resetAdventureForm}>Cancel edit</button>}</div>
          </form>
        </section>}
      </section>
    </main>
  </div>
}
