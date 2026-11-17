'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'wouter'
import { useQueryClient } from '@tanstack/react-query'
import {
  getGetAuthSessionQueryKey,
  getGetPublicSiteContentQueryKey,
  getListAdminAdventuresQueryKey,
  getListAdminBookingsQueryKey,
  getListAdminDestinationsQueryKey,
  getListAdminEventsQueryKey,
  getListAdminEnquiriesQueryKey,
  getListAdminSiteContentQueryKey,
  getListAdminUsersQueryKey,
  getListPublicAdventuresQueryKey,
  getListPublicDestinationsQueryKey,
  getListPublicEventsQueryKey,
  useAdminLogout,
  useCreateAdventure,
  useCreateDestination,
  useCreateEvent,
  useGetAuthSession,
  useListAdminAdventures,
  useListAdminBookings,
  useListAdminDestinations,
  useListAdminEvents,
  useListAdminEnquiries,
  useListAdminSiteContent,
  useListAdminUsers,
  useSaveAdminSiteContent,
  useUpdateAdminUser,
  useUpdateAdventure,
  useUpdateBooking,
  useUpdateDestination,
  useUpdateEvent,
  useUpdateEnquiry,
} from '@workspace/api-client-react'
import type { AdminUser, Adventure, Booking, Destination, Enquiry, Event as ScheduledEvent, EventInput, SiteContent, SiteContentInput } from '@workspace/api-client-react'
import { Logo } from '@/components/site-shell'
import { legalPages } from '@/lib/legal-content'
import { formatAdventurePrice } from '@/lib/api'
import {
  CalendarCheck,
  CalendarDays,
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

type Section = 'Overview' | 'Bookings' | 'Enquiries' | 'Adventures' | 'Events' | 'Users' | 'Destinations' | 'Website content'
type AdventureForm = {
  slug: string
  title: string
  category: string
  destinationId: string
  durationDays: string
  durationNights: string
  price: string
  priceUsd: string
  pricingNote: string
  description: string
  tagline: string
  accommodation: string
  highlightsText: string
  itineraryText: string
  includedText: string
  excludedText: string
  optionalActivitiesText: string
  idealForText: string
  heroImageUrl: string
  galleryImageUrlsText: string
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
type EventForm = {
  slug: string
  title: string
  description: string
  eventDate: string
  location: string
  priceLabel: string
  heroImageUrl: string
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
  heroImages: string[]
  heroMode: 'static' | 'slideshow'
  isPublished: boolean
}

const sections: { name: Section; icon: typeof LayoutDashboard }[] = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Bookings', icon: CalendarCheck },
  { name: 'Enquiries', icon: Mail },
  { name: 'Adventures', icon: Map },
  { name: 'Events', icon: CalendarDays },
  { name: 'Users', icon: Users },
  { name: 'Destinations', icon: Map },
  { name: 'Website content', icon: FileText },
]
const bookingStatuses: Booking['status'][] = ['new', 'confirmed', 'in_progress', 'completed', 'cancelled']
const enquiryStatuses: Enquiry['status'][] = ['new', 'read', 'replied', 'archived']
const blankAdventure: AdventureForm = {
  slug: '', title: '', category: '', destinationId: '', durationDays: '1', durationNights: '0',
  price: '0', priceUsd: '', pricingNote: '', description: '', tagline: '', accommodation: '',
  highlightsText: '', itineraryText: '', includedText: '', excludedText: '',
  optionalActivitiesText: '', idealForText: '', heroImageUrl: '', galleryImageUrlsText: '',
  isFeatured: false, isPublished: false,
}
const blankDestination: DestinationForm = {
  name: '', slug: '', summary: '', description: '', imageUrl: '', isFeatured: false, isPublished: false,
}
const blankEvent: EventForm = {
  slug: '', title: '', description: '', eventDate: '', location: '',
  priceLabel: '', heroImageUrl: '', isPublished: false,
}
const blankContent: ContentForm = {
  pageKey: '', pageTitle: '', heroTitle: '', heroSubtitle: '', seoDescription: '',
  bodyContent: '', heroImageUrl: '', heroImages: [], heroMode: 'static', isPublished: false,
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-KE', { dateStyle: 'medium' })
}
function formatEventDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
function makeEventSlug(title: string, eventDate: string) {
  const titleSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const dateSuffix = eventDate.replaceAll('-', '')
  const safeTitle = (titleSlug || 'linkups-event').slice(0, 179 - dateSuffix.length)
  return `${safeTitle}-${dateSuffix}`
}
function readable(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}
function money(value: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value)
}
function linesToList(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}
function itineraryToText(itinerary: Adventure['itinerary']) {
  return itinerary.map((day) => [
    `${day.day} — ${day.title}`,
    ...day.details.map((detail) => `• ${detail}`),
  ].join('\n')).join('\n\n')
}
function parseItineraryText(value: string): Adventure['itinerary'] {
  const sections: Adventure['itinerary'] = []
  let current: Adventure['itinerary'][number] | null = null
  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^[-•]\s*/, '')
    if (!line) continue
    const heading = line.match(/^(Day\s+\d+|Full day|Early morning|Flight day|Sunrise)\s*[—–:-]\s*(.+)$/i)
    if (heading) {
      current = { day: heading[1], title: heading[2], details: [] }
      sections.push(current)
    } else if (current) {
      current.details.push(line)
    } else {
      current = { day: 'Itinerary', title: 'Trip plan', details: [line] }
      sections.push(current)
    }
  }
  return sections
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
  const [editingEvent, setEditingEvent] = useState<number | null>(null)
  const [eventForm, setEventForm] = useState<EventForm>(blankEvent)
  const [contentForm, setContentForm] = useState<ContentForm>(blankContent)
  const [editingPage, setEditingPage] = useState('')

  const bookingsQuery = useListAdminBookings()
  const enquiriesQuery = useListAdminEnquiries()
  const adventuresQuery = useListAdminAdventures()
  const eventsQuery = useListAdminEvents()
  const usersQuery = useListAdminUsers()
  const destinationsQuery = useListAdminDestinations()
  const contentQuery = useListAdminSiteContent()

  const bookings = bookingsQuery.data ?? []
  const enquiries = enquiriesQuery.data ?? []
  const adventures = adventuresQuery.data ?? []
  const events = eventsQuery.data ?? []
  const users = usersQuery.data ?? []
  const destinations = destinationsQuery.data ?? []
  const siteContent = contentQuery.data ?? []

  const updateBooking = useUpdateBooking()
  const updateEnquiry = useUpdateEnquiry()
  const createAdventure = useCreateAdventure()
  const updateAdventure = useUpdateAdventure()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const updateUser = useUpdateAdminUser()
  const createDestination = useCreateDestination()
  const updateDestination = useUpdateDestination()
  const saveSiteContent = useSaveAdminSiteContent()
  const logout = useAdminLogout()

  const queryText = query.trim().toLowerCase()
  const visibleBookings = useMemo(() => bookings.filter((item) => `${item.reference} ${item.fullName} ${item.email} ${item.adventureTitle ?? ''}`.toLowerCase().includes(queryText)), [bookings, queryText])
  const visibleEnquiries = useMemo(() => enquiries.filter((item) => `${item.name} ${item.email} ${item.service ?? ''} ${item.message}`.toLowerCase().includes(queryText)), [enquiries, queryText])
  const visibleAdventures = useMemo(() => adventures.filter((item) => `${item.title} ${item.slug} ${item.category} ${item.destinationName ?? ''}`.toLowerCase().includes(queryText)), [adventures, queryText])
  const visibleEvents = useMemo(() => events.filter((item) => `${item.title} ${item.slug} ${item.location} ${item.eventDate}`.toLowerCase().includes(queryText)), [events, queryText])
  const visibleUsers = useMemo(() => users.filter((item) => `${item.name} ${item.email} ${item.phone ?? ''} ${item.role}`.toLowerCase().includes(queryText)), [users, queryText])
  const visibleDestinations = useMemo(() => destinations.filter((item) => `${item.name} ${item.slug} ${item.summary ?? ''}`.toLowerCase().includes(queryText)), [destinations, queryText])
  const visibleContent = useMemo(() => siteContent.filter((item) => `${item.pageTitle} ${item.pageKey}`.toLowerCase().includes(queryText)), [siteContent, queryText])
  const allQueries = [bookingsQuery, enquiriesQuery, adventuresQuery, eventsQuery, usersQuery, destinationsQuery, contentQuery]
  const loading = allQueries.some((item) => item.isLoading)
  const activeQueryError = active === 'Overview' ? allQueries.find((item) => item.error)?.error ?? null
    : active === 'Bookings' ? bookingsQuery.error
    : active === 'Enquiries' ? enquiriesQuery.error
      : active === 'Adventures' ? adventuresQuery.error
          : active === 'Events' ? eventsQuery.error
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
      destinationId: adventure.destinationId === null ? '' : String(adventure.destinationId),
      durationDays: String(adventure.durationDays), durationNights: String(adventure.durationNights),
      price: String(adventure.price), priceUsd: adventure.priceUsd === null ? '' : String(adventure.priceUsd),
      pricingNote: adventure.pricingNote ?? '', description: adventure.description ?? '',
      tagline: adventure.tagline ?? '', accommodation: adventure.accommodation ?? '',
      highlightsText: adventure.highlights.join('\n'),
      itineraryText: itineraryToText(adventure.itinerary),
      includedText: adventure.included.join('\n'),
      excludedText: adventure.excluded.join('\n'),
      optionalActivitiesText: adventure.optionalActivities.join('\n'),
      idealForText: adventure.idealFor.join('\n'),
      heroImageUrl: adventure.heroImageUrl ?? '',
      galleryImageUrlsText: adventure.galleryImageUrls.join('\n'),
      isFeatured: adventure.isFeatured, isPublished: adventure.isPublished,
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
      destinationId: adventureForm.destinationId ? Number(adventureForm.destinationId) : null,
      durationDays: Number(adventureForm.durationDays),
      durationNights: Number(adventureForm.durationNights),
      price: Number(adventureForm.price),
      priceUsd: adventureForm.priceUsd.trim() ? Number(adventureForm.priceUsd) : null,
      pricingNote: adventureForm.pricingNote.trim() || null,
      description: adventureForm.description.trim() || null,
      tagline: adventureForm.tagline.trim() || null,
      accommodation: adventureForm.accommodation.trim() || null,
      highlights: linesToList(adventureForm.highlightsText),
      itinerary: parseItineraryText(adventureForm.itineraryText),
      included: linesToList(adventureForm.includedText),
      excluded: linesToList(adventureForm.excludedText),
      optionalActivities: linesToList(adventureForm.optionalActivitiesText),
      idealFor: linesToList(adventureForm.idealForText),
      heroImageUrl: adventureForm.heroImageUrl.trim() || null,
      galleryImageUrls: linesToList(adventureForm.galleryImageUrlsText),
      isFeatured: adventureForm.isFeatured,
      isPublished: adventureForm.isPublished,
    }
    try {
      if (editingAdventure === null) {
        await createAdventure.mutateAsync({
          data: {
            ...data,
            pricingNote: data.pricingNote ?? undefined,
            description: data.description ?? undefined,
            tagline: data.tagline ?? undefined,
            accommodation: data.accommodation ?? undefined,
            heroImageUrl: data.heroImageUrl ?? undefined,
          },
        })
      } else {
        await updateAdventure.mutateAsync({ id: editingAdventure, data })
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListAdminAdventuresQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListPublicAdventuresQueryKey() }),
      ])
      setNotice(editingAdventure === null ? 'Adventure created.' : 'Adventure updated.')
      setEditingAdventure(null)
      setAdventureForm(blankAdventure)
    } catch (reason) { showError(reason) }
  }
  function beginEventEdit(item: ScheduledEvent) {
    clearMessages()
    setEditingEvent(item.id)
    setEventForm({
      slug: item.slug,
      title: item.title,
      description: item.description,
      eventDate: item.eventDate,
      location: item.location,
      priceLabel: item.priceLabel ?? '',
      heroImageUrl: item.heroImageUrl ?? '',
      isPublished: item.isPublished,
    })
  }
  function resetEventForm() {
    setEditingEvent(null)
    setEventForm(blankEvent)
    clearMessages()
  }
  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    const title = eventForm.title.trim()
    const data: EventInput = {
      slug: eventForm.slug.trim().toLowerCase() || makeEventSlug(title, eventForm.eventDate),
      title,
      description: eventForm.description.trim(),
      eventDate: eventForm.eventDate,
      location: eventForm.location.trim(),
      priceLabel: eventForm.priceLabel.trim() || null,
      heroImageUrl: eventForm.heroImageUrl.trim() || null,
      isPublished: eventForm.isPublished,
    }
    try {
      if (editingEvent === null) await createEvent.mutateAsync({ data })
      else await updateEvent.mutateAsync({ id: editingEvent, data })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListAdminEventsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListPublicEventsQueryKey() }),
      ])
      setNotice(editingEvent === null ? 'Event created.' : 'Event updated.')
      setEditingEvent(null)
      setEventForm(blankEvent)
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
      bodyContent: item.bodyContent ?? legalPages[item.pageKey]?.bodyContent ?? '', heroImageUrl: item.heroImageUrl ?? '',
      heroImages: item.heroImages.length ? item.heroImages : item.heroImageUrl ? [item.heroImageUrl] : [],
      heroMode: item.heroMode, isPublished: item.isPublished,
    })
  }
  function updateHeroImage(index: number, value: string) {
    setContentForm((current) => ({
      ...current,
      heroImages: current.heroImages.map((image, imageIndex) => imageIndex === index ? value : image),
    }))
  }
  function addHeroImage() {
    setContentForm((current) => current.heroImages.length < 8
      ? { ...current, heroImages: [...current.heroImages, ''] }
      : current)
  }
  function removeHeroImage(index: number) {
    setContentForm((current) => ({
      ...current,
      heroImages: current.heroImages.filter((_, imageIndex) => imageIndex !== index),
    }))
  }
  function moveHeroImage(index: number, offset: number) {
    setContentForm((current) => {
      const target = index + offset
      if (target < 0 || target >= current.heroImages.length) return current
      const heroImages = [...current.heroImages]
      ;[heroImages[index], heroImages[target]] = [heroImages[target], heroImages[index]]
      return { ...current, heroImages }
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
      heroImageUrl: contentForm.heroImages.find((image) => image.trim())?.trim() || null,
      heroImages: contentForm.heroImages.map((image) => image.trim()).filter(Boolean),
      heroMode: contentForm.heroMode,
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
  const isSavingEvent = createEvent.isPending || updateEvent.isPending
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
            {visibleAdventures.map((adventure) => <tr key={adventure.id} data-testid={`row-admin-adventure-${adventure.id}`}><td><b>{adventure.title}</b><small>{adventure.destinationName || adventure.category} · /{adventure.slug}</small></td><td>{adventure.category}</td><td>{adventure.durationDays} days · {adventure.durationNights} nights</td><td>{formatAdventurePrice(adventure)}</td><td><span className={`status ${adventure.isPublished ? 'confirmed' : 'new'}`}>{adventure.isPublished ? 'Published' : 'Draft'}</span>{adventure.isFeatured && <small>Featured</small>}</td><td><button className="admin-secondary" data-testid={`button-adventure-edit-${adventure.id}`} onClick={() => beginAdventureEdit(adventure)}>Edit</button></td></tr>)}
          </tbody></table>{visibleAdventures.length === 0 && <p className="empty-state" data-testid="empty-admin-adventures">No adventures found. Start with a new listing below.</p>}</div>}
          <form className="workspace-form" onSubmit={submitAdventure} data-testid="form-admin-adventure">
            <h3>{editingAdventure === null ? 'Add an adventure' : 'Edit adventure'}</h3>
            <label className="workspace-field">Adventure title<input className="workspace-input" data-testid="input-adventure-title" required minLength={2} maxLength={180} value={adventureForm.title} onChange={(event) => setAdventureForm({ ...adventureForm, title: event.target.value })} /></label>
            <label className="workspace-field">URL slug<input className="workspace-input" data-testid="input-adventure-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={200} value={adventureForm.slug} onChange={(event) => setAdventureForm({ ...adventureForm, slug: event.target.value })} /></label>
            <label className="workspace-field">Category<input className="workspace-input" data-testid="input-adventure-category" required minLength={2} maxLength={80} value={adventureForm.category} onChange={(event) => setAdventureForm({ ...adventureForm, category: event.target.value })} /></label>
            <label className="workspace-field">Destination<select className="workspace-input" data-testid="select-adventure-destination" value={adventureForm.destinationId} onChange={(event) => setAdventureForm({ ...adventureForm, destinationId: event.target.value })}><option value="">No linked destination</option>{destinations.map((destination) => <option value={destination.id} key={destination.id}>{destination.name}</option>)}</select></label>
            <label className="workspace-field">Days<input className="workspace-input" data-testid="input-adventure-days" type="number" min="1" max="90" required value={adventureForm.durationDays} onChange={(event) => setAdventureForm({ ...adventureForm, durationDays: event.target.value })} /></label>
            <label className="workspace-field">Nights<input className="workspace-input" data-testid="input-adventure-nights" type="number" min="0" max="90" required value={adventureForm.durationNights} onChange={(event) => setAdventureForm({ ...adventureForm, durationNights: event.target.value })} /></label>
            <label className="workspace-field">Resident price (KES per person)<input className="workspace-input" data-testid="input-adventure-price" type="number" min="0" step="1" required value={adventureForm.price} onChange={(event) => setAdventureForm({ ...adventureForm, price: event.target.value })} /><small>Enter 0 when the price is confirmed by enquiry.</small></label>
            <label className="workspace-field">Non-resident price (USD)<input className="workspace-input" data-testid="input-adventure-price-usd" type="number" min="0" step="1" value={adventureForm.priceUsd} onChange={(event) => setAdventureForm({ ...adventureForm, priceUsd: event.target.value })} /></label>
            <label className="workspace-field">Tagline<input className="workspace-input" data-testid="input-adventure-tagline" maxLength={240} value={adventureForm.tagline} onChange={(event) => setAdventureForm({ ...adventureForm, tagline: event.target.value })} /></label>
            <label className="workspace-field">Accommodation<input className="workspace-input" data-testid="input-adventure-accommodation" maxLength={500} value={adventureForm.accommodation} onChange={(event) => setAdventureForm({ ...adventureForm, accommodation: event.target.value })} /></label>
            <label className="workspace-field wide">Price and availability notes<textarea className="workspace-textarea" data-testid="input-adventure-pricing-note" maxLength={1000} rows={2} value={adventureForm.pricingNote} onChange={(event) => setAdventureForm({ ...adventureForm, pricingNote: event.target.value })} placeholder="For example: rates confirmed on enquiry; park fees excluded." /></label>
            <label className="workspace-field wide">Short description<textarea className="workspace-textarea" data-testid="input-adventure-description" maxLength={8000} rows={4} value={adventureForm.description} onChange={(event) => setAdventureForm({ ...adventureForm, description: event.target.value })} /></label>
            <label className="workspace-field wide">Highlights (one per line)<textarea className="workspace-textarea" data-testid="input-adventure-highlights" rows={4} value={adventureForm.highlightsText} onChange={(event) => setAdventureForm({ ...adventureForm, highlightsText: event.target.value })} /></label>
            <label className="workspace-field wide">Day-by-day itinerary<textarea className="workspace-textarea" data-testid="input-adventure-itinerary" rows={8} value={adventureForm.itineraryText} onChange={(event) => setAdventureForm({ ...adventureForm, itineraryText: event.target.value })} placeholder={'Day 1 — Arrival and explore\n• Activity or timing\n\nDay 2 — Main adventure\n• Activity or timing'} /><small>Start sections with “Day 1 — Title”. Add each activity on a new line.</small></label>
            <label className="workspace-field">What’s included (one per line)<textarea className="workspace-textarea" data-testid="input-adventure-included" rows={5} value={adventureForm.includedText} onChange={(event) => setAdventureForm({ ...adventureForm, includedText: event.target.value })} /></label>
            <label className="workspace-field">What’s excluded (one per line)<textarea className="workspace-textarea" data-testid="input-adventure-excluded" rows={5} value={adventureForm.excludedText} onChange={(event) => setAdventureForm({ ...adventureForm, excludedText: event.target.value })} /></label>
            <label className="workspace-field">Optional activities (one per line)<textarea className="workspace-textarea" data-testid="input-adventure-optional" rows={4} value={adventureForm.optionalActivitiesText} onChange={(event) => setAdventureForm({ ...adventureForm, optionalActivitiesText: event.target.value })} /></label>
            <label className="workspace-field">Ideal for (one per line)<textarea className="workspace-textarea" data-testid="input-adventure-ideal-for" rows={4} value={adventureForm.idealForText} onChange={(event) => setAdventureForm({ ...adventureForm, idealForText: event.target.value })} /></label>
            <label className="workspace-field wide">Main image path or URL<input className="workspace-input" data-testid="input-adventure-image" maxLength={500} value={adventureForm.heroImageUrl} onChange={(event) => setAdventureForm({ ...adventureForm, heroImageUrl: event.target.value })} placeholder="/images/trips/example.jpg or https://…" /><small>Use a public image URL or a path to an image in the website’s public folder.</small></label>
            {adventureForm.heroImageUrl && <div className="trip-image-preview-wrap wide"><span>Main image preview</span><img className="trip-image-preview" src={adventureForm.heroImageUrl} alt="Main trip preview" /></div>}
            <label className="workspace-field wide">Gallery image paths or URLs (one per line)<textarea className="workspace-textarea" data-testid="input-adventure-gallery" rows={4} value={adventureForm.galleryImageUrlsText} onChange={(event) => setAdventureForm({ ...adventureForm, galleryImageUrlsText: event.target.value })} placeholder={'/images/trips/gallery-1.jpg\nhttps://…'} /><small>Choose multiple supporting photos. The main image is shown separately.</small></label>
            {linesToList(adventureForm.galleryImageUrlsText).length > 0 && <div className="trip-gallery-preview wide">{linesToList(adventureForm.galleryImageUrlsText).map((image, index) => <img src={image} alt={`Trip gallery preview ${index + 1}`} key={`${image}-${index}`} />)}</div>}
            <label className="workspace-check"><input data-testid="check-adventure-featured" type="checkbox" checked={adventureForm.isFeatured} onChange={(event) => setAdventureForm({ ...adventureForm, isFeatured: event.target.checked })} /> Featured adventure</label>
            <label className="workspace-check"><input data-testid="check-adventure-published" type="checkbox" checked={adventureForm.isPublished} onChange={(event) => setAdventureForm({ ...adventureForm, isPublished: event.target.checked })} /> Published on website</label>
            <div className="workspace-form-actions wide"><button className="admin-primary" data-testid="button-adventure-save" type="submit" disabled={isSavingAdventure}>{isSavingAdventure ? 'Saving…' : editingAdventure === null ? 'Create adventure' : 'Save adventure'}</button>{editingAdventure !== null && <button className="admin-secondary" data-testid="button-adventure-cancel" type="button" onClick={resetAdventureForm}>Cancel</button>}</div>
          </form>
        </section>}

        {active === 'Events' && <section className="admin-section">
          <div className="admin-toolbar"><div><h3>Scheduled events</h3><p>Post dated LinkUps departures separately from flexible-date adventures.</p></div><button className="admin-primary" data-testid="button-event-new" onClick={resetEventForm}><Plus size={16} /> New event</button></div>
          {eventsQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /></div> : <div className="admin-table-card workspace-table-card"><table className="admin-table workspace-table"><thead><tr><th>Event</th><th>Date</th><th>Location</th><th>Price</th><th>Visibility</th><th>Action</th></tr></thead><tbody>
            {visibleEvents.map((item) => <tr key={item.id} data-testid={`row-admin-event-${item.id}`}><td><b>{item.title}</b><small>/{item.slug}</small></td><td>{formatEventDate(item.eventDate)}<small>Updated {formatDate(item.updatedAt)}</small></td><td>{item.location}</td><td>{item.priceLabel || 'Ask for details'}</td><td><span className={`status ${item.isPublished ? 'confirmed' : 'new'}`}>{item.isPublished ? 'Published' : 'Draft'}</span></td><td><button className="admin-secondary" data-testid={`button-event-edit-${item.id}`} onClick={() => beginEventEdit(item)}>Edit</button></td></tr>)}
          </tbody></table>{visibleEvents.length === 0 && <p className="empty-state" data-testid="empty-admin-events">{queryText ? 'No events match this search.' : 'No scheduled events yet. Create one to add a dated departure.'}</p>}</div>}
          <form className="workspace-form" onSubmit={submitEvent} data-testid="form-admin-event">
            <h3>{editingEvent === null ? 'Add a scheduled event' : `Edit ${eventForm.title || 'event'}`}</h3>
            <label className="workspace-field">Event title<input className="workspace-input" data-testid="input-event-title" required minLength={2} maxLength={180} value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} /></label>
            <label className="workspace-field">Event date<input className="workspace-input" data-testid="input-event-date" type="date" required value={eventForm.eventDate} onChange={(event) => setEventForm({ ...eventForm, eventDate: event.target.value })} /></label>
            <label className="workspace-field">Location<input className="workspace-input" data-testid="input-event-location" required minLength={2} maxLength={180} value={eventForm.location} onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })} placeholder="For example, Naivasha" /></label>
            <label className="workspace-field">Price or booking note<input className="workspace-input" data-testid="input-event-price" maxLength={160} value={eventForm.priceLabel} onChange={(event) => setEventForm({ ...eventForm, priceLabel: event.target.value })} placeholder="For example, From KES 8,500 per person" /></label>
            <label className="workspace-field wide">Description<textarea className="workspace-textarea" data-testid="input-event-description" required minLength={2} maxLength={2000} rows={4} value={eventForm.description} onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} placeholder="What makes this dated event special?" /></label>
            <label className="workspace-field wide">URL slug<input className="workspace-input" data-testid="input-event-slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} value={eventForm.slug} onChange={(event) => setEventForm({ ...eventForm, slug: event.target.value })} placeholder="Leave blank to generate from title and date" /><small>A unique slug is generated if this is left blank.</small></label>
            <label className="workspace-field wide">Event image path or URL<input className="workspace-input" data-testid="input-event-image" maxLength={500} value={eventForm.heroImageUrl} onChange={(event) => setEventForm({ ...eventForm, heroImageUrl: event.target.value })} placeholder="/images/trips/example.jpg or https://…" /><small>Optional. The carousel uses a branded background if no image is provided.</small></label>
            {eventForm.heroImageUrl && <div className="trip-image-preview-wrap wide"><span>Event image preview</span><img className="trip-image-preview" src={eventForm.heroImageUrl} alt="Event preview" /></div>}
            <label className="workspace-check"><input data-testid="check-event-published" type="checkbox" checked={eventForm.isPublished} onChange={(event) => setEventForm({ ...eventForm, isPublished: event.target.checked })} /> Publish on the homepage carousel</label>
            <div className="workspace-form-actions wide"><button className="admin-primary" data-testid="button-event-save" type="submit" disabled={isSavingEvent}>{isSavingEvent ? 'Saving…' : editingEvent === null ? 'Create event' : 'Save event'}</button>{editingEvent !== null && <button className="admin-secondary" data-testid="button-event-cancel" type="button" onClick={resetEventForm}>Cancel</button>}</div>
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
          <div className="admin-toolbar"><div><h3>Website pages</h3><p>Create public pages, edit policy content, and manage the homepage hero.</p></div></div>
          {contentQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /></div> : <div className="workspace-card-grid" data-testid="list-admin-content">
            {visibleContent.map((item) => <article className="workspace-panel workspace-content-card" key={item.pageKey} data-testid={`card-site-content-${item.pageKey}`}><div><span className={`status ${item.isPublished ? 'confirmed' : 'new'}`}>{item.isPublished ? 'Published' : 'Draft'}</span><h3 style={{ marginTop: 12 }}>{item.pageTitle}</h3><p>/{item.pageKey} · Updated {formatDate(item.updatedAt)}</p></div><p>{item.heroTitle || item.seoDescription || 'No hero copy entered yet.'}</p><div className="workspace-form-actions"><button className="admin-secondary" data-testid={`button-content-edit-${item.pageKey}`} onClick={() => editContent(item)}>Edit page</button>{item.isPublished && <Link className="admin-secondary" data-testid={`link-content-view-${item.pageKey}`} href={`/${item.pageKey}`}>View page</Link>}</div></article>)}
            {visibleContent.length === 0 && <div className="workspace-panel workspace-empty" data-testid="empty-admin-content">{queryText ? 'No pages match this search.' : 'No page content found. Add a page record below.'}</div>}
          </div>}
          <form className="workspace-form" onSubmit={submitContent} data-testid="form-admin-content">
            <h3>{editingPage ? `Edit ${contentForm.pageTitle || editingPage}` : 'Add or update a page'}</h3>
            <label className="workspace-field">Page key<input className="workspace-input" data-testid="input-content-page-key" required pattern="[a-z0-9-]+" maxLength={60} value={contentForm.pageKey} readOnly={Boolean(editingPage)} onChange={(event) => setContentForm({ ...contentForm, pageKey: event.target.value })} placeholder="home" /><small>{editingPage ? 'The public URL stays stable after a page is created.' : 'This becomes the public URL, for example terms.'}</small></label>
            <label className="workspace-field">Page title<input className="workspace-input" data-testid="input-content-page-title" required minLength={2} maxLength={160} value={contentForm.pageTitle} onChange={(event) => setContentForm({ ...contentForm, pageTitle: event.target.value })} placeholder="Home" /></label>
            <label className="workspace-field wide">Hero title<input className="workspace-input" data-testid="input-content-hero-title" maxLength={240} value={contentForm.heroTitle} onChange={(event) => setContentForm({ ...contentForm, heroTitle: event.target.value })} /></label>
            <label className="workspace-field wide">Hero subtitle<textarea className="workspace-textarea" data-testid="input-content-hero-subtitle" maxLength={2000} rows={3} value={contentForm.heroSubtitle} onChange={(event) => setContentForm({ ...contentForm, heroSubtitle: event.target.value })} /></label>
            <label className="workspace-field wide">SEO description<textarea className="workspace-textarea" data-testid="input-content-seo-description" maxLength={500} rows={2} value={contentForm.seoDescription} onChange={(event) => setContentForm({ ...contentForm, seoDescription: event.target.value })} /></label>
            <label className="workspace-field wide">Page body content<textarea className="workspace-textarea" data-testid="input-content-body" maxLength={20000} rows={12} value={contentForm.bodyContent} onChange={(event) => setContentForm({ ...contentForm, bodyContent: event.target.value })} /><small>Use ## for section headings, blank lines between paragraphs, and - for bullet points. HTML is not rendered.</small></label>
            {contentForm.pageKey.trim().toLowerCase() === 'home' && <>
              <label className="workspace-field">Hero display mode<select className="workspace-input" data-testid="select-home-hero-mode" value={contentForm.heroMode} onChange={(event) => setContentForm({ ...contentForm, heroMode: event.target.value as ContentForm['heroMode'] })}><option value="static">One static image</option><option value="slideshow">Smooth slideshow</option></select><small>Slides advance automatically and include pause and manual controls.</small></label>
              <div className="workspace-field wide hero-image-editor"><span>Homepage hero images</span><small>Add up to eight public image URLs or paths. The first image is used if the slideshow is off.</small>
                {contentForm.heroImages.map((image, index) => <div className="hero-image-row" key={index}>
                  <label className="workspace-field">Image {index + 1}<input className="workspace-input" data-testid={`input-home-hero-image-${index}`} maxLength={500} value={image} onChange={(event) => updateHeroImage(index, event.target.value)} placeholder="/images/adventure-hero.png or https://…" /></label>
                  {image && <img className="hero-image-preview" src={image} alt={`Homepage hero image ${index + 1} preview`} loading="lazy" />}
                  <div className="hero-image-actions">
                    <button className="admin-secondary" type="button" aria-label={`Move image ${index + 1} up`} onClick={() => moveHeroImage(index, -1)} disabled={index === 0}>Move up</button>
                    <button className="admin-secondary" type="button" aria-label={`Move image ${index + 1} down`} onClick={() => moveHeroImage(index, 1)} disabled={index === contentForm.heroImages.length - 1}>Move down</button>
                    <button className="admin-secondary" type="button" aria-label={`Remove image ${index + 1}`} onClick={() => removeHeroImage(index)}>Remove</button>
                  </div>
                </div>)}
                {contentForm.heroImages.length === 0 && <p className="hero-image-empty">No homepage images added. The built-in LinkUps image will be used.</p>}
                <button className="admin-secondary" data-testid="button-home-hero-add-image" type="button" onClick={addHeroImage} disabled={contentForm.heroImages.length >= 8}>Add another image</button>
              </div>
            </>}
            <label className="workspace-check"><input data-testid="check-content-published" type="checkbox" checked={contentForm.isPublished} onChange={(event) => setContentForm({ ...contentForm, isPublished: event.target.checked })} /> Publish this page content</label>
            <div className="workspace-form-actions wide"><button className="admin-primary" data-testid="button-content-save" type="submit" disabled={isSavingContent}>{isSavingContent ? 'Saving page…' : 'Save page content'}</button>{editingPage && <button className="admin-secondary" data-testid="button-content-cancel" type="button" onClick={resetContentForm}>Clear form</button>}</div>
          </form>
        </section>}
      </section>
    </main>
  </div>
}
