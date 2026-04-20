import './style.css';

const PHASES = ['thinking', 'cruising', 'beast'];
const PHASE_LABELS = { thinking: 'Thinking', cruising: 'Cruising', beast: 'Beast Mode' };
const PHASE_COLORS = { thinking: '#3b82f6', cruising: '#8b5cf6', beast: '#f97316' };
const STORAGE_KEY = 'keymaxxing_v5';
const DB_NAME = 'keymaxxing_audio';
const DB_STORE = 'tracks';
const WPM_WINDOW = 3000;
const FADE_TIME = 1.0;

const TEST_PROMPTS = [
  "The quick brown fox jumps over the lazy dog while the sun sets behind the mountains casting golden light across the peaceful valley below",
  "Every morning she would sit by the window watching the birds fly across the orange sky thinking about all the adventures that still awaited her",
  "Music filled the empty room as the rain tapped against the glass creating a rhythm that seemed to match the beating of her restless heart",
];

let audioCtx = null, audioReady = false, masterGain = null;
let layers = {}, activePhase = null;
let settings = { threshold1: 15, threshold2: 55, volume: 70, volumes: { thinking: 100, cruising: 100, beast: 100 } };
let loopSettings = { thinking: { start: 0, end: 0 }, cruising: { start: 0, end: 0 }, beast: { start: 0, end: 0 } };
const keyTimestamps = [];
let smoothWPM = 0, updateLoop = null;
let testActive = false, testTimer = null, testStartTime = null;
let previewSources = {}, previewIntervals = {};

const $ = s => document.querySelector(s);
const typingInput = $('#typing-input'), wpmDisplay = $('#wpm-display');
const intensityFill = $('#intensity-fill'), charCount = $('#char-count'), wordCount = $('#word-count');
const bgGlow = $('#bg-glow'), nowPlaying = $('#now-playing');
const settingsPanel = $('#settings-panel'), settingsOverlay = $('#settings-overlay');
const threshold1Input = $('#threshold-1'), threshold2Input = $('#threshold-2');
const cruiseStartLabel = $('#cruise-start'), beastStartLabel = $('#beast-start');
const volumeSlider = $('#volume-slider'), volumeValue = $('#volume-value');
const testSection = $('#test-section'), testPrompt = $('#test-prompt');
const testInput = $('#test-input'), testTimerEl = $('#test-timer'), testResult = $('#test-result');
const musicToggle = $('#music-toggle'), musicIcon = $('#music-icon'), musicContent = $('#music-content');
const pills = { thinking: $('#pill-thinking'), cruising: $('#pill-cruising'), beast: $('#pill-beast') };

