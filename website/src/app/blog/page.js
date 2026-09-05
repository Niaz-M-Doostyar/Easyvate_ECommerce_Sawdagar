"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BlogPage() {
  const { lang } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/blog?page=${page}&limit=9`)
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts || []);
        setTotalPages(d.totalPages || 1);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page]);

  const getTitle = (p) => lang === 'ps' ? (p.titlePs || p.titleEn) : lang === 'dr' ? (p.titleDr || p.titleEn) : p.titleEn;
  const getExcerpt = (p) => lang === 'ps' ? (p.excerptPs || p.excerptEn) : lang === 'dr' ? (p.excerptDr || p.excerptEn) : p.excerptEn;

  return (
    <div className="f2-content-page f2-blog-page">
      <div className="site-breadcrumb f2-content-crumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h1 className="breadcrumb-title">News & Blog</h1>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">Blog</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="blog-area f2-content-section f2-blog-index">
        <div className="container">
          <header className="f2-content-heading f2-content-heading--center f2-blog-index__heading">
            <span className="f2-content-eyebrow">Stories from Sawdagar</span>
            <h2>Latest news and ideas</h2>
            <p>Marketplace updates, product inspiration, and useful guides from our team.</p>
          </header>
          {loading ? (
            <div className="f2-content-state" role="status">
              <span className="f2-content-spinner f2-content-spinner--large" aria-hidden="true" />
              <span>Loading posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="f2-content-state f2-content-state--empty">
              <span className="f2-content-state__icon"><i className="far fa-newspaper" aria-hidden="true"></i></span>
              <h2>No Blog Posts Yet</h2>
              <p>Check back soon for latest news and updates!</p>
            </div>
          ) : (
            <>
              <div className="row g-4 f2-blog-grid">
                {posts.map((post) => (
                  <div className="col-md-6 col-lg-4" key={post.id}>
                    <article className="blog-item f2-blog-card wow fadeInUp" data-wow-delay=".25s">
                      <div className="blog-item-img f2-blog-card__media">
                        <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
                          <img src={post.image || '/assets/img/blog/01.jpg'} alt="" onError={e => { e.target.src = '/assets/img/blog/01.jpg'; }} />
                        </Link>
                        <span className="blog-date"><i className="far fa-calendar-alt"></i> {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="blog-item-info f2-blog-card__body">
                        <div className="blog-item-meta">
                          <ul>
                            <li><i className="far fa-user-circle"></i> By {post.authorName || 'Admin'}</li>
                            <li><i className="far fa-eye"></i> {post.viewCount || 0} Views</li>
                            {post.category && <li><i className="far fa-folder"></i> {post.category}</li>}
                          </ul>
                        </div>
                        <h2 className="blog-title">
                          <Link href={`/blog/${post.slug}`}>{getTitle(post)}</Link>
                        </h2>
                        <p>{getExcerpt(post) || ''}</p>
                        <Link className="f2-content-text-link" href={`/blog/${post.slug}`}>Read More<i className="fas fa-arrow-right"></i></Link>
                      </div>
                    </article>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-area f2-content-pagination">
                  <nav aria-label="Blog pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
                          <i className="far fa-angle-left"></i>
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                          <button type="button" className="page-link" onClick={() => setPage(p)} aria-current={page === p ? 'page' : undefined}>{p}</button>
                        </li>
                      ))}
                      <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page">
                          <i className="far fa-angle-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
