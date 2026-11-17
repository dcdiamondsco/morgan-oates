/* Morgan Oates — small progressive enhancements. No libraries. */
(function () {
  'use strict';
  var d = document;

  /* Every page opens at the true top, including bfcache restores. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var pageTop = function () {
    d.documentElement.scrollTop = 0;
    if (d.body) d.body.scrollTop = 0;
    window.scrollTo(0, 0);
  };
  pageTop();
  window.addEventListener('pageshow', function () {
    pageTop();
    requestAnimationFrame(pageTop);
  });
  window.addEventListener('load', function () { requestAnimationFrame(pageTop); }, { once: true });

  /* Lock only the Team backdrop against Safari toolbar resizing. */
  if (d.querySelector('.about')) {
    var lockTeamViewport = function () {
      d.documentElement.style.setProperty('--team-vh', window.innerHeight + 'px');
    };
    lockTeamViewport();
    window.addEventListener('pageshow', lockTeamViewport);
    window.addEventListener('orientationchange', function () {
      window.setTimeout(lockTeamViewport, 350);
    });
  }

  /* mobile menu */
  var btn = d.querySelector('button.menu-btn'), nav = d.getElementById('site-nav');
  if (btn && nav) {
    var setOpen = function (o) { nav.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', String(o)); btn.querySelector('.menu-btn__t').textContent = 'Menu'; };
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); } });
  }

  /* launch-hold: only Contact (and tel/mail/WhatsApp) links go anywhere */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (/^(tel:|mailto:|https?:\/\/wa\.me)/.test(h) || /contact|west-london-landscape-gardeners|before-and-after|projects/.test(h) || h.charAt(0) === '#' || a.classList.contains('logo')) return;
    e.preventDefault();
  });


  /* gentle image reveals */
  var els = [].slice.call(d.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  /* film: third-party player loads only after the visitor presses play */
  d.querySelectorAll('.film__player[data-vimeo]').forEach(function (box) {
    var b = box.querySelector('.film__btn');
    if (!b) return;
    b.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + box.getAttribute('data-vimeo') + '?dnt=1&autoplay=1';
      f.title = 'Creating an Oasis of Peace (Vimeo)';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      box.replaceChild(f, b); f.focus();
    });
  });

  /* enquiry form: honest status handling */
  var form = d.getElementById('enquiry');
  if (form) {
    var status = d.getElementById('form-status');
    var rules = {
      phone: function (v) { return v.replace(/[^0-9+]/g, '').length >= 7 ? '' : 'Please add your phone number.'; },
      email: function (v) { return !v.trim() ? 'Please enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'That email address doesn’t look right. Please check it.'; },
      message: function (v) { return v.trim() ? '' : 'Please tell us a little about the work you would like.'; }
    };
    var ids = { phone: 'phone', email: 'email', message: 'msg' };
    var check = function (k) {
      var inp = form.elements[k], err = d.getElementById('e-' + ids[k]), m = rules[k](inp.value);
      err.hidden = !m; err.textContent = m; inp.setAttribute('aria-invalid', m ? 'true' : 'false'); return m;
    };
    Object.keys(rules).forEach(function (k) { form.elements[k].addEventListener('blur', function () { check(k); }); });
    var fi = d.getElementById('f-img'), fl = d.getElementById('h-img'), fe = d.getElementById('e-img'), fdef = fl ? fl.textContent : '';
    if (fi) fi.addEventListener('change', function () {
      var fs = Array.prototype.slice.call(fi.files), bad = '';
      if (fs.length > 5) bad = 'Please choose up to 5 images.';
      else if (fs.some(function (f) { return f.size > 10 * 1024 * 1024; })) bad = 'Each image must be under 10 MB.';
      if (bad) { fi.value = ''; fe.hidden = false; fe.textContent = bad; fl.textContent = fdef; return; }
      fe.hidden = true; fl.textContent = fs.length ? fs.map(function (f) { return f.name; }).join(', ') : fdef;
    });
    var say = function (cls, html) { status.innerHTML = '<div class="msg ' + cls + '">' + html + '</div>'; status.focus(); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).filter(function (k) { return check(k); });
      if (bad.length) { form.elements[bad[0]].focus(); say('msg--err', '<p><strong>Please fix ' + (bad.length === 1 ? 'one thing' : bad.length + ' things') + ' before sending.</strong> Details are beside each field.</p>'); return; }
      if (form.elements.website.value) return; /* honeypot */
      var ep = form.getAttribute('data-endpoint'), email = form.getAttribute('data-email'), phone = form.getAttribute('data-phone');
      var fd = new FormData(form);
      if (!ep) {
        var body = 'Phone: ' + fd.get('phone') + '\nEmail: ' + fd.get('email') + '\n\n' + fd.get('message');
        var mt = 'mailto:' + email + '?subject=' + encodeURIComponent('Garden enquiry') + '&body=' + encodeURIComponent(body);
        say('', '<p><strong>Nothing has been sent yet.</strong> This form isn’t connected to a sending service on this version of the website.</p><p><a href="' + mt + '">Open your email app with this message ready to send</a>, or email <a href="mailto:' + email + '">' + email + '</a> or call ' + phone + '.</p>' + (fi && fi.files.length ? '<p>Photos can’t be attached from here, so please attach them to your email.</p>' : ''));
        return;
      }
      var sb = form.querySelector('button[type=submit]'); sb.disabled = true; sb.textContent = 'Sending…';
      fetch(ep, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset(); say('', '<p><strong>Thank you. Your message has been sent.</strong></p><p>We will reply to talk it through.</p>');
      }).catch(function () {
        say('msg--err', '<p><strong>Your message could not be sent.</strong></p><p>Please email <a href="mailto:' + email + '">' + email + '</a> or call ' + phone + '.</p>');
      }).then(function () { sb.disabled = false; sb.textContent = 'Send enquiry'; });
    });
  }
})();

