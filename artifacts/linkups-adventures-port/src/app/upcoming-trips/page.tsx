import { ArrowRight } from 'lucide-react'
import { Link } from 'wouter'
import { AdventureCards } from '@/components/adventure-cards'
import { EventCarousel } from '@/components/event-carousel'
import { PageFrame, SectionTitle } from '@/components/site-shell'

export default function UpcomingTripsPage() {
  return (
    <PageFrame>
      <section className="page-hero upcoming-trips-hero">
        <div>
          <span className="eyebrow orange-text">Plan with LinkUps</span>
          <h1>Upcoming trips</h1>
          <p>Choose an adventure and tell us when you would like to travel.</p>
        </div>
      </section>
      <main className="upcoming-page">
        <EventCarousel />
        <section className="departure-notice">
          <div>
            <strong>Looking for a flexible-date adventure?</strong>
            <p>
              The trips below can be requested for dates that work for you. Our
              team will confirm availability and details before booking.
              Scheduled events above have their own published dates.
            </p>
          </div>
          <Link className="button orange" href="/plan">
            Ask about dates <ArrowRight />
          </Link>
        </section>
        <SectionTitle eyebrow="Choose an adventure" title="Browse current trips" />
        <AdventureCards />
      </main>
    </PageFrame>
  )
}
