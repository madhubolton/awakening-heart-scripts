/*--------------------------------------------------------------
  Awakening Heart : Metatron Ambient (shared)
  One animation, one look (Blue Aurora), used wherever the Metatron
  artwork appears as a living graphic: Home, Dashboard, Course pages,
  Audio viewer. Not related to the scene engine (ah-metatron.js).

  Usage
  - Place the shared Metatron component (wrapper class .metatron-svg
    containing the Facets / Paths / Portals SVG embeds) on the page.
  - Load gsap, then this file. It finds .metatron-svg and animates it.

  Attributes on the .metatron-svg wrapper
  - data-autoplay="false"  -> do not start on load (Audio viewer)

  API (window.AHMetatron)
  - play()    start / resume the animation
  - pause()   freeze it where it is (audio paused)
  - stop()    fade back to the resting state (audio ended)
  - rebind()  re-scan the DOM (if the artwork is added late)

  Behaviour
  - Respects prefers-reduced-motion (shows a still, resting frame)
  - Pauses automatically when off-screen or the tab is hidden
  Version: 1.0.0
--------------------------------------------------------------*/
(function () {
  'use strict';

  // ---- The one look: Blue Aurora -------------------------------
  var LOOK = {
    outerPortal:  { fill: '#4979f2', opacity: 0.7 },          // static
    innerPortal:  { fill: '#4979f2', dim: 0.25, bright: 0.9, duration: 5, stagger: 0.3 },
    centerPortal: { fill: '#995ac7', dim: 0.25, bright: 0.9, duration: 5 }, // reversed phase
    outerFacets:  { fill: '#3399ff', duration: 2.5, stagger: 0.15, delay: 1 },
    innerFacets:  { fill: '#33b8ff', duration: 2.5, stagger: 0.15, delay: 1.5 }
  };

  var instances = [];
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function shapeOf(el) {
    if (!el) return null;
    return el.tagName && el.tagName.toLowerCase() === 'g'
      ? el.querySelector('polygon, polyline, path, circle')
      : el;
  }

  function shapes(root, selector) {
    return Array.prototype.slice.call(root.querySelectorAll(selector))
      .map(shapeOf).filter(Boolean);
  }

  function build(root) {
    var outerPortals = shapes(root, '[id^="P_O"]');
    var innerPortals = shapes(root, '[id^="P_I"]');
    var centerPortal = shapes(root, '#P_C');
    var outerFacets  = shapes(root, '[id^="F_O_OCT_"]');
    var innerFacets  = shapes(root, '[id^="F_I_OCT_"]');

    var tl = gsap.timeline({ paused: true });

    // Static outer ring
    gsap.set(outerPortals, {
      fill: LOOK.outerPortal.fill, opacity: LOOK.outerPortal.opacity
    });

    // Resting state for the animated parts
    gsap.set(innerPortals, { fill: LOOK.innerPortal.fill, opacity: LOOK.innerPortal.dim });
    gsap.set(centerPortal, { fill: LOOK.centerPortal.fill, opacity: LOOK.centerPortal.bright });

    if (!reduced) {
      tl.to(innerPortals, {
        opacity: LOOK.innerPortal.bright,
        duration: LOOK.innerPortal.duration,
        ease: 'sine.inOut', repeat: -1, yoyo: true,
        stagger: LOOK.innerPortal.stagger
      }, 0);
      tl.to(centerPortal, {
        opacity: LOOK.centerPortal.dim,
        duration: LOOK.centerPortal.duration,
        ease: 'sine.inOut', repeat: -1, yoyo: true
      }, 0);
      tl.to(outerFacets, {
        fill: LOOK.outerFacets.fill,
        duration: LOOK.outerFacets.duration,
        ease: 'sine.inOut', repeat: -1, yoyo: true,
        stagger: LOOK.outerFacets.stagger
      }, LOOK.outerFacets.delay);
      tl.to(innerFacets, {
        fill: LOOK.innerFacets.fill,
        duration: LOOK.innerFacets.duration,
        ease: 'sine.inOut', repeat: -1, yoyo: true,
        stagger: LOOK.innerFacets.stagger
      }, LOOK.innerFacets.delay);
    }

    return tl;
  }

  function Instance(root) {
    var self = this;
    this.root = root;
    this.tl = build(root);
    this.wanted = root.getAttribute('data-autoplay') !== 'false'; // should be running
    this.onScreen = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        self.onScreen = entries[0].isIntersecting;
        self.sync();
      }).observe(root);
    }
    this.sync();
  }

  Instance.prototype.sync = function () {
    var run = this.wanted && this.onScreen && !document.hidden && !reduced;
    if (run) this.tl.play(); else this.tl.pause();
  };

  function scan() {
    var roots = document.querySelectorAll('.metatron-svg');
    Array.prototype.forEach.call(roots, function (root) {
      if (root.__ahMetatron) return;
      root.__ahMetatron = new Instance(root);
      instances.push(root.__ahMetatron);
    });
  }

  function each(fn) { instances.forEach(fn); }

  window.AHMetatron = {
    play:  function () { each(function (i) { i.wanted = true;  i.sync(); }); },
    pause: function () { each(function (i) { i.wanted = false; i.sync(); }); },
    stop:  function () {
      each(function (i) { i.wanted = false; i.tl.pause(); i.tl.time(0); });
    },
    rebind: scan
  };

  document.addEventListener('visibilitychange', function () {
    each(function (i) { i.sync(); });
  });

  function start() {
    if (typeof gsap === 'undefined') {
      console.warn('AHMetatron: gsap not found; load gsap before ah-metatron-ambient.js');
      return;
    }
    scan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
