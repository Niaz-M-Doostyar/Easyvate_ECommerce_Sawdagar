
"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function QuickViewModal({ product, onClose }) {
    if (!product || typeof document === "undefined") return null;

    const overlayRef = useRef(null);
    const dialogRef = useRef(null);
    const { addToCart } = useCart();
    const toast = useToast();
    const { t, lang } = useLanguage();

    const [active, setActive] = useState(0);
    const [qty, setQty] = useState(1);

    const images = (product.images || []).map(i => {
        const url = i.url || i;
        return url.startsWith("http")
            ? url
            : url.startsWith("/")
            ? url
            : `/${url}`;
    });
    if (images.length === 0) images.push("/placeholder.png");

    const name =
        lang === "ps"
            ? product.namePs || product.nameEn
            : lang === "dr"
            ? product.nameDr || product.nameEn
            : product.nameEn;
    const desc =
        lang === "ps"
            ? product.descPs || product.descEn
            : lang === "dr"
            ? product.descDr || product.descEn
            : product.descEn;
    const price = product.retailPrice || product.suggestedPrice || 0;

    const stop = e => e.stopPropagation();

    const handleAdd = async () => {
        const res = await addToCart(product.id, qty);
        if (res?.success) {
            toast.success(t?.("added_to_cart") || "Added");
            onClose();
        } else {
            toast.error(res?.error || t?.("error") || "Failed");
        }
    };

    useEffect(() => {
        const prev = document.activeElement;
        dialogRef.current?.focus();
        const onKey = e => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setActive(i => (i + 1) % images.length);
            if (e.key === "ArrowLeft") setActive(i => (i - 1 + images.length) % images.length);
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            prev?.focus();
        };
    }, [onClose, images.length]);

    const modalContent = (
        <div
            ref={overlayRef}
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 bg-black/50 z-50 flex items-start md:items-center justify-center p-4"
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                onClick={stop}
                className="w-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden md:grid md:grid-cols-2"
            >
                <div className="bg-gray-50 p-4 flex flex-col">
                    <div className="flex-1 rounded-md overflow-hidden border">
                        <img
                            src={images[active]}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                        {images.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className={`w-12 h-12 rounded-md overflow-hidden border ${
                                    i === active ? "ring-2 ring-blue-600" : ""
                                }`}
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold">{name}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="text-2xl font-bold">${price.toLocaleString()}</div>
                    {desc && <p className="text-sm text-gray-600">{desc}</p>}
                    <div className="mt-auto flex gap-2">
                        <button
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            className="px-3 py-1 border"
                        >
                            -
                        </button>
                        <span>{qty}</span>
                        <button
                            onClick={() => setQty((q) => q + 1)}
                            className="px-3 py-1 border"
                        >
                            +
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={product.stock === 0}
                            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            {product.stock === 0 ? "Unavailable" : "Add to cart"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
