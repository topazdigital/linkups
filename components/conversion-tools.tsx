'use client'

import Link from 'next/link'
import { MessageCircle, Sparkles, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const questions = [
  { label: 'What sounds best?', options: ['Wildlife', 'Beach', 'Mountains', 'Road trip'] },
  { label: 'Who are you travelling with?', options: ['Solo', 'Partner', 'Family', 'Friends'] },
  { label: 'What pace do you prefer?', options: ['Relaxed', 'Balanced', 'Full adventure'] },
]
export function ConversionTools() {
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  return <><a className="floating-whatsapp" href="https://wa.me/254726843677?text=Hi%20LinkUps%20Adventures%2C%20I%27d%20like%20help%20planning%20a%20trip." target="_blank" rel="noreferrer" aria-label="Chat with LinkUps on WhatsApp"><MessageCircle /></a><div className="mobile-action-bar"><Link href="/plan">Book / Enquire <ArrowRight /></Link><a href="https://wa.me/254726843677" target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></div></>
}
export function AdventureQuiz() {
  const question = questions[step]
  return <section className="quiz-card"><span className="eyebrow"><Sparkles /> Find your fit</span><h2>Choose your adventure vibe</h2><p>{question.label}</p><div className="quiz-options">{question.options.map((option) => <button key={option} onClick={() => { if (step === questions.length - 1) setTimeout(() => {}, 0); }}>{option}</button>)}</div><div className="quiz-progress">{step + 1} of {questions.length}<button onClick={() => setStep((step + 1) % questions.length)}>Next <ArrowRight /></button></div></section>
}
