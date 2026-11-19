'use client'

import { useState, type FormEvent } from 'react'
import { PageFrame } from '@/components/site-shell'
import { ApiRequestError, createBooking, formatAdventurePrice, formatKes } from '@/lib/api'
import { useAdventures } from '@/lib/use-adventures'

export default function PlanPage() {
  const [selectedAdventure, setSelectedAdventure] = useState(() =>
    typeof window === 'undefined'
      ? ''
      : new URLSearchParams(window.location.search).get('tour') ?? '',
  )
  const [reference, setReference] = useState('')
  const [estimate, setEstimate] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const { adventures, loading: adventuresLoading, error: adventuresError } = useAdventures()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSending(true)
    const form = new FormData(event.currentTarget)
    const specialRequests = [
      String(form.get('details') ?? '').trim(),
      form.get('budget') ? `Budget per person: ${form.get('budget')}` : '',
      form.get('transport') ? `Transport: ${form.get('transport')}` : '',
      form.get('accommodation') ? `Accommodation: ${form.get('accommodation')}` : '',
    ].filter(Boolean).join('\n')

    try {
      const result = await createBooking({
        fullName: String(form.get('fullName') ?? ''),
        email: String(form.get('email') ?? ''),
        phone: String(form.get('phone') ?? ''),
        adventureSlug: selectedAdventure || null,
        travelDate: String(form.get('travelDate') ?? '') || null,
        travellers: Number(form.get('travellers') ?? 1),
        specialRequests,
      })
      setReference(result.reference)
      setEstimate(result.totalAmount)
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? reason.message : 'Your booking request could not be sent.')
    } finally {
      setSending(false)
    }
  }

  const selected = adventures.find((item) => item.slug === selectedAdventure)

  return <PageFrame><section className="form-page planner-page"><div className="planner-intro"><span className="eyebrow">Your adventure starts here</span><h1>Plan a trip that feels like you.</h1><p>Share your contact details and the trip basics. Our team will confirm availability, itinerary and final price before you pay.</p></div><div className="form-card planner-card">
    {reference ? <div className="success-box" role="status"><h2>Booking request received</h2><p>Your reference is <strong>{reference}</strong>. We’ll contact you to confirm the trip details.</p>{estimate !== null && <p>{estimate > 0 ? `Estimated total: ${formatKes(estimate)}. ` : ''}No online payment has been taken. Please wait for confirmation before paying.</p>}</div> : <form className="auth-form planner-form" onSubmit={submit}>
      <div className="planner-contact-grid">
        <label>Your name<input name="fullName" required minLength={2} maxLength={150} placeholder="Full name" autoComplete="name" /></label>
        <label>Email address<input name="email" required type="email" maxLength={190} placeholder="you@example.com" autoComplete="email" /></label>
        <label>Phone number<input name="phone" required minLength={5} maxLength={30} type="tel" placeholder="+254..." autoComplete="tel" /></label>
        <label>What are you planning?
          <select name="adventureSlug" value={selectedAdventure} onChange={(event) => setSelectedAdventure(event.target.value)}>
            <option value="">Custom trip / not sure yet</option>
            {adventures.map((adventure) => <option value={adventure.slug} key={adventure.id}>{adventure.title} — {formatAdventurePrice(adventure)}{adventure.price > 0 || adventure.priceUsd ? ' per person' : ''}</option>)}
          </select>
        </label>
      </div>
      {adventuresLoading && <small>Loading published adventures…</small>}
      {adventuresError && <small role="status">The catalogue is unavailable. You can still request a custom trip.</small>}
      {selected && <p className="booking-estimate">Current listed price: {formatAdventurePrice(selected)}{selected.price > 0 || selected.priceUsd ? ' per person' : ''}. Final price and availability are confirmed by our team.</p>}
      <div className="form-two planner-date-row"><label>Preferred date<input name="travelDate" type="date" /></label><label>Travellers<input name="travellers" type="number" min="1" max="40" defaultValue="1" required /></label></div>
      <details className="planner-optional">
        <summary>Optional trip preferences <span>Budget, transport, stay and notes</span></summary>
        <div className="planner-options-grid">
          <label>Budget per person<input name="budget" placeholder="KES 20,000" /></label>
          <label>Transport<select name="transport" defaultValue=""><option value="">Preference</option><option>Private vehicle</option><option>Shared vehicle</option><option>Open to options</option></select></label>
          <label>Accommodation preference<select name="accommodation" defaultValue=""><option value="">Select one</option><option>Budget</option><option>Comfort</option><option>Luxury</option><option>Open to options</option></select></label>
          <label className="planner-notes">Anything else? <textarea name="details" maxLength={8000} rows={3} placeholder="Experiences, dietary needs or other requests..." /></label>
        </div>
      </details>
      {error && <div className="error-box" role="alert">{error}</div>}
      <button className="button orange planner-submit" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send booking request'}</button>
    </form>}
  </div></section></PageFrame>
}