// ── IndexedDB ──
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = e => { if (!e.target.result.objectStoreNames.contains(DB_STORE)) e.target.result.createObjectStore(DB_STORE, { keyPath: 'phase' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function saveAudioToDB(phase, buf, name) {
  const db = await openDB();
  return new Promise((res, rej) => { const tx = db.transaction(DB_STORE, 'readwrite'); tx.objectStore(DB_STORE).put({ phase, data: buf, fileName: name }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
async function loadAudioFromDB(phase) {
  const db = await openDB();
  return new Promise((res, rej) => { const tx = db.transaction(DB_STORE, 'readonly'); const r = tx.objectStore(DB_STORE).get(phase); r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error); });
}

// ── Settings ──
function loadSettings() {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const p = JSON.parse(s); if (p.threshold1) settings = { ...settings, ...p }; if (p.loops) loopSettings = { ...loopSettings, ...p.loops }; } } catch (e) {}
  threshold1Input.value = settings.threshold1; threshold2Input.value = settings.threshold2;
  volumeSlider.value = settings.volume; volumeValue.textContent = settings.volume + '%';
  if (!settings.volumes) settings.volumes = { thinking: 100, cruising: 100, beast: 100 };
  for (const p of PHASES) {
    const sl = document.querySelector(`.slot-vol[data-phase="${p}"]`);
    const val = document.querySelector(`.slot-vol-val[data-phase="${p}"]`);
    if (sl && val) { sl.value = settings.volumes[p]; val.textContent = settings.volumes[p] + '%'; }
  }
  updateTierLabels();
}
function saveSettings() {
  settings.threshold1 = Math.max(5, parseInt(threshold1Input.value) || 15);
  settings.threshold2 = Math.max(settings.threshold1 + 5, parseInt(threshold2Input.value) || 55);
  settings.volume = parseInt(volumeSlider.value);
  for (const p of PHASES) {
    const sl = document.querySelector(`.slot-vol[data-phase="${p}"]`);
    if (sl) settings.volumes[p] = parseInt(sl.value);
  }
  threshold1Input.value = settings.threshold1; threshold2Input.value = settings.threshold2;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, loops: loopSettings }));
  if (masterGain && audioCtx) masterGain.gain.linearRampToValueAtTime(settings.volume / 100, audioCtx.currentTime + 0.3);
  updateTierLabels();
}
function updateTierLabels() { cruiseStartLabel.textContent = settings.threshold1 + ' –'; beastStartLabel.textContent = settings.threshold2 + '+'; }

// ── Settings Panel ──
$('#open-settings').addEventListener('click', async () => {
  settingsPanel.classList.add('open'); settingsOverlay.classList.remove('hidden');
  // Auto-init audio when opening settings so saved files show waveforms
  await ensureAudioCtx();
  await loadSavedAudioFiles();
});
function closeSettings() { settingsPanel.classList.remove('open'); settingsOverlay.classList.add('hidden'); saveSettings(); typingInput.focus(); }
$('#close-settings').addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', closeSettings);
threshold1Input.addEventListener('change', saveSettings);
threshold2Input.addEventListener('change', saveSettings);
volumeSlider.addEventListener('input', () => { volumeValue.textContent = volumeSlider.value + '%'; saveSettings(); });
document.querySelectorAll('.slot-vol').forEach(el => {
  el.addEventListener('input', () => {
    document.querySelector(`.slot-vol-val[data-phase="${el.dataset.phase}"]`).textContent = el.value + '%';
    saveSettings();
    updateAudio(); // Apply phase volume immediately
  });
});
musicToggle.addEventListener('click', () => { const h = musicContent.classList.toggle('hidden'); musicIcon.classList.toggle('open', !h); redrawAllWaveforms(); });

// ── Typing Test ──
$('#start-test-btn').addEventListener('click', () => {
  testSection.classList.remove('hidden'); testInput.value = ''; testInput.disabled = false;
  testResult.textContent = ''; testTimerEl.textContent = '15s'; testActive = false;
  testPrompt.textContent = TEST_PROMPTS[Math.floor(Math.random() * TEST_PROMPTS.length)]; testInput.focus();
});
testInput.addEventListener('input', () => {
  if (!testActive) { testActive = true; testStartTime = Date.now(); let r = 15; testTimerEl.textContent = r + 's';
    testTimer = setInterval(() => { r--; testTimerEl.textContent = r + 's'; if (r <= 0) { clearInterval(testTimer); finishTest(); } }, 1000); }
});
function finishTest() {
  testActive = false; testInput.disabled = true;
  const w = testInput.value.trim().split(/\s+/).filter(w => w).length;
  const wpm = Math.round(w / ((Date.now() - testStartTime) / 60000));
  testResult.textContent = `Result: ${wpm} WPM`;
  threshold1Input.value = Math.round(wpm * 0.2); threshold2Input.value = Math.round(wpm * 0.7);
  saveSettings(); setTimeout(() => testSection.classList.add('hidden'), 3000);
}

// ── File Upload ──
document.querySelectorAll('.file-input').forEach(input => {
  input.addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    const phase = input.dataset.phase;
    const arrayBuffer = await file.arrayBuffer();
    await saveAudioToDB(phase, arrayBuffer, file.name);
    document.querySelector(`.slot-filename[data-phase="${phase}"]`).textContent = file.name;
    document.querySelector(`.slot-filename[data-phase="${phase}"]`).classList.add('loaded');
    document.getElementById('slot-' + phase).classList.add('has-file');
    await ensureAudioCtx();
    await loadPhaseAudio(phase, arrayBuffer);
  });
});

