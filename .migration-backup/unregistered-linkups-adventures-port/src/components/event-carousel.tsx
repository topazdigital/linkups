import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link } from 'wouter'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Pause, Play } from 'lucide-react'
import { getListPublicEventsQueryKey, useListPublicEvents } from '@workspace/api-client-react'
import type { Event } from '@workspace/api-client-react'
import { optimizedImageUrl } from '@/components/site-image'

function eventDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function eventContactLink(item: Event) {
  const params = new URLSearchParams({ eventTitle: item.title, eventDate: item.eventDate, eventLocation: item.location })
  return `/contact?${params.toString()}`
}

export function EventCarousel() {
  const eventsQuery = useListPublicEvents({
    query: {
      queryKey: getListPublicEventsQueryKey(),
      retry: false,
    },
  })
  const events = eventsQuery.data ?? []
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (active >= events.length) setActive(0)
  }, [active, events.length])

  useEffect(() => {
    if (
      events.length < 2 ||
      isPaused ||
      isHovered ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % events.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [events.length, isHovered, isPaused])

  if (!eventsQuery.isLoading && !eventsQuery.error && events.length === 0) return null

  function move(direction: number) {
    if (events.length < 2) return
    setActive((current) => (current + direction + events.length) % events.length)
  }
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
  }

  return <section
    className={`events-section${eventsQuery.error ? ' has-error' : ''}`}
    aria-labelledby="events-heading"
    onKeyDown={handleKeyDown}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    onFocusCapture={() => setIsHovered(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsHovered(false)
    }}
    data-testid="section-home-events"
  >
    <div className="events-heading">
      <div><span className="eyebrow">The crew is going places</span><h2 id="events-heading">Dates worth looking forward to.</h2><p>Join a real LinkUps departure and make the journey part of the story.</p></div>
      {!eventsQuery.isLoading && events.length > 1 && <div className="events-controls">
        <button type="button" className="events-arrow" aria-label="Previous event" data-testid="button-events-previous" onClick={() => move(-1)}><ArrowLeft /></button>
        <span aria-live="polite" className="events-count">{String(active + 1).padStart(2, '0')} <i>/</i> {String(events.length).padStart(2, '0')}</span>
        <button type="button" className="events-arrow" aria-label="Next event" data-testid="button-events-next" onClick={() => move(1)}><ArrowRight /></button>
        <button
          type="button"
          className="events-arrow"
          aria-label={isPaused ? 'Resume event slides' : 'Pause event slides'}
          aria-pressed={isPaused}
          data-testid="button-events-autoplay"
          onClick={() => setIsPaused((paused) => !paused)}
        >
          {isPaused ? <Play /> : <Pause />}
        </button>
      </div>}
    </div>
    {eventsQuery.isLoading ? <div className="events-loading" role="status" data-testid="status-events-loading"><div className="skeleton" /><div className="skeleton" /></div> :
      eventsQuery.error ? <div className="events-message" role="alert" data-testid="error-public-events"><span>Upcoming departures are taking a moment to load.</span><button type="button" onClick={() => void eventsQuery.refetch()} data-testid="button-events-retry">Try again</button></div> :
        <div className="events-stage">
          {events.map((item, index) => <article className={`event-slide ${index === active ? 'is-active' : ''}`} key={item.id} aria-hidden={index !== active} data-testid={`card-public-event-${item.id}`} style={{ backgroundImage: item.heroImageUrl ? `linear-gradient(90deg, rgba(9,43,37,.91), rgba(9,43,37,.18)), url("${optimizedImageUrl(item.heroImageUrl)}")` : 'linear-gradient(115deg, #16483f, #32725e)' }}>
            <div className="event-slide-copy"><span className="event-label">LinkUps scheduled adventure</span><h3>{item.title}</h3><p>{item.description}</p><div className="event-meta"><span><CalendarDays />{eventDate(item.eventDate)}</span><span><MapPin />{item.location}</span>{item.priceLabel && <strong>{item.priceLabel}</strong>}</div><Link className="button orange event-cta" href={eventContactLink(item)} data-testid={`link-event-enquire-${item.id}`}>Ask about this event <ArrowRight /></Link></div>
            <div className="event-slide-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
          </article>)}
          {events.length > 1 && <div className="event-indicators" role="group" aria-label="Choose event slide">{events.map((item, index) => <button type="button" key={item.id} className={index === active ? 'active' : ''} aria-label={`Show event ${index + 1}: ${item.title}`} aria-current={index === active ? 'true' : undefined} data-testid={`button-event-indicator-${index}`} onClick={() => setActive(index)} />)}</div>}
        </div>}
  </section>
}
