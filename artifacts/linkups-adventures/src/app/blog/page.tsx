import { Link } from 'wouter'
import { ArrowRight, CalendarDays, Clock3, Mail, Send, Sparkles } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'

const posts = [
  ['10 Reasons Why Maasai Mara Should Be On Your Bucket List', '/images/adventure-hero.png', 'Destinations', '12 Aug 2025', '6 min read', 'From incredible wildlife to breathtaking sunsets, here is why Maasai Mara is a must-visit destination.'],
  ['Packing Smart For Your Beach Getaway', '/images/adventure-coast.png', 'Travel Tips', '8 Aug 2025', '4 min read', 'Essential items, travel hacks and pro tips to make your beach trip stress-free and fun.'],
  ['Rafting In Kenya: What To Expect & How To Prepare', '/images/adventure-mountain.png', 'Adventure Guides', '3 Aug 2025', '5 min read', 'Get ready for an adrenaline rush with everything you need before you hit the rapids.'],
  ['Girls Trip To Mombasa: Sun, Sand & Sisterhood', '/images/group-travel-hero.png', 'Travel Stories', '27 Jul 2025', '4 min read', 'Real stories, laughs, and unforgettable moments from our recent girls’ getaway.'],
  ['Naivasha: More Than Just A Day Trip', '/images/adventure-mountain.png', 'Destinations', '18 Jul 2025', '4 min read', 'From boat rides to hot springs, here is how to make the most of your Naivasha adventure.'],
  ['Camping 101: A Beginner’s Guide', '/images/adventure-camp.png', 'Travel Tips', '10 Jul 2025', '5 min read', 'From gear to safety tips, we have you covered for your first camping experience.'],
]
const categories = ['All Posts', 'Travel Tips', 'Destinations', 'Adventure Guides', 'Group Travel', 'Food & Culture', 'Travel Stories']

function PostCard({ post, featured = false, secondary = false }: { post: typeof posts[number]; featured?: boolean; secondary?: boolean }) {
  return <article className={`blog-card${featured ? ' featured-post' : ''}${secondary ? ' secondary-post' : ''}`}><img src={post[1]} alt={post[0]} /><div className="blog-card-body"><span className="blog-tag">{post[2]}</span><div className="blog-meta"><span><CalendarDays /> {post[3]}</span><span><Clock3 /> {post[4]}</span></div><h2>{post[0]}</h2><p>{post[5]}</p><Link href="/plan" className="blog-read">Read More <ArrowRight /></Link></div></article>
}

export default function BlogPage() {
  return <PageFrame><main className="blog-page"><section className="blog-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(0,43,36,.86),rgba(0,43,36,.16)),url('/images/adventure-mountain.png')` }}><div><span className="blog-eyebrow">The LinkUps Adventures</span><h1><em>Blog</em></h1><p>Travel tips, real stories, destination guides, and everything adventure. Get inspired, plan better and make the most of your next journey.</p></div></section><nav className="blog-categories" aria-label="Blog categories">{categories.map((category, index) => <Link className={index === 0 ? 'active' : ''} href={`/blog?category=${category.toLowerCase().replaceAll(' ', '-')}`} key={category}><Sparkles />{category}</Link>)}</nav><section className="blog-layout"><div className="blog-main"><div className="blog-grid"><PostCard post={posts[0]} featured /><PostCard post={posts[1]} secondary />{posts.slice(2).map(post => <PostCard post={post} key={post[0]} />)}</div><nav className="pagination" aria-label="Pagination"><b>1</b><span>2</span><span>3</span><span>4</span><span>5</span><b>›</b></nav></div><aside className="blog-sidebar"><section className="newsletter-card"><Send /><h2>Join our newsletter</h2><p>Get travel tips, new packages, exclusive deals and adventure inspiration straight to your inbox.</p><form><input type="email" placeholder="Your email address" aria-label="Your email address" /><button>Subscribe <ArrowRight /></button></form></section><section className="popular-card"><h2>Popular posts</h2>{posts.slice(0, 5).map(post => <Link href="/plan" key={post[0]}><img src={post[1]} alt="" /><span><strong>{post[0]}</strong><small><Clock3 /> {post[4]}</small></span></Link>)}</section><Link className="blog-cta" href="/adventures"><span>Your next adventure is just a click away.</span><b>Explore adventures <ArrowRight /></b></Link></aside></section></main></PageFrame>
}