// ── Ensure AudioContext (without full init) ──
async function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = settings.volume / 100;
    masterGain.connect(audioCtx.destination);
    for (const p of PHASES) { const g = audioCtx.createGain(); g.gain.value = 0; g.connect(masterGain); layers[p] = { gainNode: g, source: null, buffer: null, hasAudio: false }; }
  }
  if (audioCtx.state === 'suspended') await audioCtx.resume();
}

// ── Load saved or default audio ──
let savedFilesLoaded = false;
async function fetchDefaultAudio(phase) {
  const map = { thinking: '1.mp3', cruising: '2.mp3', beast: '3.mp3' };
  try {
    const res = await fetch(`/audio/${map[phase]}`);
    if (res.ok) return await res.arrayBuffer();
  } catch (e) { console.warn('Could not fetch default audio for', phase); }
  return null;
}

async function loadSavedAudioFiles() {
  if (savedFilesLoaded) return;
  
  const initOverlay = document.getElementById('init-overlay');
  if (initOverlay) initOverlay.classList.add('hidden');

  for (const phase of PHASES) {
    try {
      const saved = await loadAudioFromDB(phase);
      let ab = null;
      let fnText = 'Saved';
      if (saved && saved.data) {
        ab = saved.data;
        fnText = saved.fileName || 'Saved';
      } else {
        // Fallback to default
        ab = await fetchDefaultAudio(phase);
        fnText = `${phase === 'thinking' ? '1' : phase === 'cruising' ? '2' : '3'}.mp3 (Default)`;
      }

      if (ab && !layers[phase]?.hasAudio) {
        await loadPhaseAudio(phase, ab);
        const fn = document.querySelector(`.slot-filename[data-phase="${phase}"]`);
        if (fn) { fn.textContent = fnText; fn.classList.add('loaded'); }
        document.getElementById('slot-' + phase)?.classList.add('has-file');
      }
    } catch (e) { console.warn(`Load ${phase}:`, e); }
  }
  savedFilesLoaded = true;
  if (!activePhase && layers.thinking?.hasAudio) {
    activePhase = 'thinking';
    const v = (settings.volumes?.thinking ?? 100) / 100;
    layers.thinking.gainNode.gain.linearRampToValueAtTime(v, audioCtx.currentTime + FADE_TIME);
  }
  audioReady = true;
}

