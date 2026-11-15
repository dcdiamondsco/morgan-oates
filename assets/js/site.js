/* Morgan Oates — small progressive enhancements. No libraries. */
(function () {
  'use strict';
  var d = document;

  /* mobile menu */
  var btn = d.querySelector('button.menu-btn'), nav = d.getElementById('site-nav');
  if (btn && nav) {
    var setOpen = function (o) { nav.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', String(o)); btn.querySelector('.menu-btn__t').textContent = o ? 'Close' : 'Menu'; };
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); } });
  }

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
/* mobile home: open already scrolled so the browser bars tuck away over the photo */
(function(){try{
 if(document.querySelector('.stage__hl')||!document.querySelector('.header--over:not([hidden])')||!matchMedia('(max-width:899px)').matches)return;
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 var moved=false;addEventListener('touchstart',function(){moved=true},{passive:true});
 var go=function(){if(!moved&&window.scrollY<80)window.scrollTo(0,96)};
 go();addEventListener('DOMContentLoaded',go);addEventListener('load',go);
 [150,400,900].forEach(function(t){setTimeout(go,t)});
 addEventListener('pageshow',function(){setTimeout(go,50)});
}catch(e){}})();
