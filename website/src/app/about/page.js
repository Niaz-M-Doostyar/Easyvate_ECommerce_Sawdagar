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
    <div className="f2-content-page f2-about-page">
      {/* Breadcrumb */}
      <div className="site-breadcrumb f2-content-crumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h1 className="breadcrumb-title">About Us</h1>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">About Us</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About Area */}
      <section className="about-area f2-content-section f2-about-intro">
        <div className="container">
          <div className="row align-items-center f2-about-intro__grid">
            <div className="col-lg-6">
              <div className="about-left f2-about-collage">
                <div className="about-img f2-about-collage__images">
                  <div className="row">
                    <div className="col-7">
                      <img className="img-1" src={content.missionImage || "/assets/img/about/01.jpg"} alt="About Sawdagar" />
                    </div>
                    <div className="col-5 align-self-end">
                      <img className="img-2" src="/assets/img/about/02.jpg" alt="About Sawdagar" />
                    </div>
                  </div>
                </div>
                <div className="about-experience f2-about-collage__badge">
                  <div className="about-experience-icon">
                    <img src="/assets/img/icon/experience.svg" alt="" />
                  </div>
                  <b>Best Quality <br /> Products</b>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="about-right f2-about-copy">
                <div className="site-heading f2-content-heading">
                  <span className="site-title-tagline f2-content-eyebrow">
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
                <Link href="/search" className="f2-content-button">Explore Products <i className="fas fa-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision, Mission & Core Values */}
      <section className="f2-content-section f2-content-section--tinted f2-about-pillars">
        <div className="container">
          <div className="row text-center f2-content-section-head">
            <div className="col-lg-6 mx-auto">
              <div className="site-heading f2-content-heading f2-content-heading--center">
                <span className="site-title-tagline f2-content-eyebrow"><i className="far fa-lightbulb"></i> What Drives Us</span>
                <h2 className="site-title">Our Vision, Mission & <span>Values</span></h2>
              </div>
            </div>
          </div>
          <div className="row g-4 f2-about-pillars__grid">
            <div className="col-lg-4">
              <div className="card h-100 f2-about-pillar">
                <div className="card-body">
                  <div className="f2-about-pillar__icon">
                    <i className="far fa-eye"></i>
                  </div>
                  <h3>Our Vision</h3>
                  <p>{content.vision || "To become the most trusted and widely used e-commerce platform in Afghanistan, empowering every citizen to shop online with confidence."}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card h-100 f2-about-pillar">
                <div className="card-body">
                  <div className="f2-about-pillar__icon">
                    <i className="far fa-bullseye-arrow"></i>
                  </div>
                  <h3>Our Mission</h3>
                  <p>{content.mission || "To bridge the gap between Afghan businesses and consumers through innovative technology, affordable delivery, and exceptional customer service."}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card h-100 f2-about-pillar">
                <div className="card-body">
                  <div className="f2-about-pillar__icon">
                    <i className="far fa-heart"></i>
                  </div>
                  <h3>Core Values</h3>
                  <p>{content.coreValues || "Trust, Innovation, Community, Quality — We put our customers first and support local Afghan businesses to grow and prosper."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sawdagar App Intro */}
      <section className="f2-content-section f2-about-app">
        <div className="container">
          <div className="row align-items-center f2-about-app__grid">
            <div className="col-lg-6 order-lg-2 mb-4 mb-lg-0">
              <div className="f2-about-app__media">
                <img src="/assets/img/about/01.jpg" alt="Sawdagar App" />
              </div>
            </div>
            <div className="col-lg-6 order-lg-1">
              <div className="site-heading f2-content-heading">
                <span className="site-title-tagline f2-content-eyebrow"><i className="far fa-mobile-alt"></i> Download Our App</span>
                <h2 className="site-title">Shop Anytime, <span>Anywhere</span></h2>
              </div>
              <p>{content.appIntro || "Experience the convenience of shopping from your phone. The Sawdagar mobile app lets you browse thousands of products, track your orders in real-time, and enjoy exclusive app-only deals."}</p>
              <div className="row f2-about-app__features">
                <div className="col-6">
                  <div className="f2-about-app__feature">
                    <i className="fas fa-check-circle"></i>
                    <span>Easy browsing</span>
                  </div>
                  <div className="f2-about-app__feature">
                    <i className="fas fa-check-circle"></i>
                    <span>Order tracking</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="f2-about-app__feature">
                    <i className="fas fa-check-circle"></i>
                    <span>Secure payments</span>
                  </div>
                  <div className="f2-about-app__feature">
                    <i className="fas fa-check-circle"></i>
                    <span>Exclusive deals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Counter Area */}
      <section className="counter-area f2-about-stats">
        <div className="container">
          <div className="row f2-about-stats__grid">
            {(content.stats || []).map((item, i) => (
              <div key={i} className="col-lg-3 col-sm-6">
                <div className="counter-box f2-about-stat">
                  <div className="icon">
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
      </section>

      {/* Feature Area */}
      <section className="feature-area f2-content-section f2-about-benefits">
        <div className="container">
          <div className="feature-wrap f2-about-benefits__wrap">
            <div className="row g-0">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon"><img src="/assets/img/icon/delivery-2.svg" alt="" /></div>
                  <div className="feature-content"><h4>Free Delivery</h4><p>Orders Over ؋5,000</p></div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon"><img src="/assets/img/icon/refund.svg" alt="" /></div>
                  <div className="feature-content"><h4>Get Refund</h4><p>Within 30 Days Returns</p></div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon"><img src="/assets/img/icon/payment.svg" alt="" /></div>
                  <div className="feature-content"><h4>Safe Payment</h4><p>100% Secure Payment</p></div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon"><img src="/assets/img/icon/support.svg" alt="" /></div>
                  <div className="feature-content"><h4>24/7 Support</h4><p>Feel Free To Call Us</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
