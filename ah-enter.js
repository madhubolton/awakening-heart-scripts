/*--------------------------------------------------------------
  Awakening Heart : Oracle Entry Sequence
  Version: 11.0.0 | 2025-11-27
  
  FLOW:
  1) Title animates → Welcome (prompt0) breathes out → PAUSE
  2) User scrolls/clicks → breathing navigation through prompts 0-3
     - Each transition lights up corresponding stairway step
     - Click zones: top 50% = back, bottom 50% = forward
  3) After final prompt, user enters oracle (navigates to random CMS scene)
  
  CHANGES in v11.0:
  - Prompts 1-3 now user-controlled with breathing navigation
  - Click navigation with top/bottom zones
  - Stairway lights respond to prompt navigation
  - NO audio autoplay - user enables manually
  - Metatron stays at normal scale during entry
  - Goddess glides in during general entry, drops to dock before divination
  - Facet loop removed from entry sequence
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💖 Awakening Heart : Entry Sequence initialized (v11.0)");

  // ============================================================
  // DOM CACHE
  // ============================================================
  
  const DOM = {
    overlay: document.getElementById("oracleOverlay") || document.getElementById("overlay"),
    temple: document.getElementById("temple-container"),
    title: document.getElementById("ah-title"),
    shaderW: document.querySelector(".shader-wrapper"),
    metatron: document.getElementById("metatron"),
    bg: document.getElementById("bgMusic"),
    audioUI: document.querySelector(".audio-buttons"),
    goddess: document.getElementById("triple-goddess-wrapper"),
    audioToggle: document.getElementById("audioToggle"),
    audioIcon: document.querySelector("#audioToggle svg, #audioToggle .icon-On"),
    
    prompts: [
      document.getElementById("prompt0"), // Welcome
      document.getElementById("prompt1"),
      document.getElementById("prompt2"),
      document.getElementById("prompt3")  // Final prompt
    ].filter(Boolean)
  };

  const oracleAudioUrl = DOM.bg?.getAttribute("data-scene-audio") || DOM.bg?.src;

  console.log("🧩 Elements cached:", { 
    overlay: !!DOM.overlay,
    temple: !!DOM.temple,
    title: !!DOM.title,
    metatron: !!DOM.metatron,
    goddess: !!DOM.goddess,
    promptCount: DOM.prompts.length,
    lightsAvailable: !!window.AHLights
  });

  // ============================================================
  // STATE
  // ============================================================
  
  const State = {
    currentPromptIndex: 0,
    titleComplete: false,
    inPromptMode: false,
    canNavigate: false,
    isTransitioning: false,
    enteredOracle: false,
    touchStartY: 0,
    touchStartX: 0
  };

  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    breathIn: 0.8,
    breathPause: 0.2,
    breathOut: 1.2,
    scrollCooldown: 300,
    swipeMinDistance: 50,
    audioVolume: 0.35
  };

  // ============================================================
  // INITIAL SETUP
  // ============================================================
  
  // Hide all prompts initially
  DOM.prompts.forEach(p => {
    if (p) {
      p.style.visibility = "hidden";
      p.style.opacity = "0";
      gsap.set(p, { autoAlpha: 0, scale: 0 });
    }
  });

  // Initial states
  gsap.set(DOM.title, { autoAlpha: 0, clearProps: "transform" });
  gsap.set(DOM.shaderW, { autoAlpha: 0, pointerEvents: "none" });
  gsap.set(DOM.audioUI, { autoAlpha: 0, pointerEvents: "none" });
  
  // Goddess hidden until general entry
  if (DOM.goddess) {
    gsap.set(DOM.goddess, {
      autoAlpha: 0,
      pointerEvents: "none",
      y: "-15vh",
      scale: 0.85,
      transformOrigin: "50% 50%"
    });
  }

  gsap.set([DOM.overlay, DOM.temple], { autoAlpha: 1 });
  
  // Metatron visible at normal size
  if (DOM.metatron) {
    gsap.set(DOM.metatron, { 
      autoAlpha: 1,
      scale: 1,
      opacity: 1,
      visibility: "visible",
      transformOrigin: "50% 50%", 
      force3D: true 
    });
  }
  
  // Audio icon OFF state
  if (DOM.audioIcon) gsap.set(DOM.audioIcon, { opacity: 0.4 });
  
  // Audio starts paused
  if (DOM.bg) { 
    DOM.bg.pause(); 
    DOM.bg.volume = 0; 
    DOM.bg.muted = false;
    if (oracleAudioUrl && DOM.bg.src !== oracleAudioUrl) {
      console.log("🔄 Setting audio source:", oracleAudioUrl);
      DOM.bg.src = oracleAudioUrl;
    }
  }

  gsap.set(document.documentElement, { cursor: "default" });

  // ============================================================
  // SCENE RANDOMIZATION
  // ============================================================
  
  function loadScenePool() {
    const items = document.querySelectorAll('.scene-pool-item');
    const pool = Array.from(items).map(item => {
      let url = item.dataset.sceneUrl || '';
      if (url && !url.startsWith('/')) {
        url = '/scenes/' + url;
      }
      return {
        id: item.dataset.sceneId,
        url: url,
        weight: parseFloat(item.dataset.sceneWeight) || 1.0,
        realm: item.dataset.realm
      };
    });
    
    const validPool = pool.filter(s => s.url && s.url.startsWith('/scenes/') && s.id);
    console.log('🎲 Scene pool loaded:', validPool.length, 'valid scenes');
    console.log('📋 Pool contents:', validPool.map(s => ({ id: s.id, weight: s.weight })));
    
    return validPool;
  }
  
  function getSceneHistory() {
    try {
      const stored = localStorage.getItem('ah_scene_history');
      const history = stored ? JSON.parse(stored) : [];
      console.log('📚 Current history:', history);
      return history;
    } catch (e) {
      console.warn('⚠️ Could not read history:', e);
      return [];
    }
  }
  
  function saveToHistory(sceneId) {
    try {
      let history = getSceneHistory();
      history.push(sceneId);
      if (history.length > 3) {
        history = history.slice(-3);
      }
      localStorage.setItem('ah_scene_history', JSON.stringify(history));
      console.log('💾 History updated:', history);
    } catch (e) {
      console.warn('⚠️ Could not save history:', e);
    }
  }
  
  function selectRandomScene() {
    const pool = loadScenePool();
    
    if (pool.length === 0) {
      console.error('❌ No scenes in pool!');
      return null;
    }
    
    const history = getSceneHistory();
    const excluded = ['opening-entry', ...history];
    
    console.log('🚫 Excluding from selection:', excluded);
    
    const available = pool.filter(scene => !excluded.includes(scene.id));
    
    console.log('✅ Available scenes:', available.length, '/', pool.length);
    console.log('📋 Available:', available.map(s => s.id));
    
    if (available.length === 0) {
      console.warn('⚠️ No available scenes after exclusion, using fallback');
      const fallback = pool[0];
      console.log('🎯 Fallback scene:', fallback.id);
      return fallback;
    }
    
    const totalWeight = available.reduce((sum, scene) => sum + scene.weight, 0);
    let random = Math.random() * totalWeight;
    
    console.log('🎰 Random selection (weight-based):', random.toFixed(2), '/', totalWeight.toFixed(2));
    
    for (const scene of available) {
      random -= scene.weight;
      if (random <= 0) {
        console.log('🎯 Selected scene:', scene.id, `(weight: ${scene.weight})`);
        console.log('📍 URL:', scene.url);
        return scene;
      }
    }
    
    const fallback = available[0];
    console.log('🎯 Fallback to first available:', fallback.id);
    return fallback;
  }

  // ============================================================
  // SHADER HELPER
  // ============================================================
  
  const revealShader = () => {
    if (window.AHShader?.reveal) {
      window.AHShader.reveal({ beams: true });
    } else if (DOM.shaderW) {
      gsap.to(DOM.shaderW, { autoAlpha: 1, duration: 0.6, ease: "sine.inOut" });
    }
  };

  // ============================================================
  // TITLE ANIMATION (automatic, ends with prompt0)
  // ============================================================
  
  const titleTimeline = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    onComplete: () => {
      console.log("✨ Title complete - Welcome visible, awaiting user input");
      State.titleComplete = true;
      State.inPromptMode = true;
      State.canNavigate = true;
      gsap.set(document.documentElement, { cursor: "pointer" });
    }
  });

  // Title fade & glow
  titleTimeline
    .to(DOM.title, { autoAlpha: 1, duration: 1.0 })
    .to(DOM.title, { color: "hsl(268, 30%, 85%)", duration: 0.5 }, "<")
    .to(DOM.title, { color: "hsl(268, 50%, 60%)", duration: 0.75 });

  // Welcome (prompt0) breathes out
  const welcomePrompt = DOM.prompts[0];
  if (welcomePrompt) {
    titleTimeline.fromTo(
      welcomePrompt,
      { 
        autoAlpha: 0, 
        scale: 0,
        visibility: "hidden"
      },
      { 
        autoAlpha: 1, 
        scale: 1,
        visibility: "visible",
        duration: CONFIG.breathOut, 
        ease: "power2.out",
        immediateRender: true,
        onStart: () => {
          console.log("🌬️ Welcome breathing out");
          if (window.AHLights) {
            window.AHLights.navigateToPrompt(0);
          }
        }
      }
    );
  }

  // ============================================================
  // BREATHING NAVIGATION
  // ============================================================
  
  function breatheIn(element) {
    console.log("🌬️ Breathing in...");
    return gsap.to(element, {
      scale: 0,
      autoAlpha: 0,
      duration: CONFIG.breathIn,
      ease: 'power2.in',
      transformOrigin: '50% 50%'
    });
  }
  
  function breatheOut(element) {
    console.log("🌬️ Breathing out...");
    return gsap.fromTo(element,
      { scale: 0, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        visibility: 'visible',
        duration: CONFIG.breathOut,
        ease: 'power2.out',
        transformOrigin: '50% 50%'
      }
    );
  }
  
  function navigateToPrompt(targetIndex) {
    if (State.isTransitioning) {
      console.log("⏳ Navigation blocked - transition in progress");
      return;
    }
    
    if (targetIndex < 0 || targetIndex >= DOM.prompts.length) {
      console.log("🚫 Invalid prompt index:", targetIndex);
      return;
    }
    
    State.isTransitioning = true;
    State.canNavigate = false;
    
    const currentPrompt = DOM.prompts[State.currentPromptIndex];
    const nextPrompt = DOM.prompts[targetIndex];
    
    console.log(`📖 Navigating prompts: ${State.currentPromptIndex} → ${targetIndex}`);
    
    const tl = gsap.timeline({
      onComplete: () => {
        State.currentPromptIndex = targetIndex;
        State.isTransitioning = false;
        
        setTimeout(() => {
          State.canNavigate = true;
          console.log("✅ Navigation ready");
        }, CONFIG.scrollCooldown);
        
        // Update stairway lights
        if (window.AHLights) {
          window.AHLights.navigateToPrompt(targetIndex);
        }
      }
    });
    
    // Breathe in current
    if (currentPrompt) {
      tl.add(breatheIn(currentPrompt), 0);
    }
    
    // Pause
    tl.to({}, { duration: CONFIG.breathPause });
    
    // Breathe out next
    tl.add(breatheOut(nextPrompt));
    
    return tl;
  }
  
  function navigateForward() {
    if (!State.canNavigate || !State.inPromptMode || State.enteredOracle) {
      console.log("⏸️ Forward navigation blocked");
      return;
    }
    
    const nextIndex = State.currentPromptIndex + 1;
    
    // If at last prompt, enter oracle
    if (nextIndex >= DOM.prompts.length) {
      console.log("🚪 Reached end - entering oracle");
      enterOracle();
      return;
    }
    
    navigateToPrompt(nextIndex);
  }
  
  function navigateBackward() {
    if (!State.canNavigate || !State.inPromptMode || State.enteredOracle) {
      console.log("⏸️ Backward navigation blocked");
      return;
    }
    
    const prevIndex = State.currentPromptIndex - 1;
    
    if (prevIndex < 0) {
      console.log("🚫 Already at first prompt");
      return;
    }
    
    navigateToPrompt(prevIndex);
  }

  // ============================================================
  // ORACLE ENTRY (after final prompt)
  // ============================================================
  
  function enterOracle() {
    if (State.enteredOracle) return;
    State.enteredOracle = true;
    State.canNavigate = false;
    
    console.log("🚪 Entering oracle...");
    
    gsap.set(document.documentElement, { cursor: "default" });
    
    const entryTl = gsap.timeline({
      defaults: { ease: "sine.inOut" }
    });
    
    // Hide current prompt
    const currentPrompt = DOM.prompts[State.currentPromptIndex];
    if (currentPrompt) {
      entryTl.to(currentPrompt, { autoAlpha: 0, scale: 0, duration: 0.4 });
    }
    
    // Remove overlay
    if (DOM.overlay) {
      entryTl.to(DOM.overlay, { autoAlpha: 0, duration: 0.5 }, "<");
    }
    
    // Start shader
    entryTl.add(revealShader, ">");
    
    // Dissolve temple
    if (DOM.temple) {
      entryTl.to(DOM.temple, { autoAlpha: 0, duration: 0.9 }, ">+0.3");
    }
    
    // Goddess glides in
    if (DOM.goddess) {
      entryTl.fromTo(
        DOM.goddess,
        {
          autoAlpha: 0,
          y: "-16vh",
          scale: 0.85
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1.8,
          ease: "power1.inOut",
          pointerEvents: "none",
          onStart: () => console.log("🌙 Goddess gliding in")
        },
        ">-0.4"
      );
    }
    
    // Show audio UI (audio OFF, user enables manually)
    entryTl.to(DOM.audioUI, { 
      autoAlpha: 1, 
      duration: 0.4, 
      onStart: () => {
        gsap.set(DOM.audioUI, { pointerEvents: "auto" });
        console.log("🎛️ Audio UI visible (audio OFF - user must enable)");
      }
    });
    
    // Begin divination sequence
    entryTl.add(() => {
      console.log("🔮 Starting divination sequence");
      divinationSequence();
    }, ">");
  }

  // ============================================================
  // DIVINATION SEQUENCE
  // ============================================================
  
  function divinationSequence() {
    console.log("🎯 Divination sequence starting");
    
    const nextScene = selectRandomScene();
    
    if (!nextScene) {
      console.error('❌ No scene available!');
      window.location.href = "/scenes/surrender-01";
      return;
    }
    
    // Save to history
    saveToHistory('opening-entry');
    
    const divinationTl = gsap.timeline({ 
      defaults: { ease: "sine.inOut" },
      onComplete: () => {
        console.log("🌀 Navigating to:", nextScene.url);
        window.location.href = nextScene.url;
      }
    });
    
    // Fade title
    if (DOM.title) {
      divinationTl.to(DOM.title, {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.in"
      });
    }
    
    // Goddess drops to dock
    if (DOM.goddess) {
      divinationTl.to(
        DOM.goddess,
        {
          y: "+=19vh",
          scale: 0.5,
          duration: 1.4,
          ease: "power2.inOut",
          onStart: () => console.log("🌙 Goddess dropping to dock")
        },
        "<"
      );
    }
    
    // Metatron shrinks and spins
    if (DOM.metatron) {
      divinationTl.to(DOM.metatron, {
        scale: 0.01,
        rotation: "+=720",
        duration: 2.6,
        ease: "power2.in",
        transformOrigin: "50% 50%",
        force3D: true,
        onStart: () => console.log("🌀 Metatron divination spiral")
      }, "-=0.4");
      
      // Fade shader
      if (DOM.shaderW) {
        divinationTl.to(DOM.shaderW, {
          autoAlpha: 0,
          duration: 1.4,
          ease: "power2.in"
        }, "-=1.82");
      }
    }
    
    // Fade Metatron shapes
    divinationTl.add(() => {
      const allShapes = document.querySelectorAll("#metatron polygon, #metatron polyline");
      gsap.to(allShapes, {
        opacity: 0,
        duration: 2.0,
        ease: "power2.in"
      });
    }, "-=2.0");
    
    divinationTl.to({}, { duration: 0.7 });
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  function handleWheel(e) {
    if (!State.inPromptMode || !State.canNavigate || State.enteredOracle) return;
    
    e.preventDefault();
    
    if (e.deltaY < 0) {
      console.log("⬆️ Scroll up detected");
      navigateBackward();
    } else if (e.deltaY > 0) {
      console.log("⬇️ Scroll down detected");
      navigateForward();
    }
  }
  
  function handleTouchStart(e) {
    if (!State.inPromptMode || State.enteredOracle) return;
    State.touchStartY = e.touches[0].clientY;
    State.touchStartX = e.touches[0].clientX;
  }
  
  function handleTouchEnd(e) {
    if (!State.canNavigate || !State.inPromptMode || State.enteredOracle) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    
    const deltaY = State.touchStartY - touchEndY;
    const deltaX = Math.abs(State.touchStartX - touchEndX);
    
    if (Math.abs(deltaY) < CONFIG.swipeMinDistance) return;
    if (deltaX > Math.abs(deltaY)) return;
    
    if (deltaY > 0) {
      console.log("👆 Swipe up detected");
      navigateForward();
    } else {
      console.log("👇 Swipe down detected");
      navigateBackward();
    }
  }
  
  function handleClick(e) {
    if (!State.inPromptMode || !State.canNavigate || State.enteredOracle) return;
    
    // Ignore clicks on UI elements
    if (DOM.audioUI && DOM.audioUI.contains(e.target)) return;
    if (DOM.goddess && DOM.goddess.contains(e.target)) return;
    if (DOM.audioToggle && DOM.audioToggle.contains(e.target)) return;
    
    // Determine click zone
    const clickY = e.clientY;
    const windowHeight = window.innerHeight;
    const topZone = windowHeight * 0.5;
    
    if (clickY < topZone) {
      console.log("👆 Top zone clicked - navigate backward");
      navigateBackward();
    } else {
      console.log("👇 Bottom zone clicked - navigate forward");
      navigateForward();
    }
  }
  
  async function handleAudioToggle(e) {
    e.stopPropagation();
    if (!DOM.bg) return;
    
    console.log("🎵 Audio toggle clicked");
    
    if (window.AHAudioState) {
      await window.AHAudioState.toggle(DOM.bg, DOM.audioIcon);
    } else {
      const isPlaying = !DOM.bg.paused;
      
      if (isPlaying) {
        gsap.to(DOM.bg, { 
          volume: 0, 
          duration: 0.3, 
          onComplete: () => DOM.bg.pause() 
        });
        if (DOM.audioIcon) gsap.to(DOM.audioIcon, { opacity: 0.4, duration: 0.3 });
      } else {
        try {
          if (DOM.bg.paused) await DOM.bg.play();
          gsap.to(DOM.bg, { volume: CONFIG.audioVolume, duration: 0.3 });
          if (DOM.audioIcon) gsap.to(DOM.audioIcon, { opacity: 1, duration: 0.3 });
        } catch (err) {
          console.warn("Audio play failed:", err);
        }
      }
    }
  }

  // ============================================================
  // ATTACH LISTENERS
  // ============================================================
  
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('click', handleClick);
  
  if (DOM.audioToggle) {
    DOM.audioToggle.addEventListener('click', handleAudioToggle);
  }

  console.log("✅ Entry sequence ready - title animation will begin");
});
