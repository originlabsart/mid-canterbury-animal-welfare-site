/* Mid Canterbury Animal Welfare Centre · "Plains to peaks"
   Shared: header, mobile menu, depth parallax (one rAF scroll loop, transforms only).
   Home only (each guarded): year plates, altitude rail, nor'wester toggle, braided-river tabs, letterbox, summit. */
(function () {
  'use strict';
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = reduceMq.matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------- header + mobile menu */
  var bar = $('[data-bar]');
  var menuBtn = $('[data-menu]');
  var nav = $('#site-nav');
  function setMenu(open, refocus) {
    if (!menuBtn) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('[data-menu-label]').textContent = open ? 'Close' : 'Menu';
    bar.classList.toggle('menu-open', open);
    if (!open && refocus) menuBtn.focus();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------------------------------------------------------- depth parallax
     data-par = k. Screen speed of a layer = 1 + k: negative k lags (far: sky and peaks), small negative k
     is the plains, positive k runs ahead (near: tussock and fence). Clamped so the spare edges never show. */
  var pars = $$('[data-par]').map(function (el) {
    var k = parseFloat(el.dataset.par);
    return { el: el, sec: el.closest('.band, .gate, .pk-stage, .page-head, .hero, section, footer'), k: k, lim: parseFloat(el.dataset.lim || (k > 0 ? 90 : 64)) };
  });

  /* ---------------------------------------------------------- who we are: one photographic plate per year (home) */
  var who = $('.who');
  var plates = who && $('.plates', who);
  var years = who ? $$('.years li', who) : [];
  var era = who && $('[data-era]', who);
  var eras = ['2000', '2017', 'Today'];
  var lastStage = -1;
  function whoFrame(vh) {
    if (!who) return;
    var p = 1;
    var r = who.getBoundingClientRect();
    var travel = r.height - vh;
    var pinned = !reduce && travel > 200;
    if (pinned) p = clamp(-r.top / travel, 0, 1);
    var stage = !pinned ? 2 : (p < 0.38 ? 0 : p < 0.7 ? 1 : 2);
    var local = !pinned ? 1 : stage === 0 ? p / 0.38 : stage === 1 ? (p - 0.38) / 0.32 : (p - 0.7) / 0.3;
    plates.style.setProperty('--z', clamp(local, 0, 1).toFixed(3));
    if (stage !== lastStage) {
      lastStage = stage;
      who.dataset.stage = stage;
      era.textContent = eras[stage];
      years.forEach(function (li, i) {
        li.classList.toggle('on', pinned ? i === stage : true);
        li.classList.toggle('past', pinned && i < stage);
      });
    }
  }

  /* ---------------------------------------------------------- altitude rail: a levelling staff (home) */
  var alt = $('[data-alt]');
  var altLinks = alt ? $$('a[data-for]', alt) : [];
  var bands = [];
  var summit = false;
  if (alt) {
    var track = $('.alt-track', alt);
    bands = $$('.band').map(function (b) {
      var t = document.createElement('i'); t.className = 'alt-band'; t.setAttribute('aria-hidden', 'true');
      track.insertBefore(t, $('.alt-mark', track));
      return { el: b, tick: t };
    });
  }
  function placeRail() {
    if (!alt) return;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    bands.forEach(function (b) {
      var top = b.el.getBoundingClientRect().top + window.scrollY;
      b.tick.style.bottom = (clamp(top / max, 0, 1) * 100).toFixed(2) + '%';
    });
    altLinks.forEach(function (a) {
      var t = document.getElementById(a.dataset.for);
      if (!t) return;
      var top = a.dataset.for === 'foot' ? max : t.getBoundingClientRect().top + window.scrollY;
      a.style.bottom = (clamp(top / max, 0, 1) * 100).toFixed(2) + '%';
      a._at = top;
    });
  }
  function railFrame(y) {
    if (!alt) return;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    alt.style.setProperty('--p', (summit ? 1 : clamp(y / max, 0, 1)).toFixed(4));
    var here = null;
    altLinks.forEach(function (a) { if (y + window.innerHeight * 0.4 >= (a._at || 0)) here = a; });
    if (summit) here = altLinks[altLinks.length - 1];
    altLinks.forEach(function (a) { a.classList.toggle('here', a === here); });
    alt.classList.toggle('summit', summit);
  }

  /* ---------------------------------------------------------- the frame loop (scroll driven) */
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (bar) bar.classList.toggle('solid', y > 30);
    if (!reduce) {
      pars.forEach(function (p) {
        var r = p.sec.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var off = clamp((r.top + r.height / 2 - vh / 2) * p.k, -p.lim, p.lim);
        p.el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }
    whoFrame(vh);
    railFrame(y);
  }
  function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { placeRail(); request(); }, { passive: true });
  if (reduceMq.addEventListener) reduceMq.addEventListener('change', function (e) {
    reduce = e.matches;
    if (reduce) pars.forEach(function (p) { p.el.style.transform = ''; });
    lastStage = -1; request();
  });

  /* ---------------------------------------------------------- the cause: nor'wester toggle (home) */
  var wind = $('[data-wind]');
  if (wind) {
    var wbtn = $('[data-wind-toggle]', wind);
    var wl = $('[data-wl]', wind);
    wbtn.addEventListener('click', function () {
      var on = wbtn.getAttribute('aria-pressed') !== 'true';
      wbtn.setAttribute('aria-pressed', String(on));
      wind.classList.toggle('windy', on);
      wl.textContent = on ? 'blowing' : 'calm';
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { wind.classList.toggle('inview', e.isIntersecting); });
      }, { rootMargin: '100px' }).observe(wind);
    } else { wind.classList.add('inview'); }
  }

  /* ---------------------------------------------------------- how we help: braided river tabs (home) */
  var tabs = $$('.braid-tab');
  if (tabs.length) {
    var chans = $$('.chan');
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var pick = function (i, focus) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      chans.forEach(function (c) { c.classList.toggle('on', +c.dataset.ch === i); });
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, to = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % n;
        if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i - 1 + n) % n;
        if (k === 'Home') to = 0;
        if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); pick(to, true); }
      });
    });
    chans.forEach(function (c) { c.addEventListener('click', function () { pick(+c.dataset.ch); }); });
    pick(0);
  }

  /* ---------------------------------------------------------- ways to help: the letterbox (home) */
  var lb = $('.letterbox');
  if (lb) {
    var note = document.getElementById('note');
    lb.addEventListener('click', function () {
      var open = lb.getAttribute('aria-expanded') !== 'true';
      lb.setAttribute('aria-expanded', String(open));
      note.hidden = !open;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.getAttribute('aria-expanded') === 'true') { lb.click(); lb.focus(); }
    });
  }

  /* ---------------------------------------------------------- copy buttons (letterbox note, contact page) */
  $$('[data-copy]').forEach(function (copyBtn) {
    var live = $('[data-copied]', copyBtn.parentNode.parentNode) || $('[data-copied]');
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.dataset.copy;
      var label = copyBtn.textContent;
      var done = function () {
        copyBtn.textContent = 'Copied';
        if (live) live.textContent = 'Copied to the clipboard';
        setTimeout(function () { copyBtn.textContent = label; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      else {
        var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { /* ignore */ }
        ta.remove();
      }
    });
  });

  /* ---------------------------------------------------------- money chart: hover/focus readout (about) */
  $$('[data-chart]').forEach(function (chart) {
    var out = $('[data-readout]', chart);
    var cols = $$('.lv-col', chart);
    var def = out.innerHTML;
    var show = function (c) {
      cols.forEach(function (o) { o.classList.toggle('lit', o === c); });
      out.innerHTML = c ? c.dataset.say : def;
    };
    cols.forEach(function (c) {
      c.addEventListener('mouseenter', function () { show(c); });
      c.addEventListener('focus', function () { show(c); });
    });
    chart.addEventListener('mouseleave', function () { show(null); });
    chart.addEventListener('focusout', function (e) { if (!chart.contains(e.relatedTarget)) show(null); });
  });

  /* ---------------------------------------------------------- official partners: the rail tops out at the hut (home) */
  var hutSec = $('[data-summit]');
  if (alt && hutSec && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { summit = e.isIntersecting; request(); });
    }, { rootMargin: '-35% 0px -35% 0px' }).observe(hutSec);
  }

  placeRail();
  frame();
  window.addEventListener('load', function () { placeRail(); request(); });
})();
