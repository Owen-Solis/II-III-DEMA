/* bonus.js — optimizado + efecto de letras aleatorias con auto-pause */

(function () {
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('playBtn');
  const muteBtn = document.getElementById('muteBtn');
  const seek = document.getElementById('seek');
  const vol = document.getElementById('vol');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const viz = document.getElementById('viz');
  const liteBadge = document.getElementById('liteBadge');
  const titleChaos = document.getElementById('titleChaos');

  // ====== Performance switches ======
  const isSmall = matchMedia('(max-width:520px)').matches;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowMem = (navigator.deviceMemory && navigator.deviceMemory <= 4);

  // Modo lite por defecto en móvil / poca memoria / reduce motion
  let LITE = isSmall || lowMem || prefersReduced;
  liteBadge.hidden = !LITE;

  // ====== AudioContext lazy ======
  let ctx, analyser, srcNode, rafId;
  let audioReady = false;
  let isPlaying = false;

  // ====== Canvas setup ======
  const prCap = LITE ? 1 : Math.min(devicePixelRatio || 1, 1.5);
  const g = viz.getContext('2d', { alpha:false, desynchronized:true });

  function resizeCanvas() {
    const w = viz.clientWidth;
    const h = viz.clientHeight;
    viz.width = Math.max(1, Math.floor(w * prCap));
    viz.height = Math.max(1, Math.floor(h * prCap));
  }
  resizeCanvas();
  addEventListener('resize', resizeCanvas, { passive:true });

  // ====== Visualizer params (rojo) ======
  let FFT_SIZE  = LITE ? 256 : 512;
  let SMOOTHING = LITE ? 0.82 : 0.78;
  let FPS       = LITE ? 24 : 45;
  let frameInt  = 1000 / FPS;
  let lastDraw  = performance.now();
  const BIN_STEP = LITE ? 3 : 2;

  // Colores desde CSS vars
  const styles = getComputedStyle(document.documentElement);
  const ACCENT   = styles.getPropertyValue('--accent').trim()   || '#ff2d4d';
  const ACCENT2  = styles.getPropertyValue('--accent-2').trim() || '#a3001b';

  function lerpColor(c1, c2, t) {
    const p = s => parseInt(s.replace('#',''), 16);
    const a = p(c1), b = p(c2);
    const r = (x)=> (x>>16)&255, gC=(x)=> (x>>8)&255, bl=(x)=> x&255;
    const rr = (r(a)+(r(b)-r(a))*t)|0;
    const gg = (gC(a)+(gC(b)-gC(a))*t)|0;
    const bb = (bl(a)+(bl(b)-bl(a))*t)|0;
    return `rgb(${rr},${gg},${bb})`;
  }

  async function ensureAudio() {
    if (audioReady) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;

    srcNode = ctx.createMediaElementSource(audio);
    srcNode.connect(analyser);
    analyser.connect(ctx.destination);

    audioReady = true;
  }

  const dataArray = () => new Uint8Array(analyser.frequencyBinCount);

  function draw(now) {
    if ((now - lastDraw) < frameInt) {
      rafId = requestAnimationFrame(draw);
      return;
    }
    lastDraw = now;

    const w = viz.width, h = viz.height;
    g.fillStyle = '#080006';
    g.fillRect(0,0,w,h);

    if (!analyser) { rafId = requestAnimationFrame(draw); return; }

    const arr = dataArray();
    analyser.getByteFrequencyData(arr);

    const bins = arr.length;
    const usable = Math.floor(bins / BIN_STEP);
    const gap = 1 * prCap;
    const barW = Math.max(1, (w / usable) - gap);

    let x = 0;
    for (let i = 0; i < bins; i += BIN_STEP) {
      const v = arr[i] / 255;            // 0..1
      const barH = Math.max(1, v * (h - 2));
      const t = i / bins;
      g.fillStyle = lerpColor(ACCENT2, ACCENT, t);
      g.fillRect(x, h - barH, barW, barH);
      x += barW + gap;
    }

    rafId = requestAnimationFrame(draw);
  }

  function startViz() {
    if (rafId) cancelAnimationFrame(rafId);
    lastDraw = performance.now();
    rafId = requestAnimationFrame(draw);
  }
  function stopViz() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    g.fillStyle = '#080006';
    g.fillRect(0,0,viz.width,viz.height);
  }

  // Pausa animación cuando no está visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopViz();
      pauseChaos();
    } else {
      if (isPlaying && !LITE) startViz();
      if (!LITE) startChaos();
    }
  });

  // ==============================
  // Efecto de letras aleatorias 🅒
  // ==============================
  const CHAOS_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,./<>?';
  const CHAOS_FPS = 20; // ≈ 20 fps
  const CHAOS_INT = 1000 / CHAOS_FPS;
  const BASE_TEXT = (titleChaos && titleChaos.textContent) || 'BONUS TRACK';
  let chaosTimer = null;
  let lastChaos = performance.now();

  function randomizeText(base, chaosProb=0.35){
    // Reemplaza cada caracter con probabilidad 'chaosProb'
    let out = '';
    for (let i=0;i<base.length;i++){
      const ch = base[i];
      if (ch === ' '){ out += ' '; continue; }
      if (Math.random() < chaosProb){
        const r = CHAOS_CHARS[(Math.random()*CHAOS_CHARS.length)|0];
        out += r;
      } else {
        out += ch;
      }
    }
    return out;
  }

  function tickChaos(now){
    if (!titleChaos) return;
    if ((now - lastChaos) < CHAOS_INT){ chaosTimer = requestAnimationFrame(tickChaos); return; }
    lastChaos = now;

    // Oscilar intensidad para que sea legible a ratos
    const t = (now/800) % 2; // 0..2
    const intensity = t < 1 ? 0.15 + t*0.35 : 0.5 - (t-1)*0.35; // 0.15..0.5..0.15
    titleChaos.textContent = randomizeText(BASE_TEXT, intensity);

    chaosTimer = requestAnimationFrame(tickChaos);
  }

  function startChaos(){
    if (chaosTimer) return;
    titleChaos && (titleChaos.textContent = BASE_TEXT);
    lastChaos = performance.now();
    chaosTimer = requestAnimationFrame(tickChaos);
  }
  function pauseChaos(){
    if (chaosTimer){
      cancelAnimationFrame(chaosTimer);
      chaosTimer = null;
    }
    // Deja el texto limpio
    titleChaos && (titleChaos.textContent = BASE_TEXT);
  }

  // Arranca/pausa según LITE actual
  if (!LITE) startChaos();

  // Auto-downgrade si detecta lag (y apaga chaos)
  let slow = 0;
  (function watchLag(){
    let prev = performance.now();
    function tick(t){
      const dt = t - prev; prev = t;
      if (dt > 70) slow++; else slow = Math.max(0, slow-1);

      if (slow > 15) {
        if (!LITE) {
          LITE = true; liteBadge.hidden = false;
          FFT_SIZE = 256; analyser && (analyser.fftSize = FFT_SIZE);
          SMOOTHING = 0.82; analyser && (analyser.smoothingTimeConstant = SMOOTHING);
          FPS = 24; frameInt = 1000 / FPS;
          // Pausar el efecto de letras en Lite
          pauseChaos();
        } else {
          // ya en Lite y sigue lento => apaga visualizador
          stopViz();
        }
        slow = 0;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // Pequeño flash en el título (barato) para conservar vibe
  setInterval(()=>{
    if (!LITE) titleChaos.classList.toggle('flash');
  }, 1400);

  // ====== Controles ======
  playBtn.addEventListener('click', async () => {
    await ensureAudio();
    if (ctx.state === 'suspended') await ctx.resume();

    if (audio.paused) audio.play(); else audio.pause();
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    playBtn.textContent = '❚❚';
    if (!LITE) startViz();
  });
  audio.addEventListener('pause', () => {
    isPlaying = false;
    playBtn.textContent = '►';
    stopViz();
  });

  audio.addEventListener('loadedmetadata', () => {
    if (isFinite(audio.duration)) {
      totalTimeEl.textContent = fmt(audio.duration);
    }
  });
  audio.addEventListener('timeupdate', () => {
    if (!isFinite(audio.duration)) return;
    seek.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = fmt(audio.currentTime);
  });

  seek.addEventListener('input', () => {
    if (!isFinite(audio.duration)) return;
    audio.currentTime = (seek.value / 100) * audio.duration;
  }, { passive:true });

  vol.addEventListener('input', () => {
    audio.volume = Number(vol.value);
  }, { passive:true });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? '🔈' : '🔊';
  });

  function fmt(t){
    t = Math.max(0, t|0);
    const m = (t/60)|0, s = (t%60)|0;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }
})();
