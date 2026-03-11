/**
 * maji by majaco — Main JavaScript
 * Handles: mobile nav, smooth scroll, scroll animations, active nav links, scroll-to-top
 */

(function () {
  'use strict';

  /* ============================
     Mobile Hamburger Menu
     ============================ */
  function initMobileNav() {
    const hamburger = document.querySelector('.nav__hamburger');
    const mobileMenu = document.querySelector('.nav__mobile');
    const mobileLinks = document.querySelectorAll('.nav__mobile a');

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen.toString());
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu on link click
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu on outside click
    document.addEventListener('click', function (e) {
      if (
        mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  /* ============================
     Smooth Scroll for Anchors
     ============================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '72',
          10
        );

        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

        window.scrollTo({
          top: Math.max(0, top),
          behavior: 'smooth',
        });
      });
    });
  }

  /* ============================
     Nav — Scrolled State
     ============================ */
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================
     Active Nav Link Highlighting
     ============================ */
  function initActiveNav() {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const navLinks = document.querySelectorAll('.nav__links a, .nav__mobile a');

    navLinks.forEach(function (link) {
      const linkPath = link.getAttribute('href');
      if (!linkPath) return;

      // Exact match or starts with path
      const normalized = linkPath.replace(/\/$/, '') || '/';
      if (
        normalized === currentPath ||
        (normalized !== '/' && currentPath.startsWith(normalized))
      ) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ============================
     Scroll-Triggered Animations
     ============================ */
  function initScrollAnimations() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    // Check if IntersectionObserver is available
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all immediately
      revealEls.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Stagger children if data-stagger is set
            const el = entry.target;
            const delay = el.dataset.delay || 0;
            setTimeout(function () {
              el.classList.add('visible');
            }, parseInt(delay, 10));
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ============================
     Scroll-to-Top Button
     ============================ */
  function initScrollTop() {
    const btn = document.querySelector('.scroll-top');
    if (!btn) return;

    function onScroll() {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================
     Contact Form (static submit)
     ============================ */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const successMsg = document.querySelector('.form-message.success');
      const errorMsg   = document.querySelector('.form-message.error');
      const submitBtn  = form.querySelector('[type="submit"]');

      // Hide previous messages
      if (successMsg) successMsg.style.display = 'none';
      if (errorMsg)   errorMsg.style.display   = 'none';

      // Simulate sending (static site — redirect to majaco.co)
      if (submitBtn) {
        submitBtn.textContent = 'Sending…';
        submitBtn.disabled = true;
      }

      setTimeout(function () {
        // Redirect all form submissions to majaco.co
        window.location.href = 'https://majaco.co';
      }, 800);
    });
  }

  /* ============================
     Stagger Reveal for Grid Items
     ============================ */
  function initGridStagger() {
    document.querySelectorAll('.tools-grid, .problem-grid, .pitfalls-list').forEach(function (grid) {
      const children = grid.querySelectorAll('.tool-card, .problem-card, .pitfall-item');
      children.forEach(function (child, i) {
        child.classList.add('reveal');
        child.dataset.delay = i * 80;
      });
    });
  }

  /* ============================
     Init all
     ============================ */
  function init() {
    initMobileNav();
    initSmoothScroll();
    initNavScroll();
    initActiveNav();
    initGridStagger();
    // Must run after stagger adds .reveal classes
    requestAnimationFrame(function () {
      initScrollAnimations();
    });
    initScrollTop();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