/* hero video: respect reduced motion (shows first frame only) */
(function(){var v=document.querySelector('.stage__video');if(!v)return;
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){v.removeAttribute('autoplay');v.pause();}})();
/* Team and Contact: gentle reveal on scroll (skipped for reduced motion) */
(function(){
  try{
    var els=document.querySelectorAll('.about__intro,.apanel--m,.about__more>*,.about__cta,.stage__in--form .cform,.stage__in--form .cdiscuss');
    if(!els.length||!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(el){el.classList.add('rv');io.observe(el);});
  }catch(_){}
})();


/* Before / after sliders */
(function(){
  try{
    document.querySelectorAll('.ba__cmp').forEach(function(c){
      var r=c.querySelector('.ba__range');if(!r)return;var hide=function(){c.classList.add('ba--used')};r.addEventListener('input',hide,{once:true});r.addEventListener('pointerdown',hide,{once:true});
      var set=function(){c.style.setProperty('--p',r.value+'%');};
      r.addEventListener('input',set);set();
    });
  }catch(_){}
})();


/* footer overlaps the closing photo: tell CSS how tall it is */
(function(){
  try{
    var f=document.querySelector('footer.footer--compact');if(!f||!document.querySelector('.close'))return;
    var set=function(){document.documentElement.style.setProperty('--fh',f.offsetHeight+'px');};
    set();addEventListener('resize',set);addEventListener('load',set);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(set);
  }catch(_){}
})();


/* full-screen gallery */
(function () {
  var gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  var slides = Array.prototype.slice.call(gallery.querySelectorAll('[data-gallery-slide]'));
  var dots = Array.prototype.slice.call(gallery.querySelectorAll('[data-gallery-go]'));
  var current = gallery.querySelector('[data-gallery-current]');
  var pause = gallery.querySelector('[data-gallery-pause]');
  var index = 0, timer = null, paused = false, delay = 7500, firstDelay = 3500, firstAdvancePending = true;
  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      var active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach(function (dot, i) {
      var active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', String(active));
    });
    if (current) current.textContent = String(index + 1);
  }
  function stop() { if (timer) window.clearTimeout(timer); timer = null; }
  function start() {
    stop();
    if (!paused && slides.length > 1) {
      var wait = firstAdvancePending && index === 0 ? firstDelay : delay;
      timer = window.setTimeout(function () {
        firstAdvancePending = false;
        show(index + 1);
        start();
      }, wait);
    }
  }
  gallery.querySelector('[data-gallery-prev]').addEventListener('click', function () { show(index - 1); start(); });
  gallery.querySelector('[data-gallery-next]').addEventListener('click', function () { show(index + 1); start(); });
  dots.forEach(function (dot) { dot.addEventListener('click', function () { show(Number(dot.getAttribute('data-gallery-go'))); start(); }); });
  pause.addEventListener('click', function () {
    paused = !paused;
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Play' : 'Pause';
    paused ? stop() : start();
  });
  gallery.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { show(index - 1); start(); }
    if (e.key === 'ArrowRight') { show(index + 1); start(); }
  });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  show(0); start();
}());
