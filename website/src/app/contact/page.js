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
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">Contact Us</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">Contact Us</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Area */}
      <div className="contact-area pt-100 pb-80">
        <div className="container">
          <div className="contact-wrapper">
            <div className="row">
              <div className="col-lg-5">
                <div className="contact-content">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="contact-info">
                        <div className="contact-info-icon"><i className="fal fa-map-location-dot"></i></div>
                        <div className="contact-info-content">
                          <h5>Office Address</h5>
                          <p>{contactCards[0]?.lines?.[0] || "Kabul, Afghanistan"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="contact-info">
                        <div className="contact-info-icon"><i className="fal fa-headset"></i></div>
                        <div className="contact-info-content">
                          <h5>Call Us</h5>
                          {(contactCards[1]?.lines || ["+93 700 000 000"]).map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="contact-info">
                        <div className="contact-info-icon"><i className="fal fa-envelopes"></i></div>
                        <div className="contact-info-content">
                          <h5>Email Us</h5>
                          {(contactCards[2]?.lines || ["info@sawdagar.af"]).map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="contact-info">
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
                <div className="contact-form">
                  <div className="contact-form-header">
                    <h2>{content.formTitle || "Get In Touch"}</h2>
                    <p>{content.heroDescription || "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}</p>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <input type="text" className="form-control" placeholder="Your Name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <input type="email" className="form-control" placeholder="Your Email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <input type="text" className="form-control" placeholder="Your Subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <textarea cols="30" rows="4" className="form-control" placeholder="Write Your Message" value={form.message} onChange={(e) => set("message", e.target.value)} required></textarea>
                    </div>
                    <button type="submit" className="theme-btn" disabled={loading}>
                      {loading ? "Sending..." : "Send Message"} <i className="far fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Area */}
      <div className="newsletter-area pb-100">
        <div className="container">
          <div className="newsletter-wrap">
            <div className="row">
              <div className="col-lg-6 mx-auto">
                <div className="newsletter-content">
                  <h3>Get <span>20%</span> Off Discount Coupon</h3>
                  <p>By Subscribe Our Newsletter</p>
                  <div className="subscribe-form">
                    <form onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed!"); }}>
                      <input type="email" className="form-control" placeholder="Your Email Address" />
                      <button className="theme-btn" type="submit">Subscribe <i className="far fa-paper-plane"></i></button>
                    </form>
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
