"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useParams } from "next/navigation";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(d => setPost(d))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const getTitle = (p) => lang === 'ps' ? (p.titlePs || p.titleEn) : lang === 'dr' ? (p.titleDr || p.titleEn) : p.titleEn;
  const getContent = (p) => lang === 'ps' ? (p.contentPs || p.contentEn) : lang === 'dr' ? (p.contentDr || p.contentEn) : p.contentEn;

  if (loading) return (
    <div className="f2-content-page f2-blog-detail-page">
      <div className="f2-content-state f2-content-state--viewport" role="status">
        <span className="f2-content-spinner f2-content-spinner--large" aria-hidden="true" />
        <span>Loading post...</span>
      </div>
    </div>
  );

  if (notFound || !post) return (
    <div className="f2-content-page f2-blog-detail-page">
      <div className="f2-content-state f2-content-state--viewport f2-content-state--empty">
        <span className="f2-content-state__icon"><i className="far fa-frown" aria-hidden="true"></i></span>
        <h1>Post Not Found</h1>
        <p>The blog post you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/blog" className="f2-content-button">Back to Blog</Link>
      </div>
    </div>
  );

  return (
    <div className="f2-content-page f2-blog-detail-page">
      <div className="site-breadcrumb f2-content-crumb f2-content-crumb--article">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h1 className="breadcrumb-title">{getTitle(post)}</h1>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li className="active">{getTitle(post)}</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="blog-single-area f2-content-section f2-blog-article-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <article className="blog-single-wrap f2-blog-article">
                {post.image && (
                  <div className="blog-single-img f2-blog-article__media">
                    <img src={post.image} alt={getTitle(post)} onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                )}
                <div className="blog-single-content f2-blog-article__content">
                  <div className="blog-single-meta f2-blog-article__meta">
                    <span><i className="far fa-user-circle"></i> {post.authorName || 'Admin'}</span>
                    <span><i className="far fa-calendar-alt"></i> {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span><i className="far fa-eye"></i> {post.viewCount || 0} views</span>
                    {post.category && <span><i className="far fa-folder"></i> {post.category}</span>}
                  </div>
                  <h2 className="blog-single-title">{getTitle(post)}</h2>
                  <div className="blog-single-text f2-blog-article__text" dangerouslySetInnerHTML={{ __html: getContent(post) || '' }} />
                  {post.tags && (
                    <div className="blog-single-tags f2-blog-article__tags">
                      <strong>Tags: </strong>
                      {post.tags.split(',').map((tag, i) => (
                        <span key={i}>{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="f2-blog-article__back">
                    <Link href="/blog" className="f2-content-button f2-content-button--secondary"><i className="fas fa-arrow-left"></i> Back to Blog</Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
