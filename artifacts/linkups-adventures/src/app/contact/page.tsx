'use client'

import { FormEvent, useState } from 'react'
import { Link } from 'wouter'
import { Check, ChevronDown, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, Users, Wallet } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'

const faqs = [
  ['How do I make a booking?', 'Send us a message with your dates and preferred adventure. Our team will guide you from there.'],
  ['What is your cancellation policy?', 'Cancellation terms depend on the package and dates. We will share everything clearly before confirmation.'],
  ['Do you offer group discounts?', 'Yes. Groups, families and corporate travellers can receive tailored rates and itineraries.'],
  ['Can you customise a package to our budget?', 'Absolutely. Tell us what matters most and we will shape the experience around your people and budget.'],
  ['What payment methods do you accept?', 'We accept M-Pesa and other confirmed payment options shared during booking.'],
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  return <PageFrame>
    <section className="contact-hero" style={{ backgroundImage: "linear-gradient(90deg,rgba(0,42,35,.86),rgba(0,42,35,.2)),url('/images/group-travel-hero.png')" }}><div><span className="contact-ribbon">Get in touch</span><h1>Contact us<br /><em>we&apos;d love to hear from you!</em></h1><p>Have a question, need help with a booking, or want to plan your next adventure? Our team is here to assist you. Reach out — we&apos;re just a message away!</p></div></section>
    <section className="contact-main"><div className="contact-details"><span className="eyebrow">Our contact details</span><h2>Let&apos;s connect.</h2><p>We are always here to help.</p><div className="contact-item"><span><Phone /></span><div><b>Phone</b><strong>0726 843 677</strong><small>Call or WhatsApp</small></div></div><div className="contact-item"><span><Mail /></span><div><b>Email</b><strong>linkupsadventures@gmail.com</strong><small>We usually respond within 24 hours.</small></div></div><div className="contact-item"><span><Wallet /></span><div><b>M-Pesa Till</b><strong>5139557</strong><small>Linkups Adventures</small></div></div><div className="contact-item"><span><MessageCircle /></span><div><b>Follow Us</b><strong>@LinkupsAdventures</strong><small>For updates, deals and inspiration.</small></div></div></div><div className="contact-start"><h2>Your adventure<br />starts here.</h2><div><Check /> Tours &amp; Travel</div><div><Users /> Group Bookings</div><div><ShieldCheck /> Custom Packages</div><div><MessageCircle /> Travel Support</div></div><div className="contact-form-card"><h2><Mail /> Send us a message</h2><p>Fill in the form below and we&apos;ll get back to you soon.</p>{sent?<div className="success-box">Message sent. We&apos;ll be in touch soon.</div>:<form onSubmit={(e:FormEvent)=>{e.preventDefault();setSent(true)}}><input placeholder="Full Name *" required /><input type="email" placeholder="Email Address *" required /><input placeholder="Phone Number *" required /><select defaultValue=""><option value="" disabled>Select Service / Interest *</option><option>Tours &amp; Travel</option><option>Group Booking</option><option>Custom Package</option></select><textarea placeholder="Your Message *" required /><button className="button orange"><Send /> Send message</button></form>}</div></section>
    <section className="visit-section"><div className="visit-copy"><span className="eyebrow">Visit us</span><h2>We are based in Nairobi, Kenya.</h2><p>Come say hi or visit our office by appointment.</p><div><MapPin /><b>Nairobi, Kenya</b><small>Exact location available on request</small></div><strong>We can&apos;t wait<br />to meet you.</strong></div><div className="map-card"><div className="map-pin"><MapPin /></div><b>Nairobi, Kenya</b><small>View location details</small></div></section>
    <section className="faq-section"><div className="faq-image" /><div className="faq-list"><span className="eyebrow">Frequently asked questions</span><h2>Need to know?</h2>{faqs.map(([question,answer], index)=><div className="faq-item" key={question}><button onClick={()=>setOpenFaq(openFaq===index?null:index)}>{question}<ChevronDown className={openFaq===index?'rotated':''} /></button>{openFaq===index&&<p>{answer}</p>}</div>)}</div><div className="faq-cta"><h2>Adventure<br />is calling...</h2><Link className="button orange" href="/plan">Plan your next trip <Send /></Link></div></section>
  </PageFrame>
}
