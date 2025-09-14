(function(){
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('playBtn');
  const muteBtn = document.getElementById('muteBtn');
  const seek = document.getElementById('seek');
  const vol = document.getElementById('vol');
  const curEl = document.getElementById('currentTime');
  const totEl = document.getElementById('totalTime');
  const viz = document.getElementById('viz');
  const ctx = viz.getContext('2d', { alpha: false });

  // Web Audio API para visualizador
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  let sourceNode = null;
  let rafId = null;

  function fmt(t){
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function drawViz(){
    rafId = requestAnimationFrame(drawViz);
    analyser.getByteFrequencyData(dataArray);
    const w = viz.width, h = viz.height;
    ctx.fillStyle = '#0b0b0f';
    ctx.fillRect(0,0,w,h);

    const barCount = 48;
    const step = Math.floor(bufferLength / barCount);
    const barW = w / barCount;

    for(let i=0;i<barCount;i++){
      const v = dataArray[i*step]/255;
      const barH = v * (h-6);
      const grad = ctx.createLinearGradient(0, h - barH, 0, h);
      grad.addColorStop(0, '#7b5af5');
      grad.addColorStop(1, '#63d4ff');
      ctx.fillStyle = grad;
      const x = i * barW + 1;
      ctx.fillRect(x, h - barH, barW - 2, barH);
    }
  }

  function connectAudioGraph(){
    if(sourceNode) try{ sourceNode.disconnect(); }catch(e){}
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  // Controles
  playBtn.addEventListener('click', async ()=>{
    if(audio.src){
      if(audio.paused){
        try{
          if(audioCtx.state === 'suspended') await audioCtx.resume();
          await audio.play();
          playBtn.textContent = '❚❚';
        }catch(err){ console.error(err); }
      }else{
        audio.pause();
        playBtn.textContent = '►';
      }
    }
  });

  muteBtn.addEventListener('click', ()=>{
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? '🔇' : '🔊';
  });

  vol.addEventListener('input', ()=>{
    audio.volume = Number(vol.value);
    muteBtn.textContent = (audio.volume === 0) ? '🔇' : '🔊';
  });

  seek.addEventListener('input', ()=>{
    if(audio.duration) audio.currentTime = (seek.value/100) * audio.duration;
  });

  // Eventos del audio
  audio.addEventListener('loadedmetadata', ()=>{
    totEl.textContent = fmt(audio.duration);
    connectAudioGraph();
    if(!rafId) drawViz();
  });
  audio.addEventListener('timeupdate', ()=>{
    curEl.textContent = fmt(audio.currentTime);
    if(audio.duration){
      const pct = (audio.currentTime / audio.duration) * 100;
      seek.value = pct.toFixed(2);
    }
  });
  audio.addEventListener('ended', ()=>{
    playBtn.textContent = '►';
  });

  // Ajustar canvas a DPR
  function resizeCanvas(){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = viz.clientWidth || 800;
    const cssH = viz.clientHeight || 80;
    viz.width = Math.floor(cssW * dpr);
    viz.height = Math.floor(cssH * dpr);
    ctx.scale(dpr, dpr);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
})();
