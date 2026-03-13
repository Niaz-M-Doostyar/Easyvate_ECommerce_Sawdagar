'use client';

import { useEffect } from 'react';

export default function MocartInit() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === 'undefined' || !window.jQuery) return;
      const $ = window.jQuery;

      // Init Owl Carousels
      try {
        if ($.fn.owlCarousel) {
          $('.hero-slider').owlCarousel({ loop: true, nav: true, dots: true, autoplay: true, autoplayTimeout: 5000, items: 1, animateOut: 'fadeOut', animateIn: 'fadeIn', navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
          $('.category-slider').owlCarousel({ loop: true, nav: true, dots: false, autoplay: true, autoplayTimeout: 3000, margin: 20, responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } }, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
          $('.product-slider').owlCarousel({ loop: true, nav: true, dots: false, autoplay: true, autoplayTimeout: 4000, margin: 20, responsive: { 0: { items: 1 }, 576: { items: 2 }, 768: { items: 3 }, 992: { items: 4 }, 1200: { items: 5 } }, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
          $('.brand-slider').owlCarousel({ loop: true, nav: false, dots: false, autoplay: true, autoplayTimeout: 3000, margin: 30, responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } } });
          $('.deal-slider').owlCarousel({ loop: true, nav: true, dots: false, autoplay: true, autoplayTimeout: 5000, items: 1, navText: ['<i class="far fa-arrow-left"></i>', '<i class="far fa-arrow-right"></i>'] });
          $('.testimonial-slider').owlCarousel({ loop: true, nav: false, dots: true, autoplay: true, autoplayTimeout: 4000, margin: 20, responsive: { 0: { items: 1 }, 768: { items: 2 }, 992: { items: 3 } } });
          $('.instagram-slider').owlCarousel({ loop: true, nav: false, dots: false, autoplay: true, autoplayTimeout: 3000, margin: 15, responsive: { 0: { items: 2 }, 576: { items: 3 }, 768: { items: 4 }, 992: { items: 5 }, 1200: { items: 6 } } });
        }
      } catch (e) { console.log('Owl init error:', e); }

      // Init WOW animations
      try { if (window.WOW) new window.WOW({ offset: 100, mobile: false }).init(); } catch (e) {}

      // Init Magnific Popup
      try {
        if ($.fn.magnificPopup) {
          $('.popup-youtube').magnificPopup({ type: 'iframe' });
          $('.popup-gallery').magnificPopup({ delegate: '.popup-img', type: 'image', gallery: { enabled: true } });
        }
      } catch (e) {}

      // Init tooltips
      try {
        const tooltipTriggerList = document.querySelectorAll('[data-tooltip="tooltip"]');
        tooltipTriggerList.forEach(el => new window.bootstrap.Tooltip(el));
      } catch (e) {}

      // Countdown
      try {
        if ($.fn.countdown) {
          $('[data-countdown]').each(function() {
            const date = $(this).data('countdown');
            $(this).countdown(date, function(event) {
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

      // Hide preloader
      try { $('.preloader').fadeOut('slow'); } catch (e) {}

    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
