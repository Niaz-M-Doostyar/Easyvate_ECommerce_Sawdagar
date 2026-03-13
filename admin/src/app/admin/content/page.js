"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import ImageUploader from "@/components/ImageUploader";
import siteContentDefaults from "@/data/siteContentDefaults.json";

const cloneDefaults = () => JSON.parse(JSON.stringify(siteContentDefaults));

function SectionTitle({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      {description ? <p className="text-sm text-body mt-1">{description}</p> : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-navy">{label}</span>
      {children}
    </label>
  );
}

function ArrayManager({ items, onUpdate, renderItem, addItem, addLabel = "Add Item" }) {
  const handleRemove = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onUpdate(updated);
  };
  const handleAdd = () => {
    onUpdate([...items, addItem()]);
  };
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 p-4 space-y-3 relative">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-navy">Item {index + 1}</h4>
            {items.length > 1 && (
              <button type="button" onClick={() => handleRemove(index)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
            )}
          </div>
          {renderItem(item, index)}
        </div>
      ))}
      <button type="button" onClick={handleAdd} className="btn btn-sm btn-outline">+ {addLabel}</button>
    </div>
  );
}

export default function AdminContentPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [content, setContent] = useState(cloneDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("home");

  useEffect(() => {
    fetch("/api/admin/site-content", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
        }
      })
      .catch(() => toast.error("Failed to load website content"))
      .finally(() => setLoading(false));
  }, [toast]);

  const updateContent = (updater) => {
    setContent((prev) => {
      const next = structuredClone(prev);
      updater(next);
      return next;
    });
  };

  const setValue = (path, value) => {
    updateContent((draft) => {
      let cursor = draft;
      for (let i = 0; i < path.length - 1; i += 1) {
        if (cursor[path[i]] === undefined) cursor[path[i]] = {};
        cursor = cursor[path[i]];
      }
      cursor[path[path.length - 1]] = value;
    });
  };

  const tabs = useMemo(
    () => [
      { key: "header", label: "Header" },
      { key: "home", label: "Homepage" },
      { key: "about", label: "About" },
      { key: "contact", label: "Contact" },
      { key: "footer", label: "Footer" },
    ],
    []
  );

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save website content");
      }
      setContent(data.content || content);
      toast.success("Website content updated");
    } catch (error) {
      toast.error(error.message || "Failed to save website content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card p-8 text-center text-body">Loading website content...</div>;
  }

  // Safe getters
  const h = content.header || siteContentDefaults.header;
  const f = content.footer || siteContentDefaults.footer;
  const home = content.home || siteContentDefaults.home;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Website Content</h1>
          <p className="text-body mt-1">Control all website sections from one place. Everything here is dynamic.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn btn-primary disabled:opacity-60">
          {saving ? "Saving..." : t("save")}
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`btn btn-sm ${tab === item.key ? "btn-primary" : "btn-outline"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ HEADER TAB ═══════════ */}
      {tab === "header" && (
        <div className="space-y-6">
          <div className="card card-p">
            <SectionTitle title="Header Top Bar" description="Email, phone, message shown in the top bar of the website." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Email">
                <input className="input" value={h.email} onChange={(e) => setValue(["header", "email"], e.target.value)} />
              </Field>
              <Field label="Phone">
                <input className="input" value={h.phone} onChange={(e) => setValue(["header", "phone"], e.target.value)} />
              </Field>
              <Field label="Top Bar Message">
                <input className="input" value={h.topBarMessage} onChange={(e) => setValue(["header", "topBarMessage"], e.target.value)} />
              </Field>
              <Field label="Logo">
                <ImageUploader images={h.logo ? [h.logo] : []} onChange={(urls) => setValue(["header", "logo"], urls[0] || "")} max={1} label="" />
              </Field>
            </div>
          </div>
          <div className="card card-p">
            <SectionTitle title="Header Social Links" description="Social media links displayed in the header top bar." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {["facebook", "twitter", "instagram", "youtube"].map((key) => (
                <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                  <input className="input" value={(h.socialLinks || {})[key] || ""} onChange={(e) => setValue(["header", "socialLinks", key], e.target.value)} />
                </Field>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ HOMEPAGE TAB ═══════════ */}
      {tab === "home" && (
        <div className="space-y-6">
          {/* ── Hero Section ── */}
          <div className="card card-p">
            <SectionTitle title="Hero Section" description="Controls hero buttons, general settings." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Badge">
                <input className="input" value={home.hero.badge} onChange={(e) => setValue(["home", "hero", "badge"], e.target.value)} />
              </Field>
              <Field label="Primary Button Label">
                <input className="input" value={home.hero.primaryButtonLabel} onChange={(e) => setValue(["home", "hero", "primaryButtonLabel"], e.target.value)} />
              </Field>
              <Field label="Primary Button Link">
                <input className="input" value={home.hero.primaryButtonHref} onChange={(e) => setValue(["home", "hero", "primaryButtonHref"], e.target.value)} />
              </Field>
              <Field label="Secondary Button Label">
                <input className="input" value={home.hero.secondaryButtonLabel} onChange={(e) => setValue(["home", "hero", "secondaryButtonLabel"], e.target.value)} />
              </Field>
              <Field label="Secondary Button Link">
                <input className="input" value={home.hero.secondaryButtonHref} onChange={(e) => setValue(["home", "hero", "secondaryButtonHref"], e.target.value)} />
              </Field>
            </div>
            <Field label="Description">
              <textarea className="input min-h-32" value={home.hero.description} onChange={(e) => setValue(["home", "hero", "description"], e.target.value)} />
            </Field>
          </div>

          {/* ── Hero Slides ── */}
          <div className="card card-p">
            <SectionTitle title="Hero Slides" description="Each slide shown in the hero carousel. Add/remove slides as needed." />
            <ArrayManager
              items={home.hero.slides || siteContentDefaults.home.hero.slides}
              onUpdate={(slides) => setValue(["home", "hero", "slides"], slides)}
              addItem={() => ({ subtitle: "Start From ؋999", title: "New Slide Title", description: "", image: "", priceLabel: "Price", priceValue: "؋2,500" })}
              addLabel="Add Slide"
              renderItem={(slide, idx) => (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label="Subtitle">
                    <input className="input" value={slide.subtitle} onChange={(e) => { const s = [...(home.hero.slides || [])]; s[idx] = { ...s[idx], subtitle: e.target.value }; setValue(["home", "hero", "slides"], s); }} />
                  </Field>
                  <Field label="Title">
                    <input className="input" value={slide.title} onChange={(e) => { const s = [...(home.hero.slides || [])]; s[idx] = { ...s[idx], title: e.target.value }; setValue(["home", "hero", "slides"], s); }} />
                  </Field>
                  <Field label="Price Label">
                    <input className="input" value={slide.priceLabel} onChange={(e) => { const s = [...(home.hero.slides || [])]; s[idx] = { ...s[idx], priceLabel: e.target.value }; setValue(["home", "hero", "slides"], s); }} />
                  </Field>
                  <Field label="Price Value">
                    <input className="input" value={slide.priceValue} onChange={(e) => { const s = [...(home.hero.slides || [])]; s[idx] = { ...s[idx], priceValue: e.target.value }; setValue(["home", "hero", "slides"], s); }} />
                  </Field>
                  <Field label="Image">
                    <ImageUploader images={slide.image ? [slide.image] : []} onChange={(urls) => { const s = [...(home.hero.slides || [])]; s[idx] = { ...s[idx], image: urls[0] || "" }; setValue(["home", "hero", "slides"], s); }} max={1} label="" />
                  </Field>
                  <Field label="Description">
                    <textarea className="input min-h-20" value={slide.description} onChange={(e) => { const s = [...(home.hero.slides || [])]; s[idx] = { ...s[idx], description: e.target.value }; setValue(["home", "hero", "slides"], s); }} />
                  </Field>
                </div>
              )}
            />
          </div>

          {/* ── Promo Banners ── */}
          <div className="card card-p">
            <SectionTitle title="Promo Banners" description="Three promo cards below the category section." />
            <div className="space-y-5">
              {(home.promoBanners || []).map((banner, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4 space-y-4">
                  <h3 className="font-semibold text-navy">Banner {index + 1}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Field label="Label">
                      <input className="input" value={banner.label} onChange={(e) => setValue(["home", "promoBanners", index, "label"], e.target.value)} />
                    </Field>
                    <Field label="Button Label">
                      <input className="input" value={banner.buttonLabel} onChange={(e) => setValue(["home", "promoBanners", index, "buttonLabel"], e.target.value)} />
                    </Field>
                    <Field label="Button Link">
                      <input className="input" value={banner.buttonHref} onChange={(e) => setValue(["home", "promoBanners", index, "buttonHref"], e.target.value)} />
                    </Field>
                    <Field label="Image">
                      <ImageUploader images={banner.image ? [banner.image] : []} onChange={(urls) => setValue(["home", "promoBanners", index, "image"], urls[0] || "")} max={1} label="" />
                    </Field>
                  </div>
                  <Field label="Title (use \\n for line break)">
                    <textarea className="input min-h-24" value={banner.title} onChange={(e) => setValue(["home", "promoBanners", index, "title"], e.target.value)} />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          {/* ── Features Bar ── */}
          <div className="card card-p">
            <SectionTitle title="Features Bar" description="4 feature icons below the promo banners." />
            <div className="space-y-4">
              {(home.features || siteContentDefaults.home.features).map((item, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label={`Feature ${index + 1} Title`}>
                    <input className="input" value={item.title} onChange={(e) => setValue(["home", "features", index, "title"], e.target.value)} />
                  </Field>
                  <Field label={`Feature ${index + 1} Description`}>
                    <input className="input" value={item.desc} onChange={(e) => setValue(["home", "features", index, "desc"], e.target.value)} />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          {/* ── Product Banner ── */}
          <div className="card card-p">
            <SectionTitle title="Product Side Banner" description="Banner image shown beside the Popular Items tabs." />
            <Field label="Banner Image">
              <ImageUploader images={home.productBannerImage ? [home.productBannerImage] : []} onChange={(urls) => setValue(["home", "productBannerImage"], urls[0] || "")} max={1} label="" />
            </Field>
          </div>

          {/* ── Brands ── */}
          <div className="card card-p">
            <SectionTitle title="Brands Section" description="Brand logos displayed in a slider." />
            <Field label="Section Title">
              <input className="input" value={(home.brands || {}).title || ""} onChange={(e) => setValue(["home", "brands", "title"], e.target.value)} />
            </Field>
            <div className="mt-4">
              <ArrayManager
                items={home.brandItems || siteContentDefaults.home.brandItems}
                onUpdate={(items) => setValue(["home", "brandItems"], items)}
                addItem={() => ({ name: "New Brand", image: "" })}
                addLabel="Add Brand"
                renderItem={(brand, idx) => (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Field label="Brand Name">
                      <input className="input" value={brand.name} onChange={(e) => { const b = [...(home.brandItems || [])]; b[idx] = { ...b[idx], name: e.target.value }; setValue(["home", "brandItems"], b); }} />
                    </Field>
                    <Field label="Logo Image">
                      <ImageUploader images={brand.image ? [brand.image] : []} onChange={(urls) => { const b = [...(home.brandItems || [])]; b[idx] = { ...b[idx], image: urls[0] || "" }; setValue(["home", "brandItems"], b); }} max={1} label="" />
                    </Field>
                  </div>
                )}
              />
            </div>
          </div>

          {/* ── Big Banner ── */}
          <div className="card card-p">
            <SectionTitle title="Big Banner" description="Full-width banner between product sections." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Subtitle">
                <input className="input" value={(home.bigBanner || {}).subtitle || ""} onChange={(e) => setValue(["home", "bigBanner", "subtitle"], e.target.value)} />
              </Field>
              <Field label="Title">
                <input className="input" value={(home.bigBanner || {}).title || ""} onChange={(e) => setValue(["home", "bigBanner", "title"], e.target.value)} />
              </Field>
              <Field label="Description">
                <input className="input" value={(home.bigBanner || {}).description || ""} onChange={(e) => setValue(["home", "bigBanner", "description"], e.target.value)} />
              </Field>
              <Field label="Button Label">
                <input className="input" value={(home.bigBanner || {}).buttonLabel || ""} onChange={(e) => setValue(["home", "bigBanner", "buttonLabel"], e.target.value)} />
              </Field>
              <Field label="Button Link">
                <input className="input" value={(home.bigBanner || {}).buttonHref || ""} onChange={(e) => setValue(["home", "bigBanner", "buttonHref"], e.target.value)} />
              </Field>
              <Field label="Background Image">
                <ImageUploader images={(home.bigBanner || {}).image ? [(home.bigBanner || {}).image] : []} onChange={(urls) => setValue(["home", "bigBanner", "image"], urls[0] || "")} max={1} label="" />
              </Field>
            </div>
          </div>

          {/* ── Video Section ── */}
          <div className="card card-p">
            <SectionTitle title="Video Section" description="Background image and YouTube video for the play-button area." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Background Image">
                <ImageUploader images={(home.video || {}).backgroundImage ? [(home.video || {}).backgroundImage] : []} onChange={(urls) => setValue(["home", "video", "backgroundImage"], urls[0] || "")} max={1} label="" />
              </Field>
              <Field label="Video URL (YouTube)">
                <input className="input" value={(home.video || {}).videoUrl || ""} onChange={(e) => setValue(["home", "video", "videoUrl"], e.target.value)} />
              </Field>
            </div>
          </div>

          {/* ── Deal of the Week ── */}
          <div className="card card-p">
            <SectionTitle title="Deal of the Week" description="Weekly featured deal with countdown timer." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Badge">
                <input className="input" value={(home.dealOfWeek || {}).badge || ""} onChange={(e) => setValue(["home", "dealOfWeek", "badge"], e.target.value)} />
              </Field>
              <Field label="Title">
                <input className="input" value={(home.dealOfWeek || {}).title || ""} onChange={(e) => setValue(["home", "dealOfWeek", "title"], e.target.value)} />
              </Field>
              <Field label="Button Label">
                <input className="input" value={(home.dealOfWeek || {}).buttonLabel || ""} onChange={(e) => setValue(["home", "dealOfWeek", "buttonLabel"], e.target.value)} />
              </Field>
              <Field label="Button Link">
                <input className="input" value={(home.dealOfWeek || {}).buttonHref || ""} onChange={(e) => setValue(["home", "dealOfWeek", "buttonHref"], e.target.value)} />
              </Field>
              <Field label="Image">
                <ImageUploader images={(home.dealOfWeek || {}).image ? [(home.dealOfWeek || {}).image] : []} onChange={(urls) => setValue(["home", "dealOfWeek", "image"], urls[0] || "")} max={1} label="" />
              </Field>
              <Field label="Discount %">
                <input className="input" value={(home.dealOfWeek || {}).discountPercent || ""} onChange={(e) => setValue(["home", "dealOfWeek", "discountPercent"], e.target.value)} />
              </Field>
              <Field label="Countdown Date (YYYY/MM/DD)">
                <input className="input" value={(home.dealOfWeek || {}).countdownDate || ""} onChange={(e) => setValue(["home", "dealOfWeek", "countdownDate"], e.target.value)} />
              </Field>
            </div>
            <Field label="Description">
              <textarea className="input min-h-24" value={(home.dealOfWeek || {}).description || ""} onChange={(e) => setValue(["home", "dealOfWeek", "description"], e.target.value)} />
            </Field>
          </div>

          {/* ── Gallery ── */}
          <div className="card card-p">
            <SectionTitle title="Gallery Section" description="Photo gallery section with images." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <Field label="Tagline">
                <input className="input" value={(home.gallery || {}).tagline || ""} onChange={(e) => setValue(["home", "gallery", "tagline"], e.target.value)} />
              </Field>
              <Field label="Title">
                <input className="input" value={(home.gallery || {}).title || ""} onChange={(e) => setValue(["home", "gallery", "title"], e.target.value)} />
              </Field>
            </div>
            <ArrayManager
              items={home.galleryImages || siteContentDefaults.home.galleryImages}
              onUpdate={(items) => setValue(["home", "galleryImages"], items)}
              addItem={() => ({ image: "", size: "col-md-4 col-lg-3" })}
              addLabel="Add Gallery Image"
              renderItem={(gi, idx) => (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label="Image">
                    <ImageUploader images={gi.image ? [gi.image] : []} onChange={(urls) => { const g = [...(home.galleryImages || [])]; g[idx] = { ...g[idx], image: urls[0] || "" }; setValue(["home", "galleryImages"], g); }} max={1} label="" />
                  </Field>
                  <Field label="CSS Size Class">
                    <select className="input" value={gi.size} onChange={(e) => { const g = [...(home.galleryImages || [])]; g[idx] = { ...g[idx], size: e.target.value }; setValue(["home", "galleryImages"], g); }}>
                      <option value="col-md-4 col-lg-3">Small (25%)</option>
                      <option value="col-md-8 col-lg-6">Large (50%)</option>
                      <option value="col-md-12 col-lg-6">Wide (50%)</option>
                    </select>
                  </Field>
                </div>
              )}
            />
          </div>

          {/* ── Testimonials ── */}
          <div className="card card-p">
            <SectionTitle title="Testimonials" description="Client reviews shown in a carousel slider." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <Field label="Tagline">
                <input className="input" value={(home.testimonials || {}).tagline || ""} onChange={(e) => setValue(["home", "testimonials", "tagline"], e.target.value)} />
              </Field>
              <Field label="Title">
                <input className="input" value={(home.testimonials || {}).title || ""} onChange={(e) => setValue(["home", "testimonials", "title"], e.target.value)} />
              </Field>
            </div>
            <ArrayManager
              items={home.testimonialItems || siteContentDefaults.home.testimonialItems}
              onUpdate={(items) => setValue(["home", "testimonialItems"], items)}
              addItem={() => ({ name: "New Customer", role: "Customer", image: "", text: "Enter review text here.", rating: 5 })}
              addLabel="Add Testimonial"
              renderItem={(ti, idx) => (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label="Name">
                    <input className="input" value={ti.name} onChange={(e) => { const t = [...(home.testimonialItems || [])]; t[idx] = { ...t[idx], name: e.target.value }; setValue(["home", "testimonialItems"], t); }} />
                  </Field>
                  <Field label="Role">
                    <input className="input" value={ti.role} onChange={(e) => { const t = [...(home.testimonialItems || [])]; t[idx] = { ...t[idx], role: e.target.value }; setValue(["home", "testimonialItems"], t); }} />
                  </Field>
                  <Field label="Rating (1-5)">
                    <input className="input" type="number" min="1" max="5" value={ti.rating} onChange={(e) => { const t = [...(home.testimonialItems || [])]; t[idx] = { ...t[idx], rating: parseInt(e.target.value) || 5 }; setValue(["home", "testimonialItems"], t); }} />
                  </Field>
                  <Field label="Photo">
                    <ImageUploader images={ti.image ? [ti.image] : []} onChange={(urls) => { const t = [...(home.testimonialItems || [])]; t[idx] = { ...t[idx], image: urls[0] || "" }; setValue(["home", "testimonialItems"], t); }} max={1} label="" />
                  </Field>
                  <div className="lg:col-span-2">
                    <Field label="Review Text">
                      <textarea className="input min-h-20" value={ti.text} onChange={(e) => { const t = [...(home.testimonialItems || [])]; t[idx] = { ...t[idx], text: e.target.value }; setValue(["home", "testimonialItems"], t); }} />
                    </Field>
                  </div>
                </div>
              )}
            />
          </div>

          {/* ── Blog ── */}
          <div className="card card-p">
            <SectionTitle title="Blog Section" description="Latest news & blog posts on the homepage." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <Field label="Tagline">
                <input className="input" value={(home.blog || {}).tagline || ""} onChange={(e) => setValue(["home", "blog", "tagline"], e.target.value)} />
              </Field>
              <Field label="Title">
                <input className="input" value={(home.blog || {}).title || ""} onChange={(e) => setValue(["home", "blog", "title"], e.target.value)} />
              </Field>
            </div>
            <ArrayManager
              items={home.blogItems || siteContentDefaults.home.blogItems}
              onUpdate={(items) => setValue(["home", "blogItems"], items)}
              addItem={() => ({ image: "", date: "Jan 1, 2025", author: "Admin", comments: "0", title: "New Blog Post Title", excerpt: "Blog post description." })}
              addLabel="Add Blog Post"
              renderItem={(bi, idx) => (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label="Title">
                    <input className="input" value={bi.title} onChange={(e) => { const b = [...(home.blogItems || [])]; b[idx] = { ...b[idx], title: e.target.value }; setValue(["home", "blogItems"], b); }} />
                  </Field>
                  <Field label="Date">
                    <input className="input" value={bi.date} onChange={(e) => { const b = [...(home.blogItems || [])]; b[idx] = { ...b[idx], date: e.target.value }; setValue(["home", "blogItems"], b); }} />
                  </Field>
                  <Field label="Author">
                    <input className="input" value={bi.author} onChange={(e) => { const b = [...(home.blogItems || [])]; b[idx] = { ...b[idx], author: e.target.value }; setValue(["home", "blogItems"], b); }} />
                  </Field>
                  <Field label="Comments Count">
                    <input className="input" value={bi.comments} onChange={(e) => { const b = [...(home.blogItems || [])]; b[idx] = { ...b[idx], comments: e.target.value }; setValue(["home", "blogItems"], b); }} />
                  </Field>
                  <Field label="Image">
                    <ImageUploader images={bi.image ? [bi.image] : []} onChange={(urls) => { const b = [...(home.blogItems || [])]; b[idx] = { ...b[idx], image: urls[0] || "" }; setValue(["home", "blogItems"], b); }} max={1} label="" />
                  </Field>
                  <Field label="Excerpt">
                    <textarea className="input min-h-20" value={bi.excerpt} onChange={(e) => { const b = [...(home.blogItems || [])]; b[idx] = { ...b[idx], excerpt: e.target.value }; setValue(["home", "blogItems"], b); }} />
                  </Field>
                </div>
              )}
            />
          </div>

          {/* ── Newsletter ── */}
          <div className="card card-p">
            <SectionTitle title="Newsletter" description="Subscribe banner near the page footer." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Title">
                <input className="input" value={(home.newsletter || {}).title || ""} onChange={(e) => setValue(["home", "newsletter", "title"], e.target.value)} />
              </Field>
              <Field label="Description">
                <input className="input" value={(home.newsletter || {}).description || ""} onChange={(e) => setValue(["home", "newsletter", "description"], e.target.value)} />
              </Field>
              <Field label="Button Label">
                <input className="input" value={(home.newsletter || {}).buttonLabel || ""} onChange={(e) => setValue(["home", "newsletter", "buttonLabel"], e.target.value)} />
              </Field>
            </div>
          </div>

          {/* ── Instagram ── */}
          <div className="card card-p">
            <SectionTitle title="Instagram Section" description="Instagram feed at the bottom of the page." />
            <Field label="Handle / Title">
              <input className="input" value={(home.instagram || {}).title || ""} onChange={(e) => setValue(["home", "instagram", "title"], e.target.value)} />
            </Field>
            <div className="mt-4">
              <ArrayManager
                items={home.instagramItems || siteContentDefaults.home.instagramItems}
                onUpdate={(items) => setValue(["home", "instagramItems"], items)}
                addItem={() => ({ image: "" })}
                addLabel="Add Instagram Image"
                renderItem={(ii, idx) => (
                  <Field label="Image">
                    <ImageUploader images={ii.image ? [ii.image] : []} onChange={(urls) => { const ig = [...(home.instagramItems || [])]; ig[idx] = { ...ig[idx], image: urls[0] || "" }; setValue(["home", "instagramItems"], ig); }} max={1} label="" />
                  </Field>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ABOUT TAB ═══════════ */}
      {tab === "about" && (
        <div className="space-y-6">
          <div className="card card-p space-y-4">
            <SectionTitle title="About Page" description="Hero, mission, and call-to-action text." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Hero Title">
                <input className="input" value={content.about.heroTitle} onChange={(e) => setValue(["about", "heroTitle"], e.target.value)} />
              </Field>
              <Field label="Mission Label">
                <input className="input" value={content.about.missionLabel} onChange={(e) => setValue(["about", "missionLabel"], e.target.value)} />
              </Field>
              <Field label="Mission Title">
                <input className="input" value={content.about.missionTitle} onChange={(e) => setValue(["about", "missionTitle"], e.target.value)} />
              </Field>
              <Field label="Mission Image">
                <ImageUploader images={content.about.missionImage ? [content.about.missionImage] : []} onChange={(urls) => setValue(["about", "missionImage"], urls[0] || "")} max={1} label="" />
              </Field>
              <Field label="CTA Title">
                <input className="input" value={content.about.ctaTitle} onChange={(e) => setValue(["about", "ctaTitle"], e.target.value)} />
              </Field>
              <Field label="CTA Description">
                <input className="input" value={content.about.ctaDescription} onChange={(e) => setValue(["about", "ctaDescription"], e.target.value)} />
              </Field>
              <Field label="Primary Button Label">
                <input className="input" value={content.about.primaryButtonLabel} onChange={(e) => setValue(["about", "primaryButtonLabel"], e.target.value)} />
              </Field>
              <Field label="Primary Button Link">
                <input className="input" value={content.about.primaryButtonHref} onChange={(e) => setValue(["about", "primaryButtonHref"], e.target.value)} />
              </Field>
              <Field label="Secondary Button Label">
                <input className="input" value={content.about.secondaryButtonLabel} onChange={(e) => setValue(["about", "secondaryButtonLabel"], e.target.value)} />
              </Field>
              <Field label="Secondary Button Link">
                <input className="input" value={content.about.secondaryButtonHref} onChange={(e) => setValue(["about", "secondaryButtonHref"], e.target.value)} />
              </Field>
            </div>
            <Field label="Hero Description">
              <textarea className="input min-h-24" value={content.about.heroDescription} onChange={(e) => setValue(["about", "heroDescription"], e.target.value)} />
            </Field>
            <Field label="Mission Paragraph 1">
              <textarea className="input min-h-24" value={content.about.missionParagraphs[0]} onChange={(e) => setValue(["about", "missionParagraphs"], [e.target.value, content.about.missionParagraphs[1]])} />
            </Field>
            <Field label="Mission Paragraph 2">
              <textarea className="input min-h-24" value={content.about.missionParagraphs[1]} onChange={(e) => setValue(["about", "missionParagraphs"], [content.about.missionParagraphs[0], e.target.value])} />
            </Field>
          </div>

          <div className="card card-p">
            <SectionTitle title="About Statistics" description="Four highlight numbers in the stats section." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.about.stats.map((stat, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4 grid grid-cols-1 gap-4">
                  <Field label={`Stat ${index + 1} Value`}>
                    <input className="input" value={stat.value} onChange={(e) => setValue(["about", "stats", index, "value"], e.target.value)} />
                  </Field>
                  <Field label={`Stat ${index + 1} Label`}>
                    <input className="input" value={stat.label} onChange={(e) => setValue(["about", "stats", index, "label"], e.target.value)} />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-p">
            <SectionTitle title="How It Works Steps" description="Four items explaining the business flow on the about page." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.about.steps.map((step, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4 space-y-4">
                  <Field label="Step Number">
                    <input className="input" value={step.step} onChange={(e) => setValue(["about", "steps", index, "step"], e.target.value)} />
                  </Field>
                  <Field label="Step Title">
                    <input className="input" value={step.title} onChange={(e) => setValue(["about", "steps", index, "title"], e.target.value)} />
                  </Field>
                  <Field label="Step Description">
                    <textarea className="input min-h-24" value={step.desc} onChange={(e) => setValue(["about", "steps", index, "desc"], e.target.value)} />
                  </Field>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CONTACT TAB ═══════════ */}
      {tab === "contact" && (
        <div className="space-y-6">
          <div className="card card-p space-y-4">
            <SectionTitle title="Contact Page" description="Hero text, cards, hours, and form." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Hero Title">
                <input className="input" value={content.contact.heroTitle} onChange={(e) => setValue(["contact", "heroTitle"], e.target.value)} />
              </Field>
              <Field label="Business Hours Title">
                <input className="input" value={content.contact.businessHoursTitle} onChange={(e) => setValue(["contact", "businessHoursTitle"], e.target.value)} />
              </Field>
              <Field label="Form Title">
                <input className="input" value={content.contact.formTitle} onChange={(e) => setValue(["contact", "formTitle"], e.target.value)} />
              </Field>
              <Field label="Success Message">
                <input className="input" value={content.contact.successMessage} onChange={(e) => setValue(["contact", "successMessage"], e.target.value)} />
              </Field>
            </div>
            <Field label="Hero Description">
              <textarea className="input min-h-24" value={content.contact.heroDescription} onChange={(e) => setValue(["contact", "heroDescription"], e.target.value)} />
            </Field>
          </div>

          <div className="card card-p">
            <SectionTitle title="Contact Info Cards" description="Office, phone, and email cards." />
            <div className="space-y-5">
              {content.contact.cards.map((card, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Field label="Card Title">
                      <input className="input" value={card.title} onChange={(e) => setValue(["contact", "cards", index, "title"], e.target.value)} />
                    </Field>
                    <Field label="Icon Path">
                      <input className="input" value={card.icon} onChange={(e) => setValue(["contact", "cards", index, "icon"], e.target.value)} />
                    </Field>
                    <Field label="Line 1">
                      <input className="input" value={card.lines[0]} onChange={(e) => setValue(["contact", "cards", index, "lines"], [e.target.value, card.lines[1]])} />
                    </Field>
                    <Field label="Line 2">
                      <input className="input" value={card.lines[1]} onChange={(e) => setValue(["contact", "cards", index, "lines"], [card.lines[0], e.target.value])} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-p">
            <SectionTitle title="Business Hours" description="Hours displayed below the contact cards." />
            <div className="space-y-4">
              {content.contact.businessHours.map((row, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label="Day Label">
                    <input className="input" value={row.day} onChange={(e) => setValue(["contact", "businessHours", index, "day"], e.target.value)} />
                  </Field>
                  <Field label="Time Label">
                    <input className="input" value={row.time} onChange={(e) => setValue(["contact", "businessHours", index, "time"], e.target.value)} />
                  </Field>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ FOOTER TAB ═══════════ */}
      {tab === "footer" && (
        <div className="space-y-6">
          <div className="card card-p">
            <SectionTitle title="Footer Content" description="Footer text, contact info, and links." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="About Text">
                <textarea className="input min-h-24" value={f.aboutText} onChange={(e) => setValue(["footer", "aboutText"], e.target.value)} />
              </Field>
              <Field label="Phone">
                <input className="input" value={f.phone} onChange={(e) => setValue(["footer", "phone"], e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="input" value={f.email} onChange={(e) => setValue(["footer", "email"], e.target.value)} />
              </Field>
              <Field label="Address">
                <input className="input" value={f.address} onChange={(e) => setValue(["footer", "address"], e.target.value)} />
              </Field>
              <Field label="Business Hours">
                <input className="input" value={f.businessHours} onChange={(e) => setValue(["footer", "businessHours"], e.target.value)} />
              </Field>
              <Field label="Copyright Text">
                <input className="input" value={f.copyrightText} onChange={(e) => setValue(["footer", "copyrightText"], e.target.value)} />
              </Field>
              <Field label="App Store URL">
                <input className="input" value={f.appStoreUrl} onChange={(e) => setValue(["footer", "appStoreUrl"], e.target.value)} />
              </Field>
              <Field label="Play Store URL">
                <input className="input" value={f.playStoreUrl} onChange={(e) => setValue(["footer", "playStoreUrl"], e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="card card-p">
            <SectionTitle title="Footer Social Links" description="Social media links in the footer." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {["facebook", "twitter", "instagram", "youtube", "pinterest"].map((key) => (
                <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                  <input className="input" value={(f.socialLinks || {})[key] || ""} onChange={(e) => setValue(["footer", "socialLinks", key], e.target.value)} />
                </Field>
              ))}
            </div>
          </div>
          <div className="card card-p">
            <SectionTitle title="Quick Links" description="Footer quick links column." />
            {(f.quickLinks || []).map((link, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-4 mb-3">
                <Field label="Label">
                  <input className="input" value={link.label} onChange={(e) => { const q = [...(f.quickLinks || [])]; q[idx] = { ...q[idx], label: e.target.value }; setValue(["footer", "quickLinks"], q); }} />
                </Field>
                <Field label="Link">
                  <input className="input" value={link.href} onChange={(e) => { const q = [...(f.quickLinks || [])]; q[idx] = { ...q[idx], href: e.target.value }; setValue(["footer", "quickLinks"], q); }} />
                </Field>
              </div>
            ))}
          </div>
          <div className="card card-p">
            <SectionTitle title="Support Links" description="Footer support center links column." />
            {(f.supportLinks || []).map((link, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-4 mb-3">
                <Field label="Label">
                  <input className="input" value={link.label} onChange={(e) => { const s = [...(f.supportLinks || [])]; s[idx] = { ...s[idx], label: e.target.value }; setValue(["footer", "supportLinks"], s); }} />
                </Field>
                <Field label="Link">
                  <input className="input" value={link.href} onChange={(e) => { const s = [...(f.supportLinks || [])]; s[idx] = { ...s[idx], href: e.target.value }; setValue(["footer", "supportLinks"], s); }} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