// ── Waveform Drawing ──
function drawWaveform(phase) {
  const layer = layers[phase]; if (!layer?.buffer) return;
  const canvas = document.querySelector(`.waveform-canvas[data-phase="${phase}"]`); if (!canvas) return;
  const editor = document.querySelector(`.waveform-editor[data-phase="${phase}"]`);
  editor.classList.remove('hidden');

  setTimeout(() => {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.offsetWidth || 300;
    const h = 60;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
    const data = layer.buffer.getChannelData(0);
    const step = Math.ceil(data.length / w); const amp = h / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PHASE_COLORS[phase] || '#888'; ctx.globalAlpha = 0.6;
    for (let i = 0; i < w; i++) {
      let mn = 1, mx = -1;
      for (let j = 0; j < step; j++) { const idx = i * step + j; if (idx < data.length) { if (data[idx] < mn) mn = data[idx]; if (data[idx] > mx) mx = data[idx]; } }
      ctx.fillRect(i, (1 + mn) * amp, 1, ((1 + mx) * amp) - ((1 + mn) * amp) || 1);
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(0, amp); ctx.lineTo(w, amp); ctx.stroke();
    updateHandlePositions(phase);
  }, 80);
}

function redrawAllWaveforms() { for (const p of PHASES) if (layers[p]?.buffer) drawWaveform(p); }

function updateHandlePositions(phase) {
  const layer = layers[phase]; if (!layer?.buffer) return;
  const wrap = document.querySelector(`.waveform-canvas[data-phase="${phase}"]`)?.parentElement; if (!wrap) return;
  const dur = layer.buffer.duration, ww = wrap.offsetWidth || 300, lp = loopSettings[phase];
  const sp = (lp.start / dur) * ww, ep = lp.end > 0 ? (lp.end / dur) * ww : ww;
  const sh = wrap.querySelector('.wf-handle-start'), eh = wrap.querySelector('.wf-handle-end'), sel = wrap.querySelector('.wf-selection');
  if (sh) sh.style.left = (sp - 7) + 'px';
  if (eh) eh.style.left = (ep - 7) + 'px';
  if (sel) { sel.style.left = sp + 'px'; sel.style.width = (ep - sp) + 'px'; }
  const sl = document.querySelector(`.wf-time[data-phase="${phase}"][data-bound="start"]`);
  const el = document.querySelector(`.wf-time[data-phase="${phase}"][data-bound="end"]`);
  if (sl) sl.textContent = lp.start.toFixed(1) + 's';
  if (el) el.textContent = (lp.end > 0 ? lp.end : dur).toFixed(1) + 's';
}

// ── Handle Dragging ──
function setupHandleDragging() {
  document.querySelectorAll('.wf-handle').forEach(handle => {
    let dragging = false;
    const down = e => { e.preventDefault(); dragging = true; document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none'; };
    const move = e => {
      if (!dragging) return;
      const phase = handle.dataset.phase, bound = handle.dataset.bound, layer = layers[phase];
      if (!layer?.buffer) return;
      const wrap = handle.parentElement, rect = wrap.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(rect.width, cx - rect.left));
      const time = (x / rect.width) * layer.buffer.duration;
      if (bound === 'start') {
        const max = loopSettings[phase].end > 0 ? loopSettings[phase].end - 0.5 : layer.buffer.duration - 0.5;
        loopSettings[phase].start = Math.max(0, Math.min(max, time));
      } else {
        loopSettings[phase].end = Math.max(loopSettings[phase].start + 0.5, Math.min(layer.buffer.duration, time));
      }
      updateHandlePositions(phase); saveSettings(); applyLoopPoints(phase);
    };
    const up = () => { if (!dragging) return; dragging = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    handle.addEventListener('mousedown', down); handle.addEventListener('touchstart', down, { passive: false });
    document.addEventListener('mousemove', move); document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('mouseup', up); document.addEventListener('touchend', up);
  });
}

// ── Preview (mutes main audio) ──
document.querySelectorAll('.wf-preview-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const phase = btn.dataset.phase;
    if (previewSources[phase]) { stopPreview(phase); return; }
    await ensureAudioCtx();
    const layer = layers[phase]; if (!layer?.buffer) return;
    // MUTE main audio during preview
    if (masterGain) masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    const lp = loopSettings[phase], st = lp.start, et = lp.end > 0 ? lp.end : layer.buffer.duration, dur = et - st;
    const pg = audioCtx.createGain(); pg.gain.value = settings.volume / 100; pg.connect(audioCtx.destination);
    const src = audioCtx.createBufferSource(); src.buffer = layer.buffer; src.connect(pg); src.start(0, st, dur);
    previewSources[phase] = { source: src, gain: pg }; btn.textContent = '⏹ Stop'; btn.classList.add('playing');
    const wrap = document.querySelector(`.waveform-canvas[data-phase="${phase}"]`)?.parentElement;
    const ph = wrap?.querySelector('.wf-playhead'); if (ph) ph.classList.add('playing');
    const ww = wrap?.offsetWidth || 300, pxS = (st / layer.buffer.duration) * ww, pxE = (et / layer.buffer.duration) * ww;
    const t0 = audioCtx.currentTime;
    previewIntervals[phase] = setInterval(() => {
      const prog = (audioCtx.currentTime - t0) / dur;
      if (prog >= 1) { stopPreview(phase); return; }
      if (ph) ph.style.left = (pxS + prog * (pxE - pxS)) + 'px';
    }, 30);
    src.onended = () => stopPreview(phase);
  });
});

