'use client'

import { useState, type FormEvent } from 'react'
import { Link } from 'wouter'
import { ArrowRight, CalendarDays, Clock3, Mail, Send, Sparkles } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'
import { SiteImage } from '@/components/site-image'
import { useCreateNewsletterSubscription, useListPublicBlogPosts, type BlogPost } from '@workspace/api-client-react'
import { optimizedImageUrl } from '@/components/site-image'
import { useSiteImageOverrides } from '@/lib/use-site-image-overrides'
import './newsletter.css'

const categories = ['All Posts', 'Travel Tips', 'Destinations', 'Adventure Guides', 'Group Travel', 'Food & Culture', 'Travel Stories']

function formatPostDate(value: string | null) {
  if (!value) return 'Recently published'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Recently published'
    : date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function readTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

function PostCard({ post, featured = false, secondary = false }: { post: BlogPost; featured?: boolean; secondary?: boolean }) {
  return <article className={`blog-card${featured ? ' featured-post' : ''}${secondary ? ' secondary-post' : ''}`}><SiteImage src={post.coverImageUrl} alt={post.title} /><div className="blog-card-body"><span className="blog-tag">{post.category}</span><div className="blog-meta"><span><CalendarDays /> {formatPostDate(post.publishedAt || post.createdAt)}</span><span><Clock3 /> {readTime(post.content)}</span></div><h2>{post.title}</h2><p>{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="blog-read">Read More <ArrowRight /></Link></div></article>
}

export default function BlogPage() {
  const subscribe = useCreateNewsletterSubscription()
  const postsQuery = useListPublicBlogPosts()
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Posts')
  const { getImage } = useSiteImageOverrides('blog')
  const posts = postsQuery.data ?? []
  const filteredPosts = selectedCategory === 'All Posts'
    ? posts
    : posts.filter((post) => post.category.toLowerCase() === selectedCategory.toLowerCase())

  async function submitNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await subscribe.mutateAsync({
        data: {
          email: String(form.get('email') ?? '').trim(),
          consent: true,
        },
      })
      setSubscribed(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your subscription could not be saved.')
    }
  }

  return <PageFrame><main className="blog-page"><section className="blog-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,43,36,.86),rgba(0,43,36,.16)),url("${optimizedImageUrl(getImage('hero', '/images/adventure-mountain.webp'))}")` }}><div><span className="blog-eyebrow">The LinkUps Adventures</span><h1><em>Blog</em></h1><p>Travel tips, real stories, destination guides, and everything adventure. Get inspired, plan better and make the most of your next journey.</p></div></section><nav className="blog-categories" aria-label="Blog categories">{categories.map((category) => <Link className={selectedCategory === category ? 'active' : ''} href={`/blog?category=${category.toLowerCase().replaceAll(' ', '-')}`} key={category} onClick={(event) => { event.preventDefault(); setSelectedCategory(category) }}><Sparkles />{category}</Link>)}</nav><section className="blog-layout"><div className="blog-main">{postsQuery.isLoading ? <div className="workspace-skeletons" role="status"><div className="skeleton" /><div className="skeleton" /></div> : postsQuery.error ? <div className="empty-state" role="alert"><p>Stories could not be loaded right now.</p><button className="admin-secondary" type="button" onClick={() => void postsQuery.refetch()}>Try again</button></div> : filteredPosts.length ? <div className="blog-grid">{filteredPosts.map((post, index) => <PostCard post={post} key={post.id} featured={selectedCategory === 'All Posts' && index === 0} secondary={selectedCategory === 'All Posts' && index === 1} />)}</div> : <div className="empty-state">{selectedCategory === 'All Posts' ? 'No stories have been published yet.' : `There are no published stories in ${selectedCategory} yet.`}</div>}</div><aside className="blog-sidebar"><section className="newsletter-card"><Send /><h2>Join our newsletter</h2><p>Get travel tips, new packages, exclusive deals and adventure inspiration straight to your inbox.</p>{subscribed ? <div className="newsletter-feedback" role="status">You&apos;re subscribed. Thanks for opting in.</div> : <form onSubmit={submitNewsletter}>
        <input name="email" type="email" placeholder="Your email address" aria-label="Your email address" required maxLength={190} autoComplete="email" />
        <label className="newsletter-consent"><input name="consent" type="checkbox" required /><span>I agree to receive LinkUps travel tips, updates and offers by email.</span></label>
        {error && <div className="newsletter-feedback" role="alert">{error}</div>}
        <button type="submit" disabled={subscribe.isPending}>{subscribe.isPending ? 'Saving…' : <>Subscribe <ArrowRight /></>}</button>
        </form>}</section><section className="popular-card"><h2>Popular posts</h2>{posts.slice(0, 5).map(post => <Link href={`/blog/${post.slug}`} key={post.id}><SiteImage src={post.coverImageUrl} alt="" /><span><strong>{post.title}</strong><small><Clock3 /> {readTime(post.content)}</small></span></Link>)}</section><Link className="blog-cta" href="/adventures"><span>Your next adventure is just a click away.</span><b>Explore adventures <ArrowRight /></b></Link></aside></section></main></PageFrame>
}
