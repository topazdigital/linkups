import { Link } from 'wouter'
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { useGetPublicBlogPost, type BlogPost } from '@workspace/api-client-react'
import { PageFrame } from '@/components/site-shell'
import { SiteImage } from '@/components/site-image'
import './post.css'

function formatDate(value: string | null) {
  if (!value) return 'Recently published'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Recently published'
    : date.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

function renderContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const heading = block.match(/^#{1,3}\s+(.+)$/)
      if (heading) return <h2 key={index}>{heading[1]}</h2>

      const lines = block.split(/\r?\n/)
      if (lines.every((line) => /^[-*]\s+/.test(line.trim()))) {
        return <ul key={index}>{lines.map((line, lineIndex) => <li key={lineIndex}>{line.trim().replace(/^[-*]\s+/, '')}</li>)}</ul>
      }

      return <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{line}{lineIndex < lines.length - 1 && <br />}</span>)}</p>
    })
}

function Article({ post }: { post: BlogPost }) {
  return (
    <article className="blog-article">
      <Link className="blog-article-back" href="/blog"><ArrowLeft size={16} /> All stories</Link>
      <header className="blog-article-header">
        <span className="blog-tag">{post.category}</span>
        <h1>{post.title}</h1>
        <p className="blog-article-excerpt">{post.excerpt}</p>
        <div className="blog-article-meta">
          <span><CalendarDays size={16} /> {formatDate(post.publishedAt || post.createdAt)}</span>
          <span><Clock3 size={16} /> {readTime(post.content)}</span>
        </div>
      </header>
      <SiteImage className="blog-article-cover" src={post.coverImageUrl} alt={post.title} loading="eager" />
      <div className="blog-article-content">{renderContent(post.content)}</div>
      <footer className="blog-article-footer">
        <p>Ready to plan your own trip?</p>
        <Link className="button orange" href="/plan">Plan my adventure</Link>
      </footer>
    </article>
  )
}

export default function BlogPostPage({ slug }: { slug: string }) {
  const postQuery = useGetPublicBlogPost(slug)

  return (
    <PageFrame>
      <main className="blog-article-page">
        {postQuery.isLoading && <div className="blog-article-message" role="status">Loading this story…</div>}
        {postQuery.error && (
          <div className="blog-article-message" role="alert">
            <h1>This story isn’t available right now.</h1>
            <p>{postQuery.error.message || 'Please try again in a moment.'}</p>
            <button className="button orange" type="button" onClick={() => void postQuery.refetch()}>Try again</button>
          </div>
        )}
        {postQuery.data && <Article post={postQuery.data} />}
      </main>
    </PageFrame>
  )
}
