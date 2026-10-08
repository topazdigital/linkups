'use client'

import Link from 'next/link'
import { ArrowRight, MessageCircle, RotateCcw, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

const questions = [
  { label: 'What sounds best?', options: ['Wildlife', 'Beach', 'Mountains', 'Road trip'] },
  { label: 'Who are you travelling with?', options: ['Solo', 'Partner', 'Family', 'Friends'] },
  { label: 'What pace do you prefer?', options: ['Relaxed', 'Balanced', 'Full adventure'] },
]

const recommendations = {
  Wildlife: { title: 'The safari storyteller', text: 'You are made for big skies, wildlife and slow moments in the bush.', href: '/destinations/maasai-mara', tags: ['Wildlife', 'Family', 'Balanced'] },
  Beach: { title: 'The coastal escape artist', text: 'Trade busy days for warm water, fresh seafood and an easy coastal rhythm.', href: '/destinations/mombasa', tags: ['Beach', 'Partner', 'Relaxed'] },
  Mountains: { title: 'The highland explorer', text: 'You belong on scenic trails, cool mornings and wide-open mountain views.', href: '/destinations/amboseli', tags: ['Mountains', 'Solo', 'Full adventure'] },
  'Road trip': { title: 'The open-road seeker', text: 'Your perfect trip has changing scenery, local stops and room for stories.', href: '/adventures', tags: ['Road trip', 'Friends', 'Balanced'] },
} as const

type RecommendationKey = keyof typeof recommendations

function getRecommendation(answers: string[]) {
  const scored = Object.entries(recommendations).map(([key, recommendation]) => ({ key: key as RecommendationKey, score: recommendation.tags.reduce((total, tag) => total + (answers.includes(tag) ? 1 : 0), 0) }))
  return recommendations[scored.sort((a, b) => b.score - a.score)[0]?.key ?? 'Wildlife']
}

export function ConversionTools() {
  return <><a className="floating-whatsapp" href="https://wa.me/254726843677?text=Hi%20LinkUps%20Adventures%2C%20I%27d%20like%20help%20planning%20a%20trip." target="_blank" rel="noreferrer" aria-label="Chat with LinkUps on WhatsApp"><MessageCircle /></a><div className="mobile-action-bar"><Link href="/plan">Book / Enquire <ArrowRight /></Link><a href="https://wa.me/254726843677" target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></div></>
}

export function AdventureQuiz() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const finished = step >= questions.length
  const result = useMemo(() => getRecommendation(answers), [answers])
  const choose = (option: string) => setAnswers((current) => [...current.slice(0, step), option])
  if (finished) return <section className="quiz-card" aria-live="polite"><span className="eyebrow"><Sparkles /> Your match</span><h2>{result.title}</h2><p>{result.text}</p><p className="quiz-match-note">Based on your travel style, this is your best-fit starting point.</p><div className="quiz-result-actions"><Link className="button orange" href={result.href}>Explore your match <ArrowRight /></Link><button className="quiz-reset" onClick={() => { setAnswers([]); setStep(0) }}><RotateCcw /> Start again</button></div></section>
  const question = questions[step]
  return <section className="quiz-card"><span className="eyebrow"><Sparkles /> Find your fit</span><h2>Choose your adventure vibe</h2><p>{question.label}</p><div className="quiz-options">{question.options.map((option) => <button type="button" aria-pressed={answers[step] === option} className={answers[step] === option ? 'selected' : ''} key={option} onClick={() => choose(option)}>{option}</button>)}</div><div className="quiz-progress"><span>{step + 1} of {questions.length}</span><button disabled={!answers[step]} onClick={() => setStep((current) => current + 1)}>Next <ArrowRight /></button></div></section>
}
