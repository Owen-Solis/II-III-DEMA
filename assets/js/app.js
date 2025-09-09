// Hotspots + tarjetas + modal (usa glitch.js)
(function(){
  const vbSize = 768;
  const canvas = document.getElementById('canvas');
  const svg = canvas.querySelector('svg');
  const hots = svg.querySelectorAll('.hot');

  function placeCard(card, cx, cy, r){
    const leftPct = (cx / vbSize) * 100;
    const topPct  = ((cy + r + 10) / vbSize) * 100;
    card.style.left = leftPct + '%';
    card.style.top  = topPct + '%';
  }

  function wire(h){
    const id = h.dataset.id;
    const circle = h.querySelector('circle');
    const cx = +circle.getAttribute('cx');
    const cy = +circle.getAttribute('cy');
    const r  = +circle.getAttribute('r');
    const card = document.getElementById('card-' + id);
    if(!card) return;

    placeCard(card, cx, cy, r);
    card.style.background = card.dataset.color || '#ffffff';

    const show = ()=>card.classList.add('show');
    const hide = ()=>card.classList.remove('show');
    h.addEventListener('mouseenter', show);
    h.addEventListener('mouseleave', hide);
    h.addEventListener('focus', show);
    h.addEventListener('blur', hide);

    h.setAttribute('tabindex','0');
    h.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' '){
        const a = card.querySelector('a');
        if(a) a.click();
        ev.preventDefault();
      }
    });
  }
  hots.forEach(wire);

  // ===== Modal: click anular derecho → tipeo 5s → glitch + flash → "?" =====
  (function(){
    const hotRing = document.getElementById('hot-right-ring');
    const modal   = document.getElementById('modal-corrupt');
    const typeEl  = document.getElementById('typeText');
    const qmEl    = document.getElementById('qm');
    const flashEl = document.getElementById('flash');
    if(!hotRing || !modal || !typeEl || !qmEl || !flashEl) return;

    const TARGET = 'DEMA II III';

    function open(){
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');

      // Reset visual
      typeEl.textContent = '';
      typeEl.dataset.text = '';
      typeEl.style.opacity = '1';
      qmEl.classList.remove('show');
      typeEl.classList.remove('glitch');
      flashEl.classList.remove('show');

      // Inicia el efecto con glitch.js
      window.runTypewriterGlitch(typeEl, TARGET, {
        duration: 5000,
        tick: 50,
        glitchMs: 450,
        flashEl: flashEl,
        flashMs: 120
      }, ()=>{
        // cuando termina el glitch, mostramos la interrogación
        qmEl.classList.add('show');
      });
    }

    function close(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      // reset
      typeEl.textContent = '';
      typeEl.dataset.text = '';
      typeEl.classList.remove('glitch');
      qmEl.classList.remove('show');
      flashEl.classList.remove('show');
    }

    hotRing.addEventListener('click', (e)=>{ e.preventDefault(); open(); });
    modal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
  })();
})();