function stopPreview(phase) {
  if (previewSources[phase]) { try { previewSources[phase].source.stop(); } catch (e) {} try { previewSources[phase].gain.disconnect(); } catch (e) {} delete previewSources[phase]; }
  if (previewIntervals[phase]) { clearInterval(previewIntervals[phase]); delete previewIntervals[phase]; }
  const btn = document.querySelector(`.wf-preview-btn[data-phase="${phase}"]`);
  if (btn) { btn.textContent = '▶ Preview'; btn.classList.remove('playing'); }
  const ph = document.querySelector(`.wf-playhead[data-phase="${phase}"]`);
  if (ph) { ph.classList.remove('playing'); ph.style.left = '0'; }
  // UNMUTE main audio
  if (masterGain && audioCtx) masterGain.gain.linearRampToValueAtTime(settings.volume / 100, audioCtx.currentTime + 0.3);
}

// ── Audio Engine — Smooth Crossfade Looping ──
const LOOP_XFADE = 0.8; // seconds of crossfade at loop boundary
let loopTimers = {}; // per-phase scheduling timers

async function loadPhaseAudio(phase, arrayBuffer) {
  try {
    const ab = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    // Stop old source
    stopPhaseSource(phase);
    layers[phase].buffer = ab;
    layers[phase].hasAudio = true;
    // Start the smooth loop
    startSmoothLoop(phase);
    requestAnimationFrame(() => drawWaveform(phase));
  } catch (e) { console.error(`Error loading ${phase}:`, e); }
}

function stopPhaseSource(phase) {
  if (layers[phase]?.source) { try { layers[phase].source.stop(); } catch (e) {} layers[phase].source = null; }
  if (layers[phase]?._fadeSource) { try { layers[phase]._fadeSource.stop(); } catch (e) {} layers[phase]._fadeSource = null; }
  if (loopTimers[phase]) { clearTimeout(loopTimers[phase]); delete loopTimers[phase]; }
}

function getLoopBounds(phase) {
  const lp = loopSettings[phase], buf = layers[phase]?.buffer;
  if (!buf) return { start: 0, end: 0, dur: 0 };
  const start = lp.start > 0 ? lp.start : 0;
  const end = (lp.end > 0 && lp.end > start) ? lp.end : buf.duration;
  return { start, end, dur: end - start };
}

function startSmoothLoop(phase) {
  const layer = layers[phase];
  if (!layer?.buffer || !audioCtx) return;
  stopPhaseSource(phase);

  const { start, end, dur } = getLoopBounds(phase);
  if (dur <= 0) return;

  // Create and start source
  const src = audioCtx.createBufferSource();
  src.buffer = layer.buffer;
  src.loop = false; // we handle looping ourselves
  src.connect(layer.gainNode);
  src.start(0, start, dur);
  layer.source = src;

  // Schedule the next iteration with crossfade overlap
  scheduleNextLoop(phase, dur);
}

