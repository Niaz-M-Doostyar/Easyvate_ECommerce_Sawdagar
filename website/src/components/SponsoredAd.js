"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { responsiveImage } from "@/lib/image";

export default function SponsoredAd({ products = [] }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("sawdagar-sponsored-seen")) return;
    const first = products.find(item => item.images?.[0]?.url || item.image || item.thumbnail);
    if (!first) return;
    sessionStorage.setItem("sawdagar-sponsored-seen", "1");
    setProduct(first);
  }, [products]);

  useEffect(() => {
    if (!product) return undefined;
    const timer = setTimeout(() => setProduct(null), 4000);
    return () => clearTimeout(timer);
  }, [product]);

  if (!product) return null;
  const image = responsiveImage(product.images?.[0]?.url || product.image || product.thumbnail, {
    widths: [400, 600, 800], quality: 80, sizes: "(max-width: 600px) 90vw, 560px",
  });

  return <div role="dialog" aria-label="Sponsored product" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#06122ab8", display: "grid", placeItems: "center", padding: 20 }}>
    <div style={{ position: "relative", width: "min(100%, 560px)", aspectRatio: "1", maxHeight: "85vh" }}>
      <Link href={`/products/${product.id}`} onClick={() => setProduct(null)} aria-label={`View ${product.nameEn || 'sponsored product'}`} style={{ display: "block", width: "100%", height: "100%" }}>
        <img src={image.src} srcSet={image.srcSet} sizes={image.sizes} alt={product.nameEn || "Sponsored product"} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", borderRadius: 20, background: "white" }} />
      </Link>
      <button type="button" onClick={() => setProduct(null)} aria-label="Close ad" style={{ position: "absolute", right: 10, top: 10, width: 38, height: 38, borderRadius: "50%", border: 0, background: "#0009", color: "white", fontSize: 26, lineHeight: "38px", cursor: "pointer" }}>×</button>
    </div>
  </div>;
}
