const rxjsSrc = 'https://unpkg.com/rxjs@^7/dist/bundles/rxjs.umd.min.js';

const loadScript1 = (src, callback) => {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = src;
  script.addEventListener('load', () => callback());
  document.head.appendChild(script);
};

const getResizeObservable = () => {
  const { BehaviorSubject, debounceTime } = rxjs;
  const resizeSubject = new BehaviorSubject({});
  const resizeObserver = new ResizeObserver(() => resizeSubject.next());
  resizeObserver.observe(document.body);
  return resizeSubject.pipe(debounceTime(500));
};

const getElLeft = el => {
  var rect = el.getBoundingClientRect();
  var docEl = document.documentElement;
  return rect.left + window.pageXOffset - docEl.clientLeft;
};

const handleColumnsWithSliderActive = resizeObservable => {
  const slider = document.querySelector('.custom-columns-with-slider .custom-grid');
  if (!slider) return;

  const left = document.querySelector('.custom-columns-with-slider .custom-action.left');
  const right = document.querySelector('.custom-columns-with-slider .custom-action.right');
  const leftMobile = document.querySelector('.custom-columns-with-slider .custom-actions-mobile .custom-action.left');
  const rightMobile = document.querySelector('.custom-columns-with-slider .custom-actions-mobile .custom-action.right');
  let leftSub;
  let rightSub;
  let leftMobileSub;
  let rightMobileSub;

  const { fromEvent } = rxjs;

  const handleResize = () => {
    resizeObservable.subscribe(() => {
      const title = document.querySelector('.custom-columns-with-slider .custom-columns-title ');
      if (!title) return;

      const padding = getElLeft(title);
      slider.style.padding = `0 ${padding}px`;

      leftSub ? leftSub.unsubscribe() : null;
      rightSub ? rightSub.unsubscribe() : null;
      leftMobileSub ? leftMobileSub.unsubscribe() : null;
      rightMobileSub ? rightMobileSub.unsubscribe() : null;

      handleMove(left, right, leftMobile, rightMobile);
    });
  };

  const handleMove = (left, right, leftMobile, rightMobile) => {
    const items = slider.querySelectorAll('.custom-grid-item');
    if (items.length < 2) return;
    const itemsGap = Math.abs(items[0].getBoundingClientRect().left - items[1].getBoundingClientRect().left);

    leftSub = fromEvent(left, 'click').subscribe(() => {
      slider.scrollBy({ left: -itemsGap, behavior: 'smooth' });
    });

    rightSub = fromEvent(leftMobile, 'click').subscribe(() => {
      slider.scrollBy({ left: -itemsGap, behavior: 'smooth' });
    });

    leftMobileSub = fromEvent(right, 'click').subscribe(() => {
      slider.scrollBy({ left: itemsGap, behavior: 'smooth' });
    });

    rightMobileSub = fromEvent(rightMobile, 'click').subscribe(() => {
      slider.scrollBy({ left: itemsGap, behavior: 'smooth' });
    });
  };

  handleResize();
};

const handleCustomImageWithText = resizeObservable => {
  const { fromEvent } = rxjs;

  let scrollSub;

  resizeObservable.subscribe(() => {
    if (scrollSub) scrollSub.unsubscribe();

    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const windowHeight = window.innerHeight;
    const rows = '.custom-feature-row.sticky';

    const resetStyles = () => {
      [...document.querySelectorAll(rows)].map(row => {
        const images = row.querySelector('.custom-images');
        images.style.removeProperty('position');
        images.style.removeProperty('left');
        images.style.removeProperty('width');
        images.style.removeProperty('top');
      });
    };

    const mapRows = () => {
      return [...document.querySelectorAll(rows)].map(row => {
        const isSticky = row.offsetHeight > windowHeight - headerHeight;
        const images = row.querySelector('.custom-images');
        if (!isSticky || !images) return { isSticky };

        const imagesPosition = images.getBoundingClientRect();
        const left = imagesPosition.left;
        const width = imagesPosition.width;

        return { element: row, isSticky, images, left, width };
      });
    };

    const setStyle = rowsMap => {
      rowsMap.forEach(row => {
        if (!row.isSticky) return;

        const text = row.element.querySelector('.feature-row__text');
        const imagesWrapper = row.element.querySelector('.item-wrapper');
        if (imagesWrapper.offsetHeight > text.offsetHeight) return;

        const elementRect = row.element.getBoundingClientRect();

        row.images.style.position = `fixed`;
        row.images.style.left = `${row.left}px`;
        row.images.style.width = `${row.width}px`;
        row.images.style.top = `${Math.max(headerHeight, elementRect.top)}px`;

        const imagesRect = row.images.getBoundingClientRect();
        const lowestImageBottom = Math.max(
          ...[...row.images.querySelectorAll('img')].map(img => img.getBoundingClientRect().bottom)
        );

        const isFixed = elementRect.bottom > lowestImageBottom;
        if (!isFixed) {
          row.images.style.top = `${elementRect.bottom - imagesRect.height + imagesRect.bottom - lowestImageBottom}px`;
        }
      });
    };

    resetStyles();
    if (window.innerWidth < 820) return;

    const rowsMap = mapRows();
    setStyle(rowsMap);

    scrollSub = fromEvent(document, 'scroll').subscribe(() => {
      setStyle(rowsMap);
    });
  });
};

const handleHeader = () => {
  const initialHeader = document.querySelector('header.site-header');
  const initialHeaderHeight = initialHeader ? initialHeader.offsetHeight : 0;

  const { fromEvent } = rxjs;

  let lastScrollTop = 0;

  fromEvent(document, 'scroll').subscribe(() => {
    const st = window.pageYOffset || document.documentElement.scrollTop;

    const headerWrapper = document.querySelector('.site-header-sticky');
    headerWrapper ? (headerWrapper.style.height = `${initialHeaderHeight}px`) : null;

    if (initialHeader && st > initialHeaderHeight) {
      initialHeader.classList.add('temp-hidden');
    }

    if (initialHeader && st <= initialHeaderHeight) {
      initialHeader.classList.remove('temp-hidden');
    }

    if (initialHeader && st > window.innerHeight / 2) {
      initialHeader.classList.remove('temp-hidden');
    }

    const header = document.querySelector('header.site-header--sticky');
    if (!header) return;

    if (st > lastScrollTop) {
      header.classList.remove('visible');

      // if (headerWrapper) {
      //   headerWrapper.style.removeProperty('height');
      // }
    } else {
      header.classList.add('visible');
    }
    lastScrollTop = st <= 0 ? 0 : st;
  });
};

document.addEventListener('DOMContentLoaded', () => {
  loadScript1(rxjsSrc, () => {
    const resizeObservable = getResizeObservable();

    handleColumnsWithSliderActive(resizeObservable);

    handleCustomImageWithText(resizeObservable);

    handleHeader();
  });
});