function scheduleNextLoop(phase, dur) {
  const xfade = Math.min(LOOP_XFADE, dur * 0.25); // don't crossfade more than 25% of the track
  const scheduleTime = Math.max(100, (dur - xfade) * 1000);

  loopTimers[phase] = setTimeout(() => {
    const layer = layers[phase];
    if (!layer?.buffer || !audioCtx) return;
    const { start, end, dur: newDur } = getLoopBounds(phase);
    if (newDur <= 0) return;

    // Old source: fade out
    const oldSrc = layer.source;
    if (oldSrc) {
      // Create a dedicated gain for the old source to fade it out
      // (the layer gainNode controls overall phase volume, not individual loops)
      try {
        const fadeGain = audioCtx.createGain();
        fadeGain.gain.setValueAtTime(1, audioCtx.currentTime);
        fadeGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + xfade);
        oldSrc.disconnect();
        oldSrc.connect(fadeGain);
        fadeGain.connect(layer.gainNode);
        // Stop old source after fade
        setTimeout(() => { try { oldSrc.stop(); fadeGain.disconnect(); } catch (e) {} }, xfade * 1000 + 100);
      } catch (e) {}
    }

    // New source: fade in
    const newSrc = audioCtx.createBufferSource();
    newSrc.buffer = layer.buffer;
    newSrc.loop = false;
    const fadeInGain = audioCtx.createGain();
    fadeInGain.gain.setValueAtTime(0, audioCtx.currentTime);
    fadeInGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + xfade);
    newSrc.connect(fadeInGain);
    fadeInGain.connect(layer.gainNode);
    newSrc.start(0, start, newDur);
    layer.source = newSrc;
    layer._fadeInGain = fadeInGain;

    // Schedule the next one
    scheduleNextLoop(phase, newDur);
  }, scheduleTime);
}

function applyLoopPoints(phase) {
  // Restart the smooth loop with new bounds
  if (layers[phase]?.hasAudio && audioCtx) {
    startSmoothLoop(phase);
  }
}

// ── WPM ──
function recordKeystroke() { const n = Date.now(); keyTimestamps.push(n); while (keyTimestamps.length && keyTimestamps[0] < n - WPM_WINDOW) keyTimestamps.shift(); }
function calculateWPM() { const n = Date.now(); while (keyTimestamps.length && keyTimestamps[0] < n - WPM_WINDOW) keyTimestamps.shift(); return Math.round((keyTimestamps.length / 5) / (WPM_WINDOW / 60000)); }

function startLoop() { 
  if (updateLoop) return; 
  updateLoop = setInterval(() => { 
    const target = calculateWPM();
    if (target > smoothWPM) {
      // Instant reaction when speeding up
      smoothWPM += (target - smoothWPM) * 0.3;
    } else {
      // "Physical momentum" slow drain when slowing down
      // Drains approx 12 WPM per second, giving a 3-5 sec grace period
      smoothWPM -= 1.2;
      if (smoothWPM < target) smoothWPM = target;
    }
    updateUI(); 
    updateAudio(); 
  }, 100); 
}

function getPhase(wpm) { if (wpm >= settings.threshold2) return 'beast'; if (wpm >= settings.threshold1) return 'cruising'; return 'thinking'; }

function updateUI() {
  const wpm = Math.max(0, Math.round(smoothWPM)); wpmDisplay.textContent = wpm;
  const t = typingInput.value; charCount.textContent = t.length + ' chars';
  wordCount.textContent = (t.trim() === '' ? 0 : t.trim().split(/\s+/).length) + ' words';
  intensityFill.style.width = Math.min(100, (wpm / (settings.threshold2 * 1.3)) * 100) + '%';
  
  const phase = getPhase(wpm);

  for (const p of PHASES) pills[p].classList.toggle('active', p === phase);
  typingInput.className = 't-' + phase; bgGlow.className = 'bg-glow g-' + phase;
  wpmDisplay.style.color = PHASE_COLORS[phase];
  if (layers[phase]?.hasAudio) { nowPlaying.textContent = `♪ ${PHASE_LABELS[phase]}`; nowPlaying.style.color = PHASE_COLORS[phase]; }
  else { nowPlaying.textContent = `${PHASE_LABELS[phase]} — no music`; nowPlaying.style.color = '#555'; }
}

