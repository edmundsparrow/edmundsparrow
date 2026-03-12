/**
 * animate.js
 * Three focused effects:
 *   1. Scroll-triggered card/item reveals (all pages)
 *   2. Stat number counter (mission.html)
 *   3. Hero stagger entry (index.html)
 */

(function () {

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     1. SCROLL-TRIGGERED REVEALS
     Watches for .reveal elements entering
     the viewport and adds .in-view.
     CSS handles the actual animation.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initReveal() {
    const targets = document.querySelectorAll(
      '.app-card, .svc-card, .stack-item, .pillar, .served-item, .stat, .c-link, .suite-intro'
    );

    if (!targets.length) return;

    // Stagger delay based on position within a shared parent row
    targets.forEach((el) => {
      el.classList.add('reveal');

      // Find siblings in same grid/flex parent and assign delay
      const siblings = Array.from(el.parentElement.children).filter(c =>
        c.classList.contains('reveal')
      );
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = `${Math.min(idx * 80, 400)}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach(el => observer.observe(el));
  }


  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     2. STAT COUNTER (mission.html)
     Counts up from 0 to target when
     the stat block scrolls into view.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initCounters() {
    const stats = document.querySelectorAll('.stat-num');
    if (!stats.length) return;

    function parseTarget(el) {
      const raw = el.textContent.trim();
      const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
      const prefix = raw.match(/^[^0-9]*/)[0] || '';
      const suffix = raw.match(/[^0-9.]*$/)[0] || '';
      return { num, prefix, suffix };
    }

    function countUp(el, target, suffix, prefix, duration = 1200) {
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        // ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(ease * target);
        el.textContent = prefix + current + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const { num, prefix, suffix } = parseTarget(el);
            if (!isNaN(num)) countUp(el, num, suffix, prefix);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    stats.forEach(el => observer.observe(el));
  }


  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     3. HERO STAGGER (index.html)
     Staggers .hero-inner children on load.
     Respects prefers-reduced-motion.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initHeroStagger() {
    const inner = document.querySelector('.hero-inner');
    if (!inner) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // Remove the blanket animation set in CSS so we control each child
    inner.style.animation = 'none';

    const children = Array.from(inner.children);
    children.forEach((child, i) => {
      child.style.opacity    = '0';
      child.style.transform  = 'translateY(22px)';
      child.style.transition = `opacity .55s var(--ease), transform .55s var(--ease)`;
      child.style.transitionDelay = `${i * 110 + 60}ms`;
    });

    // Trigger on next frame so the initial hidden state paints first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        children.forEach(child => {
          child.style.opacity   = '1';
          child.style.transform = 'translateY(0)';
        });
      });
    });
  }


  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     INIT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function init() {
    initReveal();
    initCounters();
    initHeroStagger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
