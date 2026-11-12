/* Morgan Oates — small progressive enhancements. No libraries. */
(function () {
  'use strict';
  var d = document;

  /* mobile menu */
  var btn = d.querySelector('.menu-btn'), nav = d.getElementById('site-nav');
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
      name: function (v) { return v.trim() ? '' : 'Please enter your name.'; },
      email: function (v) { return !v.trim() ? 'Please enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'That email address doesn’t look right. Please check it.'; },
      location: function (v) { return v.trim() ? '' : 'Please tell us where the garden is.'; },
      message: function (v) { return v.trim() ? '' : 'Please tell us a little about the project.'; }
    };
    var ids = { name: 'name', email: 'email', location: 'loc', message: 'msg' };
    var check = function (k) {
      var inp = form.elements[k], err = d.getElementById('e-' + ids[k]), m = rules[k](inp.value);
      err.hidden = !m; err.textContent = m; inp.setAttribute('aria-invalid', m ? 'true' : 'false'); return m;
    };
    Object.keys(rules).forEach(function (k) { form.elements[k].addEventListener('blur', function () { check(k); }); });
    var say = function (cls, html) { status.innerHTML = '<div class="msg ' + cls + '">' + html + '</div>'; status.focus(); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).filter(function (k) { return check(k); });
      if (bad.length) { form.elements[bad[0]].focus(); say('msg--err', '<p><strong>Please fix ' + (bad.length === 1 ? 'one thing' : bad.length + ' things') + ' before sending.</strong> Details are beside each field.</p>'); return; }
      if (form.elements.website.value) return; /* honeypot */
      var ep = form.getAttribute('data-endpoint'), email = form.getAttribute('data-email'), phone = form.getAttribute('data-phone');
      var fd = new FormData(form);
      if (!ep) {
        var body = 'Name: ' + fd.get('name') + '\nEmail: ' + fd.get('email') + '\nPhone: ' + (fd.get('phone') || '') + '\nLocation: ' + fd.get('location') + '\nInterested in: ' + (fd.get('service') || 'Not sure yet') + '\n\n' + fd.get('message');
        var mt = 'mailto:' + email + '?subject=' + encodeURIComponent('Garden enquiry') + '&body=' + encodeURIComponent(body);
        say('', '<p><strong>Nothing has been sent yet.</strong> This form isn’t connected to a sending service on this version of the website.</p><p><a href="' + mt + '">Open your email app with this message ready to send</a>, or email <a href="mailto:' + email + '">' + email + '</a> or call ' + phone + '.</p>');
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
