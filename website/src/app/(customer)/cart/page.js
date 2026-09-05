"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";

const FALLBACK_IMAGE = "/assets/img/product/placeholder.png";

export default function CartPage() {
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const missingIds = items
      .map((item) => item.productId)
      .filter((productId) => productId && !products[productId]);

    missingIds.forEach((productId) => {
      fetch(`/api/products/${productId}`, { cache: "no-store", signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Product unavailable");
          return response.json();
        })
        .then((data) => {
          setProducts((current) => ({ ...current, [productId]: data.product || data }));
        })
        .catch((requestError) => {
          if (requestError.name !== "AbortError") {
            setProducts((current) => ({ ...current, [productId]: {} }));
          }
        });
    });

    return () => controller.abort();
  }, [items, products]);

  const getProduct = (item) => item.product || products[item.productId] || {};

  const getName = (product, productId) => {
    if (lang === "ps" && product.namePs) return product.namePs;
    if (lang === "dr" && product.nameDr) return product.nameDr;
    return product.nameEn || `Product #${productId}`;
  };

  const getImage = (item, product) => {
    const image = product.images?.[0]?.url || item.image;
    if (!image) return FALLBACK_IMAGE;
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return `/${image}`;
  };

  if (items.length === 0) {
    return (
      <main className="swd-commerce swd-cart-page">
        <header className="swd-page-head swd-page-head--compact">
          <div className="container">
            <nav className="swd-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">{t("home") || "Home"}</Link>
              <i className="far fa-angle-right" aria-hidden="true" />
              <span aria-current="page">{t("cart") || "Cart"}</span>
            </nav>
            <span className="swd-eyebrow">{t("your_order") || "Your order"}</span>
            <h1>{t("shopping_cart") || "Shopping cart"}</h1>
          </div>
        </header>
        <div className="container">
          <div className="swd-state-card swd-state-card--page">
            <span className="swd-state-card__icon"><i className="far fa-shopping-bag" aria-hidden="true" /></span>
            <h2>{t("cart_empty") || "Your cart is empty"}</h2>
            <p>{t("cart_empty_desc") || "Explore our marketplace and add something you love."}</p>
            <Link href="/search" className="swd-primary-button">
              {t("start_shopping") || "Start shopping"}
              <i className="far fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="swd-commerce swd-cart-page">
      <header className="swd-page-head swd-page-head--compact">
        <div className="container">
          <nav className="swd-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">{t("home") || "Home"}</Link>
            <i className="far fa-angle-right" aria-hidden="true" />
            <span aria-current="page">{t("cart") || "Cart"}</span>
          </nav>
          <div className="swd-page-head__content">
            <div>
              <span className="swd-eyebrow">{t("your_order") || "Your order"}</span>
              <h1>{t("shopping_cart") || "Shopping cart"}</h1>
              <p>{cartCount} {cartCount === 1 ? (t("item") || "item") : (t("items") || "items")} {t("in_your_cart") || "in your cart"}</p>
            </div>
          </div>
          <ol className="swd-checkout-progress" aria-label={t("checkout_progress") || "Checkout progress"}>
            <li className="is-active" aria-current="step"><span>1</span><strong>{t("cart") || "Cart"}</strong></li>
            <li><span>2</span><strong>{t("delivery") || "Delivery"}</strong></li>
            <li><span>3</span><strong>{t("confirmation") || "Confirmation"}</strong></li>
          </ol>
        </div>
      </header>

      <section className="swd-cart-content" aria-labelledby="cart-items-heading">
        <div className="container">
          <div className="swd-cart-layout">
            <div className="swd-cart-items-panel">
              <div className="swd-cart-panel-heading">
                <div>
                  <span className="swd-eyebrow">{t("selected_products") || "Selected products"}</span>
                  <h2 id="cart-items-heading">{t("cart_items") || "Cart items"}</h2>
                </div>
                <button type="button" className="swd-text-button is-danger" onClick={clearCart}>
                  <i className="far fa-trash-alt" aria-hidden="true" />
                  {t("clear_cart") || "Clear cart"}
                </button>
              </div>

              <div className="swd-cart-list" role="list">
                <div className="swd-cart-list__labels" aria-hidden="true">
                  <span>{t("product") || "Product"}</span>
                  <span>{t("price") || "Price"}</span>
                  <span>{t("quantity") || "Quantity"}</span>
                  <span>{t("subtotal") || "Subtotal"}</span>
                  <span />
                </div>

                {items.map((item) => {
                  const product = getProduct(item);
                  const productId = item.productId || product.id;
                  const productName = getName(product, productId);
                  const price = Number(product.retailPrice || item.retailPrice) || 0;
                  const image = getImage(item, product);
                  const itemKey = item.id || item.productId;

                  return (
                    <article className="swd-cart-item" key={itemKey} role="listitem">
                      <div className="swd-cart-product">
                        <Link href={`/products/${productId}`} className="swd-cart-product__image">
                          <img
                            src={image}
                            alt={productName}
                            onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                        </Link>
                        <div>
                          {product.category && (
                            <span>{
                              lang === "ps" ? (product.category.namePs || product.category.nameEn) :
                              lang === "dr" ? (product.category.nameDr || product.category.nameEn) :
                              product.category.nameEn
                            }</span>
                          )}
                          <h3><Link href={`/products/${productId}`}>{productName}</Link></h3>
                          <small>SKU: SWD-{productId}</small>
                        </div>
                      </div>

                      <div className="swd-cart-price" data-label={t("price") || "Price"}>{formatPrice(price)}</div>

                      <div className="swd-quantity-control swd-quantity-control--compact" data-label={t("quantity") || "Quantity"}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          aria-label={`${t("decrease_quantity") || "Decrease quantity"}: ${productName}`}
                        >
                          <i className="far fa-minus" aria-hidden="true" />
                        </button>
                        <output aria-live="polite">{item.quantity}</output>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          aria-label={`${t("increase_quantity") || "Increase quantity"}: ${productName}`}
                        >
                          <i className="far fa-plus" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="swd-cart-subtotal" data-label={t("subtotal") || "Subtotal"}>
                        {formatPrice(price * item.quantity)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(itemKey)}
                        className="swd-cart-remove"
                        aria-label={`${t("remove") || "Remove"} ${productName}`}
                      >
                        <i className="far fa-times" aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="swd-cart-actions">
                <Link href="/search" className="swd-secondary-button">
                  <i className="far fa-arrow-left" aria-hidden="true" />
                  {t("continue_shopping") || "Continue shopping"}
                </Link>
                <div className="swd-cart-help">
                  <i className="far fa-headset" aria-hidden="true" />
                  <span><strong>{t("need_help") || "Need help?"}</strong>{t("support_checkout_note") || "Our team can help with your order."}</span>
                </div>
              </div>
            </div>

            <aside className="swd-order-summary" aria-labelledby="cart-summary-heading">
              <div className="swd-order-summary__heading">
                <span className="swd-eyebrow">{t("order_total") || "Order total"}</span>
                <h2 id="cart-summary-heading">{t("cart_summary") || "Cart summary"}</h2>
              </div>
              <dl className="swd-summary-lines">
                <div><dt>{t("subtotal") || "Subtotal"}</dt><dd>{formatPrice(cartTotal)}</dd></div>
                <div><dt>{t("delivery") || "Delivery"}</dt><dd className="is-free">{t("free") || "Free"}</dd></div>
                <div><dt>{t("payment") || "Payment"}</dt><dd>{t("cod_short") || "COD"}</dd></div>
                <div className="swd-summary-total"><dt>{t("total") || "Total"}</dt><dd>{formatPrice(cartTotal)}</dd></div>
              </dl>

              <Link href="/checkout" className="swd-primary-button swd-primary-button--wide">
                {t("proceed_to_checkout") || "Proceed to checkout"}
                <i className="far fa-arrow-right" aria-hidden="true" />
              </Link>

              <div className="swd-summary-assurance">
                <i className="far fa-shield-check" aria-hidden="true" />
                <p><strong>{t("secure_checkout") || "Secure checkout"}</strong>{t("order_data_protected") || "Your order details are protected."}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
