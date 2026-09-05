"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders, useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { formatPrice } from "@/lib/currency";

const FALLBACK_IMAGE = "/assets/img/product/placeholder.png";

function CheckoutLoading() {
  return (
    <main className="swd-commerce swd-checkout-page" aria-busy="true" aria-label="Loading checkout">
      <div className="container">
        <div className="swd-checkout-loading">
          <span className="swd-skeleton swd-checkout-loading__form" />
          <span className="swd-skeleton swd-checkout-loading__summary" />
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, cartTotal, clearCart, loading: cartLoading } = useCart();
  const toast = useToast();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    province: "",
    district: "",
    village: "",
    landmark: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.fullName || "",
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  if (authLoading || (user && cartLoading)) return <CheckoutLoading />;

  if (!user) {
    return (
      <main className="swd-commerce swd-checkout-page">
        <header className="swd-page-head swd-page-head--compact">
          <div className="container">
            <nav className="swd-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">{t("home") || "Home"}</Link>
              <i className="far fa-angle-right" aria-hidden="true" />
              <span aria-current="page">{t("checkout") || "Checkout"}</span>
            </nav>
            <span className="swd-eyebrow">{t("complete_your_order") || "Complete your order"}</span>
            <h1>{t("checkout") || "Checkout"}</h1>
          </div>
        </header>
        <div className="container">
          <div className="swd-state-card swd-state-card--page">
            <span className="swd-state-card__icon"><i className="far fa-user-lock" aria-hidden="true" /></span>
            <h2>{t("please_sign_in") || "Please sign in"}</h2>
            <p>{t("sign_in_checkout") || "Sign in to securely place and track your order."}</p>
            <Link href="/login" className="swd-primary-button">
              {t("sign_in") || "Sign in"}
              <i className="far fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="swd-commerce swd-checkout-page">
        <header className="swd-page-head swd-page-head--compact">
          <div className="container">
            <nav className="swd-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">{t("home") || "Home"}</Link>
              <i className="far fa-angle-right" aria-hidden="true" />
              <span aria-current="page">{t("checkout") || "Checkout"}</span>
            </nav>
            <span className="swd-eyebrow">{t("complete_your_order") || "Complete your order"}</span>
            <h1>{t("checkout") || "Checkout"}</h1>
          </div>
        </header>
        <div className="container">
          <div className="swd-state-card swd-state-card--page">
            <span className="swd-state-card__icon"><i className="far fa-shopping-bag" aria-hidden="true" /></span>
            <h2>{t("cart_empty") || "Your cart is empty"}</h2>
            <p>{t("cart_empty_desc") || "Add products to your cart before starting checkout."}</p>
            <Link href="/search" className="swd-primary-button">
              {t("browse_products") || "Browse products"}
              <i className="far fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.province || !form.district || !form.phone) {
      toast.error(t("fill_required") || "Fill all required fields");
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...form,
          paymentMethod: "cod",
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        clearCart();
        toast.success(t("order_placed") || "Order placed successfully!");
        router.push(`/orders/${data.order?.id || data.id || ""}`);
      } else {
        toast.error(data.error || t("order_failed") || "Order failed");
      }
    } catch {
      toast.error(t("something_wrong") || "Something went wrong");
    } finally {
      setPlacingOrder(false);
    }
  };

  const getProductName = (product, productId) => {
    if (lang === "ps" && product.namePs) return product.namePs;
    if (lang === "dr" && product.nameDr) return product.nameDr;
    return product.nameEn || `Product #${productId}`;
  };

  const getImage = (item) => {
    const image = item.product?.images?.[0]?.url || item.image;
    if (!image) return FALLBACK_IMAGE;
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return `/${image}`;
  };

  return (
    <main className="swd-commerce swd-checkout-page">
      <header className="swd-page-head swd-page-head--compact">
        <div className="container">
          <nav className="swd-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">{t("home") || "Home"}</Link>
            <i className="far fa-angle-right" aria-hidden="true" />
            <Link href="/cart">{t("cart") || "Cart"}</Link>
            <i className="far fa-angle-right" aria-hidden="true" />
            <span aria-current="page">{t("checkout") || "Checkout"}</span>
          </nav>
          <div className="swd-page-head__content">
            <div>
              <span className="swd-eyebrow">{t("complete_your_order") || "Complete your order"}</span>
              <h1>{t("checkout") || "Checkout"}</h1>
              <p>{t("checkout_intro") || "Add your delivery details and review the order before confirming."}</p>
            </div>
          </div>
          <ol className="swd-checkout-progress" aria-label={t("checkout_progress") || "Checkout progress"}>
            <li className="is-complete"><span><i className="far fa-check" aria-hidden="true" /></span><strong>{t("cart") || "Cart"}</strong></li>
            <li className="is-active" aria-current="step"><span>2</span><strong>{t("delivery") || "Delivery"}</strong></li>
            <li><span>3</span><strong>{t("confirmation") || "Confirmation"}</strong></li>
          </ol>
        </div>
      </header>

      <section className="swd-checkout-content">
        <div className="container">
          <form className="swd-checkout-layout" onSubmit={handleSubmit} noValidate={false}>
            <div className="swd-checkout-main">
              <section className="swd-checkout-card" aria-labelledby="delivery-address-title">
                <div className="swd-checkout-card__heading">
                  <span className="swd-step-icon"><i className="far fa-map-marker-alt" aria-hidden="true" /></span>
                  <div>
                    <span className="swd-eyebrow">{t("step_two") || "Step 2 of 3"}</span>
                    <h2 id="delivery-address-title">{t("delivery_address") || "Delivery address"}</h2>
                    <p>{t("delivery_address_help") || "Tell us where our delivery team should bring your order."}</p>
                  </div>
                </div>

                <div className="swd-form-grid">
                  <label className="swd-field">
                    <span>{t("full_name") || "Full name"} <em>*</em></span>
                    <div className="swd-field__control">
                      <i className="far fa-user" aria-hidden="true" />
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(event) => setField("fullName", event.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                  </label>

                  <label className="swd-field">
                    <span>{t("phone") || "Phone number"} <em>*</em></span>
                    <div className="swd-field__control">
                      <i className="far fa-phone" aria-hidden="true" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) => setField("phone", event.target.value)}
                        placeholder="07XXXXXXXX"
                        autoComplete="tel"
                        inputMode="tel"
                        dir="ltr"
                        required
                      />
                    </div>
                    <small>{t("phone_delivery_help") || "The delivery team will call this number."}</small>
                  </label>

                  <label className="swd-field">
                    <span>{t("province") || "Province"} <em>*</em></span>
                    <div className="swd-field__control">
                      <i className="far fa-map" aria-hidden="true" />
                      <input
                        type="text"
                        value={form.province}
                        onChange={(event) => setField("province", event.target.value)}
                        placeholder={t("province_placeholder") || "e.g. Kabul"}
                        autoComplete="address-level1"
                        required
                      />
                    </div>
                  </label>

                  <label className="swd-field">
                    <span>{t("district") || "District"} <em>*</em></span>
                    <div className="swd-field__control">
                      <i className="far fa-map-pin" aria-hidden="true" />
                      <input
                        type="text"
                        value={form.district}
                        onChange={(event) => setField("district", event.target.value)}
                        placeholder={t("district_placeholder") || "e.g. District 5"}
                        autoComplete="address-level2"
                        required
                      />
                    </div>
                  </label>

                  <label className="swd-field">
                    <span>{t("village") || "Village / street"}</span>
                    <div className="swd-field__control">
                      <i className="far fa-road" aria-hidden="true" />
                      <input
                        type="text"
                        value={form.village}
                        onChange={(event) => setField("village", event.target.value)}
                        placeholder={t("village_placeholder") || "Village or street name"}
                        autoComplete="address-line1"
                      />
                    </div>
                  </label>

                  <label className="swd-field">
                    <span>{t("landmark") || "Nearby landmark"}</span>
                    <div className="swd-field__control">
                      <i className="far fa-landmark" aria-hidden="true" />
                      <input
                        type="text"
                        value={form.landmark}
                        onChange={(event) => setField("landmark", event.target.value)}
                        placeholder={t("landmark_placeholder") || "Near a mosque, school, etc."}
                        autoComplete="address-line2"
                      />
                    </div>
                  </label>

                  <label className="swd-field swd-field--wide">
                    <span>{t("order_notes") || "Order notes"} <small>({t("optional") || "Optional"})</small></span>
                    <textarea
                      value={form.notes}
                      onChange={(event) => setField("notes", event.target.value)}
                      rows="4"
                      placeholder={t("order_notes_placeholder") || "Special delivery instructions"}
                    />
                  </label>
                </div>
              </section>

              <section className="swd-checkout-card" aria-labelledby="payment-method-title">
                <div className="swd-checkout-card__heading">
                  <span className="swd-step-icon"><i className="far fa-wallet" aria-hidden="true" /></span>
                  <div>
                    <span className="swd-eyebrow">{t("payment") || "Payment"}</span>
                    <h2 id="payment-method-title">{t("payment_method") || "Payment method"}</h2>
                    <p>{t("payment_method_help") || "Choose how you want to pay for this order."}</p>
                  </div>
                </div>

                <label className="swd-payment-option" htmlFor="payment-cod">
                  <input type="radio" name="payment" id="payment-cod" value="cod" defaultChecked />
                  <span className="swd-payment-option__radio" aria-hidden="true" />
                  <span className="swd-payment-option__icon"><i className="far fa-hand-holding-usd" aria-hidden="true" /></span>
                  <span>
                    <strong>{t("cod") || "Cash on delivery"}</strong>
                    <small>{t("cod_desc") || "Pay in cash when your order arrives."}</small>
                  </span>
                  <span className="swd-payment-option__badge">{t("available") || "Available"}</span>
                </label>
              </section>
            </div>

            <aside className="swd-order-summary swd-checkout-summary" aria-labelledby="order-summary-heading">
              <div className="swd-order-summary__heading">
                <span className="swd-eyebrow">{t("review_order") || "Review order"}</span>
                <h2 id="order-summary-heading">{t("order_summary") || "Order summary"}</h2>
                <Link href="/cart">{t("edit_cart") || "Edit cart"}</Link>
              </div>

              <div className="swd-checkout-items">
                {items.map((item) => {
                  const product = item.product || {};
                  const productName = getProductName(product, item.productId);
                  const price = Number(product.retailPrice || item.retailPrice) || 0;
                  return (
                    <div className="swd-checkout-item" key={item.id || item.productId}>
                      <div className="swd-checkout-item__image">
                        <img
                          src={getImage(item)}
                          alt={productName}
                          onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
                        />
                        <span>{item.quantity}</span>
                      </div>
                      <div>
                        <strong>{productName}</strong>
                        <small>SKU: SWD-{item.productId}</small>
                      </div>
                      <b>{formatPrice(price * item.quantity)}</b>
                    </div>
                  );
                })}
              </div>

              <dl className="swd-summary-lines">
                <div><dt>{t("subtotal") || "Subtotal"}</dt><dd>{formatPrice(cartTotal)}</dd></div>
                <div><dt>{t("delivery") || "Delivery"}</dt><dd className="is-free">{t("free") || "Free"}</dd></div>
                <div className="swd-summary-total"><dt>{t("total") || "Total"}</dt><dd>{formatPrice(cartTotal)}</dd></div>
              </dl>

              <button
                type="submit"
                disabled={placingOrder}
                className="swd-primary-button swd-primary-button--wide"
                aria-busy={placingOrder}
              >
                {placingOrder ? (
                  <><i className="far fa-spinner fa-spin" aria-hidden="true" />{t("placing_order") || "Placing order…"}</>
                ) : (
                  <>{t("place_order") || "Place order"}<i className="far fa-arrow-right" aria-hidden="true" /></>
                )}
              </button>

              <p className="swd-order-consent">
                <i className="far fa-lock" aria-hidden="true" />
                {t("order_consent") || "By placing your order, you confirm that the delivery details are correct."}
              </p>
            </aside>
          </form>
        </div>
      </section>
    </main>
  );
}
