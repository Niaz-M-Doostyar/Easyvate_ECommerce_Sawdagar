"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import siteContentDefaults from "@/data/siteContentDefaults.json";

export default function AboutPage() {
  const [content, setContent] = useState(siteContentDefaults.about);

  useEffect(() => {
    fetch("/api/site-content")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content?.about) {
          setContent(data.content.about);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">About Us</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">About Us</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About Area */}
      <div className="about-area py-100">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="about-left">
                <div className="about-img">
                  <div className="row">
                    <div className="col-7">
                      <img className="img-1" src={content.missionImage || "/assets/img/about/01.jpg"} alt="About Sawdagar" />
                    </div>
                    <div className="col-5 align-self-end">
                      <img className="img-2" src="/assets/img/about/02.jpg" alt="About Sawdagar" />
                    </div>
                  </div>
                </div>
                <div className="about-experience">
                  <div className="about-experience-icon">
                    <img src="/assets/img/icon/experience.svg" alt="" />
                  </div>
                  <b>Best Quality <br /> Products</b>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="about-right">
                <div className="site-heading mb-3">
                  <span className="site-title-tagline justify-content-start">
                    <i className="flaticon-drive"></i> {content.missionLabel || "About Sawdagar"}
                  </span>
                  <h2 className="site-title">{content.heroTitle || "Afghanistan's Leading Online Shopping Marketplace"}</h2>
                </div>
                <p>{content.missionParagraphs?.[0] || content.heroDescription || "Sawdagar is Afghanistan's premier e-commerce platform connecting local sellers with millions of customers across the country. Our mission is to make online shopping accessible, reliable, and affordable for everyone."}</p>
                {content.missionParagraphs?.[1] && <p className="mt-3">{content.missionParagraphs[1]}</p>}
                <div className="about-list">
                  <ul>
                    {(content.steps && content.steps.length > 0 ? content.steps : [
                      { title: "Wide range of authentic Afghan & international products" },
                      { title: "Secure payments with multiple payment options" },
                      { title: "Fast delivery across Afghanistan" },
                      { title: "24/7 customer support in Pashto, Dari & English" },
                    ]).slice(0, 4).map((item, i) => (
                      <li key={i}><i className="fas fa-check-double"></i> {item.title}</li>
                    ))}
                  </ul>
                </div>
                <Link href="/search" className="theme-btn mt-4">Explore Products <i className="fas fa-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision, Mission & Core Values */}
      <div className="py-80" style={{ background: "#f8f9fa" }}>
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col-lg-6 mx-auto">
              <div className="site-heading">
                <span className="site-title-tagline"><i className="far fa-lightbulb"></i> What Drives Us</span>
                <h2 className="site-title">Our Vision, Mission & <span>Values</span></h2>
              </div>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body text-center p-4">
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#f0f7ff,#e0efff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <i className="far fa-eye" style={{ fontSize: 28, color: '#E3242B' }}></i>
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Our Vision</h4>
                  <p style={{ color: '#666' }}>{content.vision || "To become the most trusted and widely used e-commerce platform in Afghanistan, empowering every citizen to shop online with confidence."}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body text-center p-4">
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#fff0f0,#ffe0e0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <i className="far fa-bullseye-arrow" style={{ fontSize: 28, color: '#E3242B' }}></i>
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Our Mission</h4>
                  <p style={{ color: '#666' }}>{content.mission || "To bridge the gap between Afghan businesses and consumers through innovative technology, affordable delivery, and exceptional customer service."}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body text-center p-4">
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#f0fff0,#e0ffe0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <i className="far fa-heart" style={{ fontSize: 28, color: '#E3242B' }}></i>
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Core Values</h4>
                  <p style={{ color: '#666' }}>{content.coreValues || "Trust, Innovation, Community, Quality — We put our customers first and support local Afghan businesses to grow and prosper."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sawdagar App Intro */}
      <div className="py-80">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 order-lg-2 mb-4 mb-lg-0">
              <img src="/assets/img/about/01.jpg" alt="Sawdagar App" className="rounded" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 16 }} />
            </div>
            <div className="col-lg-6 order-lg-1">
              <div className="site-heading mb-3">
                <span className="site-title-tagline justify-content-start"><i className="far fa-mobile-alt"></i> Download Our App</span>
                <h2 className="site-title">Shop Anytime, <span>Anywhere</span></h2>
              </div>
              <p>{content.appIntro || "Experience the convenience of shopping from your phone. The Sawdagar mobile app lets you browse thousands of products, track your orders in real-time, and enjoy exclusive app-only deals."}</p>
              <div className="row mt-4">
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="fas fa-check-circle" style={{ color: '#E3242B', fontSize: 18 }}></i>
                    <span>Easy browsing</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="fas fa-check-circle" style={{ color: '#E3242B', fontSize: 18 }}></i>
                    <span>Order tracking</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="fas fa-check-circle" style={{ color: '#E3242B', fontSize: 18 }}></i>
                    <span>Secure payments</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="fas fa-check-circle" style={{ color: '#E3242B', fontSize: 18 }}></i>
                    <span>Exclusive deals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Counter Area */}
      <div className="counter-area pt-50 pb-50">
        <div className="container">
          <div className="row">
            {(content.stats && content.stats.length > 0 ? content.stats : [
              { value: "5,000+", label: "Products Available" },
              { value: "1,200+", label: "Happy Customers" },
              { value: "34", label: "Provinces Served" },
              { value: "500+", label: "Verified Sellers" },
            ]).map((item, i) => (
              <div key={i} className="col-lg-3 col-sm-6">
                <div className="counter-box">
                  <div className="icon" style={{ padding: 12 }}>
                    <img src={`/assets/img/icon/${['sale', 'rate', 'employee', 'award'][i % 4]}.svg`} alt="" />
                  </div>
                  <div className="counter-info">
                    <div className="counter-amount">
                      <span className="counter">{item.value}</span>
                    </div>
                    <h6 className="title">{item.label}</h6>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Area */}
      <div className="feature-area pb-100">
        <div className="container">
          <div className="feature-wrap">
            <div className="row g-0">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon" style={{ padding: 12 }}><img src="/assets/img/icon/delivery-2.svg" alt="" /></div>
                  <div className="feature-content"><h4>Free Delivery</h4><p>Orders Over ؋5,000</p></div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon" style={{ padding: 12 }}><img src="/assets/img/icon/refund.svg" alt="" /></div>
                  <div className="feature-content"><h4>Get Refund</h4><p>Within 30 Days Returns</p></div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon" style={{ padding: 12 }}><img src="/assets/img/icon/payment.svg" alt="" /></div>
                  <div className="feature-content"><h4>Safe Payment</h4><p>100% Secure Payment</p></div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon" style={{ padding: 12 }}><img src="/assets/img/icon/support.svg" alt="" /></div>
                  <div className="feature-content"><h4>24/7 Support</h4><p>Feel Free To Call Us</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
