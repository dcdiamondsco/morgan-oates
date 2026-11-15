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

  /* launch-hold: only Contact (and tel/mail/WhatsApp) links go anywhere */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (/^(tel:|mailto:|https?:\/\/wa\.me)/.test(h) || /contact/.test(h) || h.charAt(0) === '#') return;
    e.preventDefault();
  });



  /* edge strips follow the top and bottom colours of the photo currently showing */
  (function(){
    var imgs=[].slice.call(d.querySelectorAll('.stage__slide'));
    if(!imgs.length||!matchMedia('(max-width:899px)').matches)return;
    var top=d.createElement('div'),bot=d.createElement('div'),t0=Date.now(),cols=[],root=d.documentElement;
    top.className='edge edge--t';bot.className='edge edge--b';top.setAttribute('aria-hidden','true');bot.setAttribute('aria-hidden','true');
    d.body.appendChild(top);d.body.appendChild(bot);
    function avg(img,y0,y1,k){var c=d.createElement('canvas');c.width=16;c.height=8;var x=c.getContext('2d');
      x.drawImage(img,0,img.naturalHeight*y0,img.naturalWidth,img.naturalHeight*(y1-y0),0,0,16,8);
      var a=x.getImageData(0,0,16,8).data,r=0,g=0,b=0,n=a.length/4;for(var i=0;i<a.length;i+=4){r+=a[i];g+=a[i+1];b+=a[i+2];}
      return 'rgb('+Math.round(r/n*k)+','+Math.round(g/n*k)+','+Math.round(b/n*k)+')';}
    function go(){try{imgs.forEach(function(im,i){cols[i]={t:avg(im,.30,.42,.8),b:avg(im,.62,.74,.6)};});}catch(e){return;}
      function tick(){var n=imgs.length,i=Math.floor(((Date.now()-t0)/1000+1.7)/7)%n;if(i<0)i+=n;var c=cols[i];if(!c)return;
        top.style.backgroundColor=c.t;bot.style.backgroundColor=c.b;root.style.backgroundColor=c.t;}
      tick();setInterval(tick,500);}
    var left=imgs.length;imgs.forEach(function(im){im.loading='eager';if(im.complete&&im.naturalWidth){left--;}else{im.addEventListener('load',function(){if(--left===0)go();});}});
    if(left===0)go();
  })();


  /* mobile home: start in the middle of a long page and quietly re-centre when scrolling stops, so the bars always have photo above and below */
  (function(){
    if(!d.querySelector('.stage__hl')||!matchMedia('(max-width:899px)').matches)return;
    if('scrollRestoration' in history)history.scrollRestoration='manual';
    var de=d.documentElement,t;
    function range(){return de.scrollHeight-innerHeight;}
    function mid(){window.scrollTo(0,Math.round(range()/2));}
    mid();addEventListener('load',mid);addEventListener('pageshow',mid);
    addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){var r=range(),y=window.scrollY;if(y<r*.25||y>r*.75)mid();},180);},{passive:true});
  })();

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
