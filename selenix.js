// selenix.js (no <script> tags in this file)
(() => {
  'use strict';

  const GOOGLE_SHEETS_API_KEY = "AIzaSyDzdiDMtiY250DS-lDuZeIZOocw9oqMlhM";
  const SPREADSHEET_ID = "1v6XVoYKJEQ7knVMRaZouSRrVDg46OjxYW4HuPITi5u0";
  const TAB_NAME = "Lessons";
  const LOGO_URL = ""; // optional: your logo URL

function(){
      "use strict";

      // --- Config knobs (adjust for your threat model) ---
      const ENFORCE_ON_LOAD = true;           // show lock immediately until checks pass
      const DEVTOOLS_WIDTH_THRESHOLD = 160;   // px delta heuristic
      const DEBUGGER_TIME_THRESHOLD = 150;    // ms stall considered suspicious
      const CHECK_INTERVAL_MS = 600;          // periodic check
      const HARD_FAIL_ON_ANY_VIOLATION = true;// lock permanently on first hit

      // --- Utilities ---
      const $ = sel => document.querySelector(sel);
      const lockEl = $("#lock");
      const reasonEl = $("#reason");
      const reloadBtn = $("#reloadBtn");
      let locked = false;
      let tripped = false;

      function setReason(text){
        try { reasonEl.textContent = "Reason: " + text; } catch(e){}
      }
      function showLock(reason){
        if (locked) return;
        locked = true;
        setReason(reason || "Policy violation");
        lockEl.classList.remove("hidden");
        // Nuke visible content text nodes to reduce quick copy (still bypassable)
        try {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const nodes=[];
          while(walker.nextNode()) nodes.push(walker.currentNode);
          nodes.forEach(n => { if (!lockEl.contains(n)) n.textContent = ""; });
        } catch(e){}
      }
      function hideLock(){
        if (tripped) return; // once tripped, don't auto-unlock
        locked = false;
        lockEl.classList.add("hidden");
      }

      reloadBtn.addEventListener("click", ()=>location.reload());

      // --- Hardening: block common UI interactions ---
      const deny = e => { e.preventDefault(); e.stopPropagation(); return false; };

      // Right click, selection, copy/cut/paste, drag, context menu
      ["contextmenu","selectstart","copy","cut","paste","dragstart","drop"].forEach(ev=>{
        window.addEventListener(ev, deny, true);
      });

      // Keyboard shortcuts: F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U, Ctrl/Cmd+S, PrintScreen, etc.
      window.addEventListener("keydown", (e)=>{
        const k = e.key?.toLowerCase();
        const ctrl = e.ctrlKey || e.metaKey;
        const sh = e.shiftKey;

        const blocked =
          e.key === "F12" ||
          (ctrl && sh && (k === "i" || k === "j" || k === "c")) ||
          (ctrl && (k === "u" || k === "s" || k === "p")) ||
          // Prevent opening source in some browsers via Ctrl+O
          (ctrl && k === "o");

        if (blocked) {
          deny(e);
          tripped = true;
          if (HARD_FAIL_ON_ANY_VIOLATION) showLock("Restricted keyboard shortcut");
        }
      }, true);

      // Prevent printing (mild friction)
      window.matchMedia && window.matchMedia('print').addListener(() => {
        tripped = true;
        if (HARD_FAIL_ON_ANY_VIOLATION) showLock("Print attempt");
      });

      // --- DevTools detection (multi-pronged heuristics) ---
      function devtoolsSizeHeuristic(){
        const dW = Math.abs((window.outerWidth || 0) - (window.innerWidth || 0));
        const dH = Math.abs((window.outerHeight || 0) - (window.innerHeight || 0));
        return (dW > DEVTOOLS_WIDTH_THRESHOLD) || (dH > DEVTOOLS_WIDTH_THRESHOLD);
      }

      function debuggerStallHeuristic(){
        const t0 = performance.now();
        // Try to cause a stall if devtools is pausing on debugger statements
        // eslint-disable-next-line no-new-func
        try { new Function("debugger")(); } catch(e){}
        const dt = performance.now() - t0;
        return dt > DEBUGGER_TIME_THRESHOLD;
      }

      // Detect console probing (toString side effect trick)
      function consoleProbingHeuristic(){
        let detected = false;
        const bait = { toString: function(){ detected = true; return "0"; } };
        try { console.log(bait); } catch(e){}
        return detected && (typeof window.console === "object");
      }

      // Freeze page if DevTools panel is opened (heuristic combo)
      function runChecks(){
        if (devtoolsSizeHeuristic()) {
          tripped = true;
          if (HARD_FAIL_ON_ANY_VIOLATION) showLock("DevTools window detected (size)");
          return true;
        }
        if (debuggerStallHeuristic()) {
          tripped = true;
          if (HARD_FAIL_ON_ANY_VIOLATION) showLock("Debugger stall detected");
          return true;
        }
        if (consoleProbingHeuristic()) {
          tripped = true;
          if (HARD_FAIL_ON_ANY_VIOLATION) showLock("Console probing detected");
          return true;
        }
        return false;
      }

      // Extra: disable console methods (minor friction; easily bypassed)
      (function disableConsole(){
        const noop = ()=>{};
        ["log","warn","info","error","table","trace","dir","group","groupCollapsed","groupEnd"].forEach(m=>{
          try { console[m] = noop; } catch(e){}
        });
        try { Object.freeze(console); } catch(e){}
      })();

      // Periodic enforcement
      setInterval(runChecks, CHECK_INTERVAL_MS);

      // On visibility changes, re-check
      document.addEventListener("visibilitychange", ()=>{
        if (!document.hidden) runChecks();
      });

      // Initial state
      if (ENFORCE_ON_LOAD) {
        showLock("Pre-auth lock");
        // Briefly delay then unlock if clean
        setTimeout(()=>{
          if (!runChecks()) hideLock();
        }, 300);
      } else {
        runChecks();
      }

      // Anti-embed / clickjacking basic guard (also set frame-ancestors in CSP server-side)
      if (window.top !== window.self) {
        tripped = true;
        showLock("Embedded in a frame");
        try { window.top.location = window.location.href; } catch(e){}
      }

      // Minimal tamper detection (checksum of inline script text)
      try {
        const thisScript = document.currentScript?.textContent || "";
        let hash = 0;
        for (let i=0; i<thisScript.length; i++) hash = (hash*31 + thisScript.charCodeAt(i)) >>> 0;
        // Store a reference hash you expect (update if you edit this script)
        const EXPECTED = hash; // set to computed value after first deploy
        // Example: if (hash !== EXPECTED) showLock("Script integrity check failed");
      } catch(e){}
    })();

  
  /* ---------- NAV / SEARCH OVERLAY / MOBILE ---------- */
  function initHeader(){
    const logoImg = document.querySelector('.brand img');
    if (logoImg && LOGO_URL) {
      logoImg.src = LOGO_URL;
      logoImg.style.display = 'block';
    }

    const burger = document.querySelector('.hamburger');
    const drawer = document.querySelector('.mobile-drawer');
    if (burger && drawer){
      burger.addEventListener('click', ()=>drawer.classList.toggle('open'));
    }

    // Search overlay
    const openBtn = document.querySelectorAll('[data-open-search]');
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('globalSearchInput');
    const goBtn = document.getElementById('globalSearchGo');

    openBtn.forEach(b=>b.addEventListener('click', ()=>{
      if (!overlay) return;
      overlay.classList.add('open');
      setTimeout(()=>input && input.focus(), 50);
    }));
    if (overlay){
      overlay.addEventListener('click', (e)=>{
        if (e.target === overlay) overlay.classList.remove('open');
      });
    }
    if (goBtn){
      goBtn.addEventListener('click', ()=>{
        const q = (input && input.value || '').trim();
        if(q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      });
    }
    if (input){
      input.addEventListener('keydown', (e)=>{
        if(e.key==='Enter'){ e.preventDefault(); goBtn && goBtn.click(); }
      });
    }

    // Mobile searchbar submit (top of page on small screens)
    const mForm = document.getElementById('mobileSearchForm');
    const mInput = document.getElementById('mobileSearch');
    if (mForm){
      mForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const q = (mInput && mInput.value || '').trim();
        if(q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
      });
    }

    // Back buttons
    const backBtns = document.querySelectorAll('[data-back]');
    backBtns.forEach(b=>b.addEventListener('click', ()=>{
      if (window.history.length > 1) window.history.back();
      else window.location.href = 'index.html';
    }));
  }

  /* ---------- DATA ACCESS ---------- */
  async function fetchSheet(){
    const range = encodeURIComponent(`${TAB_NAME}!A1:H`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Failed to load Google Sheet.');
    const data = await res.json();
    const rows = data.values || [];
    if (!rows.length) return [];

    const header = rows[0].map(h => (h||'').trim());
    const idx = {
      subject: header.indexOf('Subject'),
      lesson: header.indexOf('Lesson'),
      part: header.indexOf('Part Title'),
      desc: header.indexOf('Description'),
      yt: header.indexOf('YouTube Embed'),
      tg: header.indexOf('Telegram Link'),
      rs: header.indexOf('Resource Link'),
      th: header.indexOf('Thumbnail')
    };

    const out = [];
    for(let i=1;i<rows.length;i++){
      const r = rows[i];
      out.push({
        _rowIndex: i+1,
        id: `r${i}`,
        subject: (r[idx.subject]||'').trim(),
        lesson: (r[idx.lesson]||'').trim(),
        partTitle: (r[idx.part]||'').trim(),
        description: (r[idx.desc]||'').trim(),
        youtube: normalizeYouTube(r[idx.yt]||''),
        telegram: (r[idx.tg]||'').trim(),
        resource: (r[idx.rs]||'').trim(),
        thumb: (r[idx.th]||'').trim()
      });
    }
    return out;
  }

  function normalizeYouTube(v){
    if(!v) return '';
    const idFromWatch = v.match(/[?&]v=([^&]+)/);
    const idFromShort = v.match(/youtu\.be\/([^?&]+)/);
    const idFromEmbed = v.match(/\/embed\/([^?&]+)/);
    let id = '';
    if (idFromWatch) id = idFromWatch[1];
    else if (idFromShort) id = idFromShort[1];
    else if (idFromEmbed) id = idFromEmbed[1];
    else if (/^[A-Za-z0-9_-]{8,}$/.test(v)) id = v;
    if(!id) return v;
    return `https://www.youtube.com/embed/${id}`;
  }

  function slugify(s){
    return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }

  function groupByLesson(items){
    const map = new Map();
    items.forEach(it=>{
      const key = `${it.subject}||${it.lesson}`;
      if (!map.has(key)) map.set(key, {
        subject: it.subject, lesson: it.lesson, parts: [], lessonId: slugify(`${it.subject}-${it.lesson}`)
      });
      map.get(key).parts.push(it);
    });
    return Array.from(map.values())
      .sort((a,b)=> a.subject.localeCompare(b.subject) || a.lesson.localeCompare(b.lesson));
  }

  function uniqueSubjects(items){
    return Array.from(new Set(items.map(x=>x.subject).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  }

  // Assign unique colors per subject, persist to localStorage
  function subjectColorMap(subjects){
    const palette = ['#58f2a5','#f0903a','#e81900','#000053','#054a2d']; // corrected last hex
    let map = {};
    try { map = JSON.parse(localStorage.getItem('selenixSubjectColors')||'{}'); } catch(_){ map = {}; }

    const used = new Set(Object.values(map));
    subjects.forEach(s=>{
      if (!map[s]){
        let color = palette.find(c => !used.has(c));
        if (!color) color = hslColor(Object.keys(map).length*47);
        map[s] = color;
        used.add(color);
      }
    });

    localStorage.setItem('selenixSubjectColors', JSON.stringify(map));
    return map;
  }
  function hslColor(h){ return `hsl(${h%360} 70% 36%)`; }

  function makeSubjectDot(color){
    const span = document.createElement('span');
    span.className = 'subject-dot';
    span.style.setProperty('--subject-color', color);
    return span;
  }

  function formatCount(n){ return `${n} part${n===1?'':'s'}`; }

  // Expose as a global helper for page scripts
  window.selenix = {
    initHeader, fetchSheet, normalizeYouTube, groupByLesson,
    uniqueSubjects, subjectColorMap, slugify, makeSubjectDot, formatCount
  };

})();

