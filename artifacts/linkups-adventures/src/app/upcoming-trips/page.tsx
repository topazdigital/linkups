import { ArrowRight } from 'lucide-react'
import { Link } from 'wouter'
import { AdventureCards } from '@/components/adventure-cards'
import { PageFrame, SectionTitle } from '@/components/site-shell'

export default function UpcomingTripsPage() {
  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <span className="eyebrow orange-text">Plan with LinkUps</span>
          <h1>Upcoming trips</h1>
          <p>Choose an adventure and tell us when you would like to travel.</p>
        </div>
      </section>
      <main className="upcoming-page">
        <section className="departure-notice">
          <div>
            <strong>Departure dates are confirmed on request.</strong>
            <p>
              We do not publish fixed departure dates or live seat counts yet.
              Send your preferred dates and group size, and our team will check
              availability with you before confirming a booking.
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
