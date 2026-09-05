"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import siteContentDefaults from "@/data/siteContentDefaults.json";

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [content, setContent] = useState(siteContentDefaults.contact);
  const [loading, setLoading] = useState(false);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    fetch("/api/site-content")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content?.contact) {
          setContent(data.content.contact);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email and message");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/site-content/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send message");
      toast.success(content.successMessage);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const contactCards = content.cards || [];

  return (
    <div className="f2-content-page f2-contact-page">
      {/* Breadcrumb */}
      <div className="site-breadcrumb f2-content-crumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h1 className="breadcrumb-title">Contact Us</h1>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">Contact Us</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Area */}
      <section className="contact-area f2-content-section f2-contact-main">
        <div className="container">
          <div className="contact-wrapper f2-contact-layout">
            <div className="row f2-contact-layout__grid">
              <div className="col-lg-5">
                <div className="contact-content f2-contact-cards">
                  <div className="f2-contact-cards__intro">
                    <span className="f2-content-eyebrow">Contact details</span>
                    <h2>We&apos;re here to help</h2>
                    <p>Use the details below or send us a message. Our team will get back to you as soon as possible.</p>
                  </div>
                  <div className="row f2-contact-cards__grid">
                    <div className="col-md-6">
                      <div className="contact-info f2-contact-card">
                        <div className="contact-info-icon"><i className="fal fa-map-location-dot"></i></div>
                        <div className="contact-info-content">
                          <h5>Office Address</h5>
                          <p>{contactCards[0]?.lines?.[0] || "Kabul, Afghanistan"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="contact-info f2-contact-card">
                        <div className="contact-info-icon"><i className="fal fa-headset"></i></div>
                        <div className="contact-info-content">
                          <h5>Call Us</h5>
                          {(contactCards[1]?.lines || ["+93 700 000 000"]).map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="contact-info f2-contact-card">
                        <div className="contact-info-icon"><i className="fal fa-envelopes"></i></div>
                        <div className="contact-info-content">
                          <h5>Email Us</h5>
                          {(contactCards[2]?.lines || ["info@sawdagar.af"]).map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="contact-info f2-contact-card">
                        <div className="contact-info-icon"><i className="fal fa-alarm-clock"></i></div>
                        <div className="contact-info-content">
                          <h5>{content.businessHoursTitle || "Open Time"}</h5>
                          {(content.businessHours || []).slice(0, 2).map((item, i) => (
                            <p key={i}>{item.day} - {item.time}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-7">
                <div className="contact-form f2-contact-form-card">
                  <div className="contact-form-header">
                    <span className="f2-content-eyebrow">Send a message</span>
                    <h2>{content.formTitle || "Get In Touch"}</h2>
                    <p>{content.heroDescription || "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}</p>
                  </div>
                  <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={loading}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group f2-content-field">
                          <label htmlFor="contact-name">Your Name</label>
                          <input id="contact-name" type="text" placeholder="Your Name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group f2-content-field">
                          <label htmlFor="contact-email">Your Email</label>
                          <input id="contact-email" type="email" placeholder="Your Email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" required />
                        </div>
                      </div>
                    </div>
                    <div className="form-group f2-content-field">
                      <label htmlFor="contact-subject">Your Subject</label>
                      <input id="contact-subject" type="text" placeholder="Your Subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} required />
                    </div>
                    <div className="form-group f2-content-field">
                      <label htmlFor="contact-message">Your Message</label>
                      <textarea id="contact-message" cols="30" rows="5" placeholder="Write Your Message" value={form.message} onChange={(e) => set("message", e.target.value)} required></textarea>
                    </div>
                    <button type="submit" className="f2-content-button" disabled={loading}>
                      {loading ? "Sending..." : "Send Message"} <i className="far fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Area */}
      <section className="newsletter-area f2-contact-newsletter">
        <div className="container">
          <div className="newsletter-wrap f2-contact-newsletter__wrap">
            <div className="row">
              <div className="col-lg-6 mx-auto">
                <div className="newsletter-content">
                  <span className="f2-content-eyebrow">Stay updated</span>
                  <h3>Get <span>20%</span> Off Discount Coupon</h3>
                  <p>By Subscribe Our Newsletter</p>
                  <div className="subscribe-form f2-contact-newsletter__form">
                    <form onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed!"); }}>
                      <label className="f2-sr-only" htmlFor="contact-newsletter-email">Your Email Address</label>
                      <input id="contact-newsletter-email" type="email" placeholder="Your Email Address" />
                      <button className="f2-content-button" type="submit">Subscribe <i className="far fa-paper-plane"></i></button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
