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
                      <img className="img-1" src={content.missionImage || "/assets/img/about/01.jpg"} alt="About" />
                    </div>
                    <div className="col-5 align-self-end">
                      <img className="img-2" src="/assets/img/about/02.jpg" alt="About" />
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
                    <i className="flaticon-drive"></i> {content.missionLabel || "About Us"}
                  </span>
                  <h2 className="site-title">{content.heroTitle || "World Largest Online Shopping Marketplace"}</h2>
                </div>
                <p>{content.missionParagraphs?.[0] || content.heroDescription || ""}</p>
                {content.missionParagraphs?.[1] && <p className="mt-3">{content.missionParagraphs[1]}</p>}
                <div className="about-list">
                  <ul>
                    {(content.steps || []).slice(0, 4).map((item, i) => (
                      <li key={i}><i className="fas fa-check-double"></i> {item.title}</li>
                    ))}
                  </ul>
                </div>
                <Link href="/contact" className="theme-btn mt-4">Discover More <i className="fas fa-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Counter Area */}
      <div className="counter-area pt-50 pb-50">
        <div className="container">
          <div className="row">
            {(content.stats || []).map((item, i) => (
              <div key={i} className="col-lg-3 col-sm-6">
                <div className="counter-box">
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
      </div>

      {/* Feature Area */}
      <div className="feature-area pb-100">
        <div className="container">
          <div className="feature-wrap">
            <div className="row g-0">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="feature-item">
                  <div className="feature-icon"><img src="/assets/img/icon/delivery-2.svg" alt="" /></div>
                  <div className="feature-content"><h4>Free Delivery</h4><p>Orders Over $120</p></div>
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
      </div>
    </>
  );
}
