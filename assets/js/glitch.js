// Lógica del tipeo + transición de glitch + flash.
// Exporta runTypewriterGlitch(el, finalText, opts, onDone)
(function(global){
  const DEFAULT_CHARS = '☺Σ×Π#-_¯—→↓↑←0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ';

  /**
   * @param {HTMLElement} el        Elemento donde se escribe
   * @param {string}      finalText Texto final (ej: "DEMA II III")
   * @param {object}      opts      {duration, tick, chars, glitchMs, flashEl, flashMs}
   * @param {function}    onDone    Callback al terminar (tras glitch)
   */
  function runTypewriterGlitch(el, finalText, opts = {}, onDone){
    const duration = opts.duration ?? 5000;
    const tick     = opts.tick ?? 50;
    const chars    = opts.chars ?? DEFAULT_CHARS;
    const glitchMs = opts.glitchMs ?? 450;
    const flashEl  = opts.flashEl ?? null;
    const flashMs  = opts.flashMs ?? 120;

    if(!el) return;
    clearIntervalsOn(el); // por si se reabre

    const start = Date.now();
    const arr   = finalText.split('');
    const len   = arr.length;

    el.style.opacity = '1';
    const intervalId = setInterval(()=>{
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      const reveal = Math.floor(p * len);

      let out = '';
      for(let i=0;i<len;i++){
        if(i < reveal){
          const jitter = (Math.random() < (0.05 * (1 - p)));
          out += jitter ? chars[Math.floor(Math.random()*chars.length)] : arr[i];
        }else{
          out += arr[i] === ' ' ? ' ' : chars[Math.floor(Math.random()*chars.length)];
        }
      }
      el.textContent = out;

      if(p >= 1){
        clearInterval(intervalId);
        el.textContent = finalText;
        el.dataset.text = finalText;

        // Flash CRT
        if(flashEl){
          flashEl.classList.add('show');
          setTimeout(()=> flashEl.classList.remove('show'), flashMs);
        }

        // Transición glitch centrada
        el.classList.add('glitch');
        setTimeout(()=>{
          el.classList.remove('glitch');
          el.style.opacity = '0';
          if(typeof onDone === 'function') onDone();
        }, glitchMs);
      }
    }, tick);

    // Guarda id para futuros clear si hace falta
    el._glitchIntervalId = intervalId;
  }

  function clearIntervalsOn(el){
    if(el && el._glitchIntervalId){
      clearInterval(el._glitchIntervalId);
      el._glitchIntervalId = null;
    }
  }

  // export
  global.runTypewriterGlitch = runTypewriterGlitch;
})(window);