function updateAudio() {
  if (!audioReady || !audioCtx) return;
  const tp = getPhase(Math.max(0, Math.round(smoothWPM)));
  const now = audioCtx.currentTime;

  // Update volume of active phase even if it hasn't changed
  if (tp === activePhase && layers[tp]?.gainNode) {
    const targetVol = (settings.volumes[tp] || 100) / 100;
    layers[tp].gainNode.gain.linearRampToValueAtTime(targetVol, now + 0.1);
    return;
  }

  if (activePhase && layers[activePhase]?.gainNode) { 
    const g = layers[activePhase].gainNode.gain; 
    g.cancelScheduledValues(now); 
    g.setValueAtTime(g.value, now); 
    g.linearRampToValueAtTime(0, now + FADE_TIME); 
  }
  if (layers[tp]?.gainNode) { 
    const g = layers[tp].gainNode.gain; 
    const targetVol = (settings.volumes[tp] || 100) / 100;
    g.cancelScheduledValues(now); 
    g.setValueAtTime(g.value, now); 
    g.linearRampToValueAtTime(targetVol, now + FADE_TIME); 
  }
  activePhase = tp;
}

// ── Events ──
async function ensureAudio() { await ensureAudioCtx(); await loadSavedAudioFiles(); startLoop(); }
typingInput.addEventListener('input', async () => { await ensureAudio(); recordKeystroke(); });
typingInput.addEventListener('keydown', async e => { if (e.key === 'Backspace' || e.key === 'Enter') { await ensureAudio(); recordKeystroke(); } });

// Auto-focus text area when clicking anywhere in the main app body
document.body.addEventListener('click', (e) => {
  if (e.target === document.body || e.target.closest('.main-area') || e.target.closest('#app')) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
      typingInput.focus();
    }
  }
});

// ── On page load: show filenames from IndexedDB (no AudioContext needed) ──
async function showSavedFilenames() {
  for (const phase of PHASES) {
    try {
      const saved = await loadAudioFromDB(phase);
      const fn = document.querySelector(`.slot-filename[data-phase="${phase}"]`);
      if (saved?.fileName && fn) {
        fn.textContent = saved.fileName; fn.classList.add('loaded');
        document.getElementById('slot-' + phase)?.classList.add('has-file');
      } else if (fn) {
        fn.textContent = `${phase === 'thinking' ? '1' : phase === 'cruising' ? '2' : '3'}.mp3 (Default)`;
        fn.classList.add('loaded');
        document.getElementById('slot-' + phase)?.classList.add('has-file');
      }
    } catch (e) {}
  }
}

// ── Hint Toast ──
const HINTS = [
  "💡 Write your essays and lock in with adaptive music.",
  "💡 Code at warp speed with synthwave backing you up.",
  "💡 Power through your inbox and emails to a high-BPM track.",
  "💡 Draft the climax of your novel to epic cinematic boss music.",
  "💡 Spitfire your thoughts into a daily journal and find your flow.",
  "💡 Turn boring data entry into a high-stakes gaming experience.",
  "💡 Transcribe study notes while staying deeply in the zone.",
  "💡 Upload your own favorite tracks in the Settings (⚙) menu."
];
let currentHint = 0;
const hintToast = document.getElementById('hint-toast');

function cycleHints() {
  if (!hintToast) return;
  hintToast.classList.remove('show');
  setTimeout(() => {
    currentHint = (currentHint + 1) % HINTS.length;
    hintToast.textContent = HINTS[currentHint];
    hintToast.classList.add('show');
  }, 1000); // Wait for fade out
}

setTimeout(() => { if (hintToast) hintToast.classList.add('show'); }, 1000);
setInterval(cycleHints, 8000);

loadSettings(); setupHandleDragging(); showSavedFilenames(); typingInput.focus();
console.log('PixRecall v5 — waveform editor loaded');
