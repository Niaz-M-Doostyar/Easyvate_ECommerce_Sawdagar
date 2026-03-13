"use client";
import { useState, useRef } from "react";

export default function ImageUploader({ images = [], onChange, max = 10, label = "Images" }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const upload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newImages = [...images];
      for (const file of Array.from(files).slice(0, max - images.length)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
        if (res.ok) {
          const data = await res.json();
          newImages.push(data.url);
        }
      }
      onChange(newImages);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const updated = [...images];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
        {images.map((url, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {i > 0 && (
                <button type="button" onClick={() => moveUp(i)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-navy hover:bg-gray-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                </button>
              )}
              <button type="button" onClick={() => remove(i)} className="w-7 h-7 bg-red rounded-full flex items-center justify-center text-white hover:bg-red/80">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {i === 0 && <span className="absolute top-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-semibold">Main</span>}
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center text-body hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span className="text-xs font-medium">Upload</span>
              </>
            )}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      <p className="text-xs text-body">{images.length}/{max} images. JPEG, PNG, WebP up to 5MB.</p>
    </div>
  );
}
