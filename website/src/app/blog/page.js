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
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">News & Blog</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">Blog</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="blog-area py-100">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-5">
              <i className="far fa-newspaper" style={{ fontSize: 48, color: '#ddd', marginBottom: 15, display: 'block' }}></i>
              <h4>No Blog Posts Yet</h4>
              <p>Check back soon for latest news and updates!</p>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {posts.map((post) => (
                  <div className="col-md-6 col-lg-4" key={post.id}>
                    <div className="blog-item wow fadeInUp" data-wow-delay=".25s">
                      <div className="blog-item-img">
                        <img src={post.image || '/assets/img/blog/01.jpg'} alt={getTitle(post)} onError={e => { e.target.src = '/assets/img/blog/01.jpg'; }} />
                        <span className="blog-date"><i className="far fa-calendar-alt"></i> {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="blog-item-info">
                        <div className="blog-item-meta">
                          <ul>
                            <li><i className="far fa-user-circle"></i> By {post.authorName || 'Admin'}</li>
                            <li><i className="far fa-eye"></i> {post.viewCount || 0} Views</li>
                            {post.category && <li><i className="far fa-folder"></i> {post.category}</li>}
                          </ul>
                        </div>
                        <h4 className="blog-title">
                          <Link href={`/blog/${post.slug}`}>{getTitle(post)}</Link>
                        </h4>
                        <p>{getExcerpt(post) || ''}</p>
                        <Link className="theme-btn" href={`/blog/${post.slug}`}>Read More<i className="fas fa-arrow-right"></i></Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-area mt-4">
                  <nav>
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                          <i className="far fa-angle-left"></i>
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                        </li>
                      ))}
                      <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
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
      </div>
    </>
  );
}
