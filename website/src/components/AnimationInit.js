"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnimationInit() {
  const pathname = usePathname();

  useEffect(() => {
    // Re-initialize WOW.js on every route change
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.WOW) {
        new window.WOW({ boxClass: "wow", animateClass: "animated", offset: 0, mobile: true, live: true }).init();
      }
    }, 100);

    // Re-initialize Owl Carousel
    const carouselTimer = setTimeout(() => {
      if (typeof window !== "undefined" && window.jQuery) {
        const $ = window.jQuery;
        // Hero slider
        if ($(".hero-slider").length && $.fn.owlCarousel) {
          $(".hero-slider").trigger("destroy.owl.carousel").removeClass("owl-loaded owl-drag");
          $(".hero-slider").owlCarousel({ items: 1, loop: true, autoplay: true, autoplayTimeout: 5000, dots: true, nav: true, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'], animateOut: "fadeOut", animateIn: "fadeIn" });
        }
        // Testimonial slider
        if ($(".testimonial-slider2").length && $.fn.owlCarousel) {
          $(".testimonial-slider2").trigger("destroy.owl.carousel").removeClass("owl-loaded owl-drag");
          $(".testimonial-slider2").owlCarousel({ items: 1, loop: true, autoplay: true, autoplayTimeout: 4000, dots: true, nav: false, margin: 30 });
        }
        // Brand slider
        if ($(".brand-slider").length && $.fn.owlCarousel) {
          $(".brand-slider").trigger("destroy.owl.carousel").removeClass("owl-loaded owl-drag");
          $(".brand-slider").owlCarousel({ loop: true, autoplay: true, autoplayTimeout: 3000, dots: false, nav: false, margin: 30, responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } } });
        }
        // Product slider
        if ($(".product-slider").length && $.fn.owlCarousel) {
          $(".product-slider").trigger("destroy.owl.carousel").removeClass("owl-loaded owl-drag");
          $(".product-slider").owlCarousel({ loop: true, autoplay: true, autoplayTimeout: 4000, dots: false, nav: true, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'], margin: 20, responsive: { 0: { items: 1 }, 576: { items: 2 }, 768: { items: 3 }, 1200: { items: 4 } } });
        }
        // Counter up
        if ($(".counter").length && $.fn.counterUp) {
          $(".counter").counterUp({ delay: 10, time: 2000 });
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(carouselTimer);
    };
  }, [pathname]);

  return null;
}
