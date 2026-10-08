import { Link } from 'wouter'

export default function RegisterPage() {
  return <main className="auth-page"><div className="auth-card">
    <Link href="/" className="brand"><span>LinkUps</span><small>ADVENTURES</small></Link>
    <span className="eyebrow">Customer accounts</span>
    <h1>Bookings without an account</h1>
    <p>Customer accounts are not enabled. You can request a booking or send an enquiry without signing in.</p>
    <div className="form-row">
      <Link className="button orange" href="/plan">Request a booking</Link>
      <Link className="button dark" href="/contact">Send an enquiry</Link>
    </div>
  </div></main>
}
