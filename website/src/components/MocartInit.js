'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MocartInit() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let magnificTimer = null;

    function hidePreloader() {
      const pre = document.querySelector('.preloader');
      if (!pre) return;
      try {
        // Try jQuery fadeOut if available
        const $ = window.jQuery;
        if ($) {
          $(pre).fadeOut('slow');
          return;
        }
      } catch (e) {}

      // Fallback plain JS hide
      try {
        pre.style.transition = 'opacity 0.3s ease';
        pre.style.opacity = '0';
        setTimeout(() => {
          try { pre.style.display = 'none'; } catch (e) {}
        }, 400);
      } catch (e) {}
    }

    function poll(retries) {
      if (cancelled) return;
      const $ = window.jQuery;
      if ($ && $.fn && $.fn.owlCarousel) {
        // Wait for React DOM paint to complete before initializing carousels
        requestAnimationFrame(() => {
          if (cancelled) return;
          timer = setTimeout(() => {
            if (!cancelled) initAll($);
          }, 500);
        });
      } else if (retries > 0) {
        timer = setTimeout(() => poll(retries - 1), 150);
      } else {
        // Ensure preloader doesn't hang indefinitely if jQuery never loads
        hidePreloader();
      }
    }

    function initAll($) {
      // Destroy any existing owl carousels first
      try {
        $('.owl-carousel.owl-loaded').each(function () {
          $(this).owlCarousel('destroy');
          $(this).removeClass('owl-loaded owl-hidden');
        });
      } catch (e) {}

      // Small settle time
      setTimeout(() => {
        if (cancelled) return;

        try {
          if ($('.hero-slider').length && !$('.hero-slider').hasClass('owl-loaded')) {
            $('.hero-slider').owlCarousel({ loop: true, nav: true, dots: true, autoplay: true, autoplayTimeout: 5000, items: 1, animateOut: 'fadeOut', animateIn: 'fadeIn', navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
          }
        } catch (e) {}

        try {
          if ($('.category-slider').length && !$('.category-slider').hasClass('owl-loaded')) {
            $('.category-slider').owlCarousel({ loop: true, nav: true, dots: false, autoplay: true, autoplayTimeout: 3000, margin: 20, responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } }, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
          }
        } catch (e) {}

        try {
          $('.product-slider').each(function () {
            if (!$(this).hasClass('owl-loaded') && $(this).children().length > 0) {
              $(this).owlCarousel({ loop: true, nav: true, dots: false, autoplay: true, autoplayTimeout: 4000, margin: 20, responsive: { 0: { items: 1 }, 576: { items: 2 }, 768: { items: 3 }, 992: { items: 4 }, 1200: { items: 5 } }, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
            }
          });
        } catch (e) {}

        try {
          if ($('.brand-slider').length && !$('.brand-slider').hasClass('owl-loaded')) {
            $('.brand-slider').owlCarousel({ loop: true, nav: false, dots: false, autoplay: true, autoplayTimeout: 3000, margin: 30, responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } } });
          }
        } catch (e) {}

        try {
          if ($('.deal-slider').length && !$('.deal-slider').hasClass('owl-loaded')) {
            $('.deal-slider').owlCarousel({ loop: true, nav: true, dots: false, autoplay: true, autoplayTimeout: 5000, items: 1, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
          }
        } catch (e) {}

        try {
          if ($('.testimonial-slider').length && !$('.testimonial-slider').hasClass('owl-loaded')) {
            $('.testimonial-slider').owlCarousel({ loop: true, nav: false, dots: true, autoplay: true, autoplayTimeout: 4000, margin: 20, responsive: { 0: { items: 1 }, 768: { items: 2 }, 992: { items: 3 } } });
          }
        } catch (e) {}

        try {
          if ($('.instagram-slider').length && !$('.instagram-slider').hasClass('owl-loaded')) {
            $('.instagram-slider').owlCarousel({ loop: true, nav: false, dots: false, autoplay: true, autoplayTimeout: 3000, margin: 15, responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } } });
          }
        } catch (e) {}

        // WOW.js
        try { if (window.WOW) new window.WOW({ offset: 100, mobile: false }).init(); } catch (e) {}

        // Magnific Popup (only initialize youtube popups; gallery uses React modal)
        try {
          if ($.fn.magnificPopup) {
            $('.popup-youtube').magnificPopup({ type: 'iframe' });
          }
        } catch (e) {}

        // Tooltips
        try {
          document.querySelectorAll('[data-tooltip="tooltip"]').forEach(el => {
            if (!el._bsTooltip) el._bsTooltip = new window.bootstrap.Tooltip(el);
          });
        } catch (e) {}

        // Countdown
        try {
          if ($.fn.countdown) {
            $('[data-countdown]').each(function () {
              const date = $(this).data('countdown');
              $(this).countdown(date, function (event) {
                $(this).html(event.strftime(
                  '<div class="countdown-item"><span>%D</span><small>Days</small></div>' +
                  '<div class="countdown-item"><span>%H</span><small>Hours</small></div>' +
                  '<div class="countdown-item"><span>%M</span><small>Mins</small></div>' +
                  '<div class="countdown-item"><span>%S</span><small>Secs</small></div>'
                ));
              });
            });
          }
        } catch (e) {}

        // Preloader
        try { $('.preloader').fadeOut('slow'); } catch (e) {}
      }, 150);
    }

    function initMagnific(retries = 40) {
      if (cancelled) return;
      const $ = window.jQuery;
      try {
        if ($ && $.fn && $.fn.magnificPopup) {
          $('.popup-youtube').magnificPopup({ type: 'iframe' });
          $('.popup-gallery').magnificPopup({ delegate: '.popup-img', type: 'image', gallery: { enabled: true } });
          return;
        }
      } catch (e) {}

      if (retries > 0) {
        magnificTimer = setTimeout(() => initMagnific(retries - 1), 200);
      }
    }

    poll(80);
    initMagnific();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (magnificTimer) clearTimeout(magnificTimer);
    };
  }, [pathname]);

  return null;
}
