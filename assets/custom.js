// assets/custom.js (CLEAN CONSOLIDATED)

// Palo Alto — Authentic Ego customizations
// - Vertical product gallery (left thumbs → main image)
// - Optional lightbox on main image
// - Main-image prev/next arrows
// - Product details as Tabs (2 per row, stacked groups)
// - Expand <toggle-ellipsis> inside tabs by measuring true content height
(function () {
  /* =========================
   * Utilities
   * ========================= */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  /* =========================
   * Vertical Gallery (no Flickity)
   * expects markup from product-gallery-vertical.liquid:
   * [data-ae-vert-gallery]
   *   ├─ [data-ae-vert-thumbs] .ae-vert-thumb[data-ae-thumb-id]
   *   └─ [data-ae-vert-main]   .ae-vert-slide[data-ae-slide-id] > [data-product-single-media-wrapper]
   * ========================= */
  function initVerticalGalleries() {
    document.querySelectorAll('[data-ae-vert-gallery]').forEach(function (wrap) {
      const thumbsWrap = wrap.querySelector('[data-ae-vert-thumbs]');
      const mainWrap   = wrap.querySelector('[data-ae-vert-main]');
      if (!thumbsWrap || !mainWrap) return;

      function showSlideById(id) {
        mainWrap.querySelectorAll('.ae-vert-slide').forEach(function (outer) {
          const match = outer.getAttribute('data-ae-slide-id') === id;
          outer.classList.toggle('is-hidden', !match);

          const inner = outer.querySelector('[data-product-single-media-wrapper]');
          if (inner) {
            if (match) {
              inner.classList.remove('media--hidden');
              inner.style.display = 'block';
            } else {
              inner.classList.add('media--hidden');
              inner.style.display = 'none';
            }
          }
        });
      }

      // Init: first active thumb or first thumb
      const initialThumb =
        thumbsWrap.querySelector('.ae-vert-thumb.is-active') ||
        thumbsWrap.querySelector('.ae-vert-thumb');
      if (initialThumb) {
        showSlideById(initialThumb.getAttribute('data-ae-thumb-id'));
      }

      // Thumb clicks
      thumbsWrap.addEventListener('click', function (e) {
        const thumb = e.target.closest('.ae-vert-thumb');
        if (!thumb) return;
        const id = thumb.getAttribute('data-ae-thumb-id');
        if (!id) return;

        thumbsWrap.querySelectorAll('.ae-vert-thumb').forEach(function (t) {
          t.classList.toggle('is-active', t === thumb);
        });
        showSlideById(id);
      });
    });
  }

  /* =========================
   * Lightbox (optional)
   * Opens when clicking the main image link (.product-gallery__media-link)
   * ========================= */
  function initGalleryLightbox() {
    const galleries = document.querySelectorAll('[data-ae-vert-gallery]');
    if (!galleries.length) return;

    // Single reusable lightbox
    const lb = document.createElement('div');
    lb.className = 'ae-lightbox';
    lb.innerHTML = [
      '<div class="ae-lightbox__backdrop" data-ae-lb-close></div>',
      '<button class="ae-lightbox__nav ae-lightbox__prev" type="button" aria-label="Previous">‹</button>',
      '<button class="ae-lightbox__nav ae-lightbox__next" type="button" aria-label="Next">›</button>',
      '<div class="ae-lightbox__content">',
      '  <button class="ae-lightbox__close" type="button" aria-label="Close" data-ae-lb-close>&times;</button>',
      '  <img class="ae-lightbox__img" alt="">',
      '</div>',
    ].join('');
    document.body.appendChild(lb);

    const lbImg   = lb.querySelector('.ae-lightbox__img');
    const btnPrev = lb.querySelector('.ae-lightbox__prev');
    const btnNext = lb.querySelector('.ae-lightbox__next');

    let currentList = [];
    let currentIndex = 0;

    function openLightbox(list, startIndex) {
      currentList  = list || [];
      currentIndex = Math.max(0, Math.min(startIndex || 0, currentList.length - 1));
      if (!currentList.length) return;

      lbImg.src = currentList[currentIndex];
      lb.classList.add('is-open');
      document.documentElement.classList.add('ae-lb-open');
    }

    function closeLightbox() {
      lb.classList.remove('is-open');
      document.documentElement.classList.remove('ae-lb-open');
      lbImg.src = '';
      currentList = [];
      currentIndex = 0;
    }

    function showIndex(i) {
      if (!currentList.length) return;
      currentIndex = (i + currentList.length) % currentList.length;
      lbImg.src = currentList[currentIndex];
    }

    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-ae-lb-close]') || e.target === lb.querySelector('.ae-lightbox__backdrop')) {
        e.preventDefault();
        closeLightbox();
      }
    });
    btnPrev.addEventListener('click', function () { showIndex(currentIndex - 1); });
    btnNext.addEventListener('click', function () { showIndex(currentIndex + 1); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  showIndex(currentIndex - 1);
      if (e.key === 'ArrowRight') showIndex(currentIndex + 1);
    });

    // Delegate from each gallery main area
    galleries.forEach(function (wrap) {
      const mainWrap = wrap.querySelector('[data-ae-vert-main]');
      if (!mainWrap) return;

      mainWrap.addEventListener('click', function (e) {
        const a = e.target.closest('.product-gallery__media-link');
        if (!a) return;
        e.preventDefault();

        const anchors = Array.from(mainWrap.querySelectorAll('.ae-vert-slide .product-gallery__media-link'));
        const list    = anchors.map(el => el.getAttribute('href')).filter(Boolean);
        const clickedIndex = Math.max(0, anchors.indexOf(a));

        openLightbox(list, clickedIndex);
      });
    });
  }

  /* =========================
   * Main viewer arrows (prev/next without opening lightbox)
   * ========================= */
  function initMainViewerArrows() {
    document.querySelectorAll('[data-ae-vert-gallery]').forEach(function (wrap) {
      const thumbsWrap = wrap.querySelector('[data-ae-vert-thumbs]');
      const mainWrap   = wrap.querySelector('[data-ae-vert-main]');
      if (!thumbsWrap || !mainWrap) return;

      function getSlideIds() {
        return Array.from(mainWrap.querySelectorAll('.ae-vert-slide'))
          .map(s => s.getAttribute('data-ae-slide-id'));
      }
      function getCurrentIndex() {
        const slides = Array.from(mainWrap.querySelectorAll('.ae-vert-slide'));
        const idx = slides.findIndex(s => !s.classList.contains('is-hidden'));
        return idx < 0 ? 0 : idx;
      }
      function showIndex(idx) {
        const ids = getSlideIds();
        if (!ids.length) return;
        idx = (idx + ids.length) % ids.length;
        const slides = Array.from(mainWrap.querySelectorAll('.ae-vert-slide'));
        slides.forEach((outer, i) => {
          const on = i === idx;
          outer.classList.toggle('is-hidden', !on);
          const inner = outer.querySelector('[data-product-single-media-wrapper]');
          if (inner) {
            inner.classList.toggle('media--hidden', !on);
            inner.style.display = on ? 'block' : 'none';
          }
        });
        const thumbs = Array.from(thumbsWrap.querySelectorAll('.ae-vert-thumb'));
        thumbs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
      }

      if (!mainWrap.querySelector('.ae-main-prev')) {
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'ae-main-nav ae-main-prev';
        prevBtn.setAttribute('aria-label', 'Previous image');
        prevBtn.textContent = '‹';

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'ae-main-nav ae-main-next';
        nextBtn.setAttribute('aria-label', 'Next image');
        nextBtn.textContent = '›';

        mainWrap.appendChild(prevBtn);
        mainWrap.appendChild(nextBtn);

        prevBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); showIndex(getCurrentIndex() - 1); });
        nextBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); showIndex(getCurrentIndex() + 1); });

        document.addEventListener('keydown', function (e) {
          if (document.documentElement.classList.contains('ae-lb-open')) return; // lightbox owns arrows
          if (!wrap.isConnected) return;
          if (e.key === 'ArrowLeft')  { e.preventDefault(); showIndex(getCurrentIndex() - 1); }
          if (e.key === 'ArrowRight') { e.preventDefault(); showIndex(getCurrentIndex() + 1); }
        });
      }
    });
  }

  /* =========================
   * Tabs: convert accordions to 2-per-row tab groups
   * ========================= */
  const CHUNK_SIZE = 2; // tabs per row

  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function buildGroup(container, items, groupIndex) {
    if (!items.length) return;

    // Build tab strip
    const tabsWrap = document.createElement('div');
    tabsWrap.className = 'ae-tabs ae-tabs--group';
    const tablist = document.createElement('div');
    tablist.className = 'ae-tablist';
    tablist.setAttribute('role', 'tablist');
    tabsWrap.appendChild(tablist);

    container.insertBefore(tabsWrap, items[0]);

    const tabs = [];

    items.forEach((item, i) => {
      const titleBtn = item.querySelector('button[aria-controls], .product__accordion__title, .accordion__header, summary');
      if (!titleBtn) return;

      // find panel
      let panel = null;
      const controls = titleBtn.getAttribute('aria-controls') || titleBtn.dataset?.controls;
      if (controls) panel = document.getElementById(controls);
      if (!panel) {
        panel = item.querySelector('.product__accordion__content, .accordion__content, [data-collapsible-content]') ||
                (titleBtn.tagName.toLowerCase() === 'summary' ? titleBtn.nextElementSibling : null);
      }
      if (!panel) return;

      if (!panel.id) panel.id = `ae-tabpanel-g${groupIndex}-${i}-${Math.random().toString(36).slice(2)}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `ae-tab-g${groupIndex}-${i}`);
      panel.classList.add('ae-tabpanel');

      // hide original header
      titleBtn.style.display = 'none';

      // clean any collapse leftovers
      panel.hidden = false;
      ['max-height','height','overflow','opacity','visibility','display'].forEach(p => panel.style.removeProperty(p));

      const tabBtn = document.createElement('button');
      tabBtn.className = 'ae-tab';
      tabBtn.id = `ae-tab-g${groupIndex}-${i}`;
      tabBtn.setAttribute('role', 'tab');
      tabBtn.setAttribute('aria-controls', panel.id);
      tabBtn.setAttribute('aria-selected', tabs.length === 0 ? 'true' : 'false');
      tabBtn.setAttribute('tabindex', tabs.length === 0 ? '0' : '-1');
      tabBtn.textContent = (titleBtn.textContent || 'Tab').trim();
      tablist.appendChild(tabBtn);

      tabs.push({ tabBtn, panel, titleBtn });

      tabBtn.addEventListener('click', () => activate(i));
      tabBtn.addEventListener('keydown', (e) => {
        const n = tabs.length;
        if (e.key === 'ArrowRight') { e.preventDefault(); activate((i + 1) % n, true); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); activate((i - 1 + n) % n, true); }
        if (e.key === 'Home')       { e.preventDefault(); activate(0, true); }
        if (e.key === 'End')        { e.preventDefault(); activate(n - 1, true); }
      });
    });

    if (!tabs.length) return;

    function activate(which, focus = false) {
      tabs.forEach(({ tabBtn, panel, titleBtn }, j) => {
        const on = j === which;
        tabBtn.setAttribute('aria-selected', on ? 'true' : 'false');
        tabBtn.setAttribute('tabindex', on ? '0' : '-1');
        panel.classList.toggle('is-active', on);
        panel.style.display = on ? '' : 'none';
        if (titleBtn && titleBtn.hasAttribute('aria-expanded')) {
          titleBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
      });

      // After switching, ensure any clamped text in this group expands
      expandToggleEllipsisMeasured(container);

      if (focus) tabs[which].tabBtn.focus();
    }

    // init group
    activate(0, false);
  }

  function buildTabs(root) {
    if (!root) return;
    const wrapper = root.querySelector('.form__wrapper') || root;
    if (wrapper.classList.contains('ae-tabs-mode')) return;

    const items = Array.from(wrapper.querySelectorAll('.product__block.product__accordions'));
    if (items.length < 2) return;

    wrapper.classList.add('ae-tabs-mode');
    const groups = chunk(items, CHUNK_SIZE);
    groups.forEach((gItems, gIdx) => buildGroup(gItems[0].parentNode, gItems, gIdx));
    expandToggleEllipsisMeasured(wrapper);
  }

  function initTabs() {
    const root = document.querySelector('.product-single__details');
    if (root) buildTabs(root);
  }
  window.AE_tabsInit = initTabs;

  /* =========================
   * Measured expansion for <toggle-ellipsis> inside tabs
   * ========================= */
  function expandToggleEllipsisMeasured(scope) {
    const root = scope || document;
    root.querySelectorAll('.ae-tabs-mode .ae-tabpanel toggle-ellipsis').forEach(el => {
      const content = el.querySelector('.toggle-ellipsis__content') || el;
      const naturalH = Math.max(content.scrollHeight, Math.ceil(content.getBoundingClientRect().height));
      if (Number.isFinite(naturalH) && naturalH > 0) {
        el.style.setProperty('--height', naturalH + 'px');
      }
      el.setAttribute('aria-expanded', 'true');
      el.classList.add('is-expanded');
      el.classList.remove('is-enabled', 'is-collapsed');
      el.style.removeProperty('height');
      el.style.removeProperty('max-height');
      el.style.overflow = 'visible';

      if (content) {
        content.style.removeProperty('max-height');
        content.style.removeProperty('height');
        content.style.overflow = 'visible';
        content.style.removeProperty('-webkit-line-clamp');
        content.style.removeProperty('-webkit-box-orient');
      }

      // Remove controls
      el.querySelectorAll('.toggle-ellipsis__actions, .toggle-ellipsis__button, .toggle-ellipsis__more, .toggle-ellipsis__less')
        .forEach(n => n.remove());
    });

    // Safety: ensure page scrolling is not locked
    document.documentElement.classList.remove('ae-lb-open');
  }
  window.AE_expandTabsMeasured = () => expandToggleEllipsisMeasured(document);

  /* =========================
   * Init (robust but not spammy)
   * ========================= */
  function initAll() {
    initVerticalGalleries();
    initMainViewerArrows();
    initGalleryLightbox();
    initTabs();
    expandToggleEllipsisMeasured(document);
  }

  onReady(initAll);
  window.addEventListener('load', () => expandToggleEllipsisMeasured(document));
  document.addEventListener('shopify:section:load', initAll);
})();
