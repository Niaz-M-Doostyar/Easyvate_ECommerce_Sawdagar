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
    <div className="text-center py-5" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  );

  if (notFound || !post) return (
    <div className="text-center py-5" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <i className="far fa-frown" style={{ fontSize: 48, color: '#ddd', marginBottom: 15 }}></i>
      <h3>Post Not Found</h3>
      <p>The blog post you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/blog" className="theme-btn mt-3">Back to Blog</Link>
    </div>
  );

  return (
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{getTitle(post)}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li className="active">{getTitle(post)}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="blog-single-area py-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="blog-single-wrap">
                {post.image && (
                  <div className="blog-single-img mb-4">
                    <img src={post.image} alt={getTitle(post)} className="w-100 rounded" style={{ maxHeight: 500, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                )}
                <div className="blog-single-content">
                  <div className="blog-single-meta mb-3">
                    <span><i className="far fa-user-circle"></i> {post.authorName || 'Admin'}</span>
                    <span className="ms-3"><i className="far fa-calendar-alt"></i> {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span className="ms-3"><i className="far fa-eye"></i> {post.viewCount || 0} views</span>
                    {post.category && <span className="ms-3"><i className="far fa-folder"></i> {post.category}</span>}
                  </div>
                  <h2 className="blog-single-title mb-3">{getTitle(post)}</h2>
                  <div className="blog-single-text" dangerouslySetInnerHTML={{ __html: getContent(post) || '' }} />
                  {post.tags && (
                    <div className="blog-single-tags mt-4">
                      <strong>Tags: </strong>
                      {post.tags.split(',').map((tag, i) => (
                        <span key={i} className="badge bg-secondary me-1">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <Link href="/blog" className="theme-btn"><i className="fas fa-arrow-left me-1"></i> Back to Blog</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
