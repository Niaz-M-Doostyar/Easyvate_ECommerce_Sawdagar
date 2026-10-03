"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SponsoredAd() {
  const [product, setProduct] = useState(null);
  useEffect(() => {
    if (sessionStorage.getItem("sawdagar-sponsored-seen")) return;
    let active = true;
    fetch("/api/products/sponsored").then(response => response.json()).then(data => {
      const first = (data.products || data || [])[0];
      if (active && first) {
        setProduct(first);
        sessionStorage.setItem("sawdagar-sponsored-seen", "1");
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!product) return undefined;
    const timer = setTimeout(() => setProduct(null), 4000);
    return () => clearTimeout(timer);
  }, [product]);
  if (!product) return null;
  return <div role="dialog" aria-label="Sponsored product" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#06122ab8", display: "grid", placeItems: "center", padding: 20 }}>
    <div style={{ position: "relative", background: "white", borderRadius: 24, padding: 20, width: "min(100%, 390px)", boxShadow: "0 20px 60px #0004" }}>
      <button onClick={() => setProduct(null)} aria-label="Close ad" style={{ position: "absolute", right: 16, top: 12, fontSize: 24, border: 0, background: "transparent" }}>×</button>
      <span style={{ color: "#a15a11", fontWeight: 700 }}>Sponsored</span>
      <Link href={`/products/${product.id}`} onClick={() => setProduct(null)} style={{ display: "block", color: "inherit" }}>
        {product.images?.[0]?.url && <img src={product.images[0].url} alt="" style={{ width: "100%", height: 220, objectFit: "contain" }} />}
        <h2 style={{ margin: "14px 0 8px" }}>{product.nameEn}</h2>
        <span style={{ color: "#175ce3", fontWeight: 700 }}>View product →</span>
      </Link>
    </div>
  </div>;
}
