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

  function openCardLink(id){
    const card = document.getElementById('card-' + id);
    if(!card) return;
    const a = card.querySelector('a[href]');
    if(a && a.href){
      // Los dedos abren en nueva pestaña (como tenías)
      window.open(a.href, '_blank', 'noopener');
    }
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

    // Hover/focus para mostrar tarjeta
    h.addEventListener('mouseenter', show);
    h.addEventListener('mouseleave', hide);
    h.addEventListener('focus', show);
    h.addEventListener('blur', hide);

    // Abrir link con Enter/Espacio (accesibilidad)
    h.setAttribute('tabindex','0');
    h.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' '){
        ev.preventDefault();
        if(id === 'right-ring'){
          // el anular derecho lo maneja el modal
          openModal();
        }else{
          openCardLink(id);
        }
      }
    });

    // Click directo en el dedo abre link (excepto anular derecho)
    h.addEventListener('click', (ev)=>{
      ev.preventDefault();
      if(id === 'right-ring'){
        openModal();
      }else{
        openCardLink(id);
      }
    });
  }
  hots.forEach(wire);

  // ===== Modal: click anular derecho → tipeo + glitch + flash → "?" =====
  let openModal; // la definimos antes para usarla arriba
  (function(){
    const hotRing = document.getElementById('hot-right-ring');
    const modal   = document.getElementById('modal-corrupt');
    const typeEl  = document.getElementById('typeText');
    const qmEl    = document.getElementById('qm');   // <button>
    const flashEl = document.getElementById('flash');
    if(!modal || !typeEl || !qmEl || !flashEl) return;

    const TARGET_TEXT = 'II III DEMA';
    const LINK = qmEl.dataset.href || 'https://ejemplo.com';

    openModal = function(){
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');

      // Reset
      typeEl.textContent = '';
      typeEl.dataset.text = '';
      typeEl.style.opacity = '1';
      typeEl.classList.remove('glitch');

      qmEl.classList.remove('show');
      flashEl.classList.remove('show');
      flashEl.style.opacity = '0';

      // Animación de tipeo + glitch
      window.runTypewriterGlitch(typeEl, TARGET_TEXT, {
        duration: 2500,  // velocidad del tipeo
        tick: 40,
        glitchMs: 450,
        flashEl: flashEl,
        flashMs: 120
      }, ()=>{
        qmEl.classList.add('show');
        qmEl.focus();
      });
    };

    function close(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      typeEl.textContent = '';
      typeEl.dataset.text = '';
      typeEl.classList.remove('glitch');
      qmEl.classList.remove('show');
      flashEl.classList.remove('show');
      flashEl.style.opacity = '0';
    }

    // Cerrar
    modal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });

    // Click del botón "?" → abrir en la MISMA pestaña
    qmEl.addEventListener('click', ()=>{
      window.location.href = LINK;  // ✅ navega en la misma pestaña
    });
    qmEl.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' '){
        ev.preventDefault();
        window.location.href = LINK; // ✅ misma pestaña también por teclado
      }
    });
  })();
})();
