/*--------------------------------------------------------------
  Awakening Heart : Oracle Scene Controller v2.0
  Version: 2.0.0 | Date: 2025-11-18
  
  Complete oracle scene system with:
  - Bidirectional content navigation with breathing transitions
  - Meditation mode with goddess dock and facet animations
  - Goddess navigation toggle with state tracking
  - Center divination trigger with randomization
  - Weighted scene selection with 3-scene history
  - Audio orchestration (background, meditation, breath, SFX)
  
  CONTENT FLOW:
  Intro → Distinction → Quote → Share → Practice → Prompt0-4 → Meditation
  
  USER INTERACTIONS:
  - Scroll/Swipe: Navigate through content blocks
  - Click Goddess: Toggle between content and meditation
  - Click Center: Trigger divination (meditation only)
--------------------------------------------------------------*/

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    // Breathing animation timing (in seconds)
    breathIn: 0.8,
    breathPause: 0.2,
    breathOut: 1.2,
    
    // Navigation cooldown (in milliseconds)
    scrollCooldown: 300,
    
    // Audio volumes and fade durations
    audioVolume: 0.35,
    audioFadeDuration: 1.0,
    breathDuckAmount: 0.15, // -6dB ducking during breath
    
    // Goddess dock position (meditation mode)
    goddessDockY: '15vh',
    goddessDockScale: 0.5,
    
    // Meditation mode transition timing
    meditationTransitionDuration: 1.4,
    
    // Divination animation timing
    divinationDuration: 2.6,
    
    // Touch swipe detection (mobile)
    swipeMinDistance: 50,
    
    // LocalStorage keys
    storageKeys: {
      sceneHistory: 'ah_scene_history',
      lastContentBlock: 'ah_last_content_block',
      inMeditation: 'ah_in_meditation'
    }
  };

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  const State = {
    currentBlockIndex: 0,
    contentBlocks: [],
    inMeditation: false,
    canScroll: true,
    lastContentBlockBeforeMeditation: 0,
    
    // Touch tracking for mobile
    touchStartY: 0,
    touchStartX: 0,
    
    // Audio elements
    backgroundAudio: null,
    meditationAudio: null,
    breathAudio: null,
    
    // Animation tracking
    facetAnimation: null,
    isTransitioning: false
  };

  // ============================================================
  // DOM CACHE
  // ============================================================
  
  let DOM = {};
  
  function cacheDOM() {
    DOM = {
      // Core containers
      title: document.getElementById('ah-title'),
      metatron: document.getElementById('metatron'),
      metatronCenter: document.getElementById('P_C'),
      goddess: document.getElementById('triple-goddess-wrapper'),
      shader: document.getElementById('shader'),
      
      // Content blocks (in order)
      intro: document.getElementById('intro-text'),
      distinction: document.getElementById('distinction-text'),
      quote: document.getElementById('quote-text'),
      share: document.getElementById('share-text'),
      practice: document.getElementById('practice-text'),
      prompt0: document.getElementById('prompt0'),
      prompt1: document.getElementById('prompt1'),
      prompt2: document.getElementById('prompt2'),
      prompt3: document.getElementById('prompt3'),
      prompt4: document.getElementById('prompt4'),
      
      // Audio elements
      bgMusic: document.getElementById('bgMusic'),
      meditationMusic: document.getElementById('meditationMusic'),
      breathSound: document.getElementById('breathSound'),
      goddessClickSfx: document.getElementById('goddessClickSfx'),
      centerClickSfx: document.getElementById('centerClickSfx'),
      divinationSfx: document.getElementById('divinationSfx'),
      
      // UI elements
      audioToggle: document.getElementById('audioToggle'),
      audioIcon: document.querySelector('#audioToggle svg, #audioToggle .icon-On')
    };
    
    // Build content blocks array (filter out null elements)
    State.contentBlocks = [
      DOM.intro,
      DOM.distinction,
      DOM.quote,
      DOM.share,
      DOM.practice,
      DOM.prompt0,
      DOM.prompt1,
      DOM.prompt2,
      DOM.prompt3,
      DOM.prompt4
    ].filter(Boolean);
    
    console.log('📦 DOM cached:', {
      contentBlocks: State.contentBlocks.length,
      goddess: !!DOM.goddess,
      metatron: !!DOM.metatron,
      center: !!DOM.metatronCenter,
      audio: {
        background: !!DOM.bgMusic,
        meditation: !!DOM.meditationMusic,
        breath: !!DOM.breathSound
      }
    });
  }

  // ============================================================
  // SCENE POOL & RANDOMIZATION
  // ============================================================
  
  /**
   * Load available scenes from CMS collection list
   */
  function loadScenePool() {
    const items = document.querySelectorAll('.scene-pool-item');
    const pool = Array.from(items).map(item => ({
      id: item.dataset.sceneId,
      url: item.dataset.sceneUrl,
      weight: parseFloat(item.dataset.sceneWeight) || 1.0,
      realm: item.dataset.realm
    }));
    
    console.log('🎲 Scene pool loaded:', pool.length, 'scenes');
    return pool;
  }
  
  /**
   * Get current scene ID from URL
   */
  function getCurrentSceneId() {
    const path = window.location.pathname;
    const match = path.match(/\/scenes\/([^\/]+)/);
    return match ? match[1] : null;
  }
  
  /**
   * Get scene history from localStorage
   */
  function getSceneHistory() {
    try {
      const stored = localStorage.getItem(CONFIG.storageKeys.sceneHistory);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Could not read scene history:', e);
      return [];
    }
  }
  
  /**
   * Save scene to history (keep last 3)
   */
  function saveToHistory(sceneId) {
    try {
      let history = getSceneHistory();
      history.push(sceneId);
      
      // Keep only last 3
      if (history.length > 3) {
        history = history.slice(-3);
      }
      
      localStorage.setItem(CONFIG.storageKeys.sceneHistory, JSON.stringify(history));
      console.log('💾 Scene history updated:', history);
    } catch (e) {
      console.warn('Could not save scene history:', e);
    }
  }
  
  /**
   * Select next scene using weighted randomization
   * Excludes current scene and last 3 scenes from history
   */
  function selectNextScene() {
    const pool = loadScenePool();
    const currentId = getCurrentSceneId();
    const history = getSceneHistory();
    
    // Filter out current scene and history
    const excluded = [...history, currentId].filter(Boolean);
    const available = pool.filter(scene => !excluded.includes(scene.id));
    
    if (available.length === 0) {
      console.warn('⚠️ No available scenes after filtering!');
      // Fallback: use full pool minus current
      const fallback = pool.filter(scene => scene.id !== currentId);
      return fallback.length > 0 ? fallback[0] : null;
    }
    
    // Calculate total weight
    const totalWeight = available.reduce((sum, scene) => sum + scene.weight, 0);
    
    // Weighted random selection
    let random = Math.random() * totalWeight;
    
    for (const scene of available) {
      random -= scene.weight;
      if (random <= 0) {
        console.log('🎯 Next scene selected:', scene.id, `(weight: ${scene.weight})`);
        return scene;
      }
    }
    
    // Fallback (should never reach here)
    return available[0];
  }

  // ============================================================
  // AUDIO MANAGEMENT
  // ============================================================
  
  /**
   * Initialize audio with persistent state
   */
  async function initAudio() {
    if (!DOM.bgMusic) return;
    
    State.backgroundAudio = DOM.bgMusic;
    State.meditationAudio = DOM.meditationMusic;
    State.breathAudio = DOM.breathSound;
    
    // Get scene-specific audio URL
    const sceneAudioUrl = DOM.bgMusic.getAttribute('data-scene-audio') || DOM.bgMusic.src;
    
    // Use AHAudioState if available for persistence
    if (window.AHAudioState) {
      try {
        await window.AHAudioState.initAudio(DOM.bgMusic, DOM.audioIcon, sceneAudioUrl);
        console.log('🎵 Audio initialized with persistent state');
      } catch (e) {
        console.warn('Audio init failed:', e);
      }
    } else {
      // Fallback: just set up audio element
      DOM.bgMusic.volume = CONFIG.audioVolume;
      DOM.bgMusic.loop = true;
      console.log('🎵 Audio initialized (no persistence)');
    }
    
    // Setup meditation audio if present
    if (State.meditationAudio) {
      State.meditationAudio.volume = 0;
      State.meditationAudio.loop = true;
    }
    
    // Setup breath audio if present
    if (State.breathAudio) {
      State.breathAudio.volume = CONFIG.audioVolume;
    }
  }
  
  /**
   * Play breath sound with ducking on background audio
   */
  function playBreathSound() {
    if (!State.breathAudio || !State.backgroundAudio) return;
    
    // Duck background audio
    const originalVolume = State.backgroundAudio.volume;
    gsap.to(State.backgroundAudio, {
      volume: originalVolume * (1 - CONFIG.breathDuckAmount),
      duration: 0.2,
      onComplete: () => {
        // Restore volume after breath completes
        gsap.to(State.backgroundAudio, {
          volume: originalVolume,
          duration: 0.3,
          delay: CONFIG.breathIn + CONFIG.breathPause + CONFIG.breathOut - 0.5
        });
      }
    });
    
    // Play breath sound
    State.breathAudio.currentTime = 0;
    State.breathAudio.play().catch(e => console.warn('Breath sound failed:', e));
  }
  
  /**
   * Crossfade from background to meditation audio
   */
  async function crossfadeToMeditation() {
    // If no meditation audio, just continue background
    if (!State.meditationAudio) {
      console.log('🎵 No meditation audio - continuing background');
      return;
    }
    
    // Check if user has audio enabled
    const audioState = window.AHAudioState ? window.AHAudioState.getState() : { isPlaying: !State.backgroundAudio.paused };
    
    if (!audioState.isPlaying) {
      console.log('🔇 Audio paused - skipping crossfade');
      return;
    }
    
    console.log('🎵 Crossfading to meditation audio');
    
    try {
      // Start meditation audio at 0 volume
      State.meditationAudio.currentTime = 0;
      State.meditationAudio.volume = 0;
      await State.meditationAudio.play();
      
      // Crossfade
      gsap.to(State.backgroundAudio, {
        volume: 0,
        duration: CONFIG.audioFadeDuration,
        onComplete: () => State.backgroundAudio.pause()
      });
      
      gsap.to(State.meditationAudio, {
        volume: CONFIG.audioVolume,
        duration: CONFIG.audioFadeDuration
      });
    } catch (e) {
      console.warn('Meditation audio crossfade failed:', e);
    }
  }
  
  /**
   * Crossfade from meditation back to background audio
   */
  async function crossfadeToBackground() {
    if (!State.meditationAudio || State.meditationAudio.paused) {
      console.log('🎵 No meditation audio playing - continuing background');
      return;
    }
    
    console.log('🎵 Crossfading back to background audio');
    
    try {
      // Resume background audio at 0 volume
      State.backgroundAudio.currentTime = 0;
      State.backgroundAudio.volume = 0;
      await State.backgroundAudio.play();
      
      // Crossfade
      gsap.to(State.meditationAudio, {
        volume: 0,
        duration: CONFIG.audioFadeDuration,
        onComplete: () => State.meditationAudio.pause()
      });
      
      gsap.to(State.backgroundAudio, {
        volume: CONFIG.audioVolume,
        duration: CONFIG.audioFadeDuration
      });
    } catch (e) {
      console.warn('Background audio crossfade failed:', e);
    }
  }
  
  /**
   * Play SFX sound
   */
  function playSfx(sfxElement) {
    if (!sfxElement) return;
    
    sfxElement.currentTime = 0;
    sfxElement.volume = 0.5;
    sfxElement.play().catch(e => console.warn('SFX play failed:', e));
  }

  // ============================================================
  // CONTENT NAVIGATION
  // ============================================================
  
  /**
   * Get the total breathing transition duration
   */
  function getBreathingDuration() {
    return CONFIG.breathIn + CONFIG.breathPause + CONFIG.breathOut;
  }
  
  /**
   * Breathing animation: scale from/to 0, center origin
   * IN: 0 → 1 (breathe out)
   * OUT: 1 → 0 (breathe in)
   */
  function breatheIn(element) {
    return gsap.to(element, {
      scale: 0,
      duration: CONFIG.breathIn,
      ease: 'power2.in',
      transformOrigin: '50% 50%'
    });
  }
  
  function breatheOut(element) {
    return gsap.fromTo(element,
      { scale: 0, autoAlpha: 1 },
      {
        scale: 1,
        duration: CONFIG.breathOut,
        ease: 'power2.out',
        transformOrigin: '50% 50%'
      }
    );
  }
  
  /**
   * Navigate to a specific content block with breathing transition
   */
  function navigateToBlock(targetIndex) {
    if (State.isTransitioning) return;
    if (targetIndex < 0 || targetIndex >= State.contentBlocks.length) return;
    
    State.isTransitioning = true;
    State.canScroll = false;
    
    const currentBlock = State.contentBlocks[State.currentBlockIndex];
    const nextBlock = State.contentBlocks[targetIndex];
    
    console.log(`📖 Navigating: ${State.currentBlockIndex} → ${targetIndex}`);
    
    // Create breathing transition timeline
    const tl = gsap.timeline({
      onComplete: () => {
        State.currentBlockIndex = targetIndex;
        State.isTransitioning = false;
        
        // Re-enable scrolling after cooldown
        setTimeout(() => {
          State.canScroll = true;
        }, CONFIG.scrollCooldown);
      }
    });
    
    // Play breath sound
    tl.add(() => playBreathSound());
    
    // Current block breathes IN (contracts to center)
    if (currentBlock) {
      tl.add(breatheIn(currentBlock), 0);
    }
    
    // Brief pause
    tl.to({}, { duration: CONFIG.breathPause });
    
    // Next block breathes OUT (expands from center)
    tl.add(breatheOut(nextBlock));
    
    return tl;
  }
  
  /**
   * Navigate forward through content
   */
  function navigateForward() {
    if (!State.canScroll || State.inMeditation) return;
    
    const nextIndex = State.currentBlockIndex + 1;
    
    // If at last block, trigger meditation mode
    if (nextIndex >= State.contentBlocks.length) {
      console.log('📿 Reached end of content - entering meditation');
      enterMeditationMode();
      return;
    }
    
    navigateToBlock(nextIndex);
  }
  
  /**
   * Navigate backward through content
   */
  function navigateBackward() {
    if (!State.canScroll || State.inMeditation) return;
    
    const prevIndex = State.currentBlockIndex - 1;
    
    // Locked at first block
    if (prevIndex < 0) {
      console.log('🔒 Already at first block');
      return;
    }
    
    navigateToBlock(prevIndex);
  }

  // ============================================================
  // MEDITATION MODE
  // ============================================================
  
  /**
   * Start facet animation pattern
   */
  function startFacetAnimation() {
    if (!window.metatron || !window.AHCONFIG) {
      console.warn('⚠️ Metatron engine or config not available');
      return;
    }
    
    console.log('✨ Starting facet animation pattern');
    
    // Use scene config or fallback to sequential pattern
    const facetConfig = window.AHCONFIG.facets || {
      pattern: 'sequential',
      ids: [
        'F_O_TRI1_T', 'F_O_TRI2_T',
        'F_I_BG_TR', 'F_I_OCT_TR', 'F_I_TRI1_TR', 'F_I_TRI2_TR',
        'F_I_OCT_R', 'F_I_BG_R',
        'F_O_TRI1_BR', 'F_O_TRI2_BR',
        'F_I_BG_BR', 'F_I_OCT_BR',
        'F_I_TRI1_B', 'F_I_TRI2_B',
        'F_I_OCT_BL', 'F_I_BG_BL',
        'F_O_TRI1_BL', 'F_O_TRI2_BL',
        'F_I_BG_L', 'F_I_OCT_L',
        'F_I_TRI1_TL', 'F_I_TRI2_TL',
        'F_I_OCT_TL', 'F_I_BG_TL'
      ],
      options: {
        fill: '#77ffcc',
        duration: 1.4,
        stagger: 0.10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      }
    };
    
    if (window.metatron.startFacets) {
      window.metatron.startFacets(facetConfig);
    }
  }
  
  /**
   * Stop facet animation pattern
   */
  function stopFacetAnimation() {
    if (window.metatron && window.metatron.stopFacets) {
      console.log('🛑 Stopping facet animation');
      window.metatron.stopFacets();
    }
  }
  
  /**
   * Enter meditation mode
   * - Goddess drops to dock position
   * - Metatron teleports from top to center
   * - Title breathes back to center
   * - Meditation audio crossfades in
   * - Facet animation starts
   * - Center becomes clickable
   */
  function enterMeditationMode() {
    if (State.inMeditation) return;
    
    console.log('🧘 Entering meditation mode');
    
    // Save state
    State.lastContentBlockBeforeMeditation = State.currentBlockIndex;
    State.inMeditation = true;
    State.canScroll = false;
    
    try {
      localStorage.setItem(CONFIG.storageKeys.lastContentBlock, State.currentBlockIndex);
      localStorage.setItem(CONFIG.storageKeys.inMeditation, 'true');
    } catch (e) {
      console.warn('Could not save meditation state:', e);
    }
    
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        console.log('✅ Meditation mode active');
        enableCenterDivination();
      }
    });
    
    // Hide current content block
    const currentBlock = State.contentBlocks[State.currentBlockIndex];
    if (currentBlock) {
      tl.to(currentBlock, {
        autoAlpha: 0,
        scale: 0,
        duration: 0.6,
        ease: 'power2.in'
      }, 0);
    }
    
    // Goddess drops to dock position
    if (DOM.goddess) {
      tl.to(DOM.goddess, {
        y: CONFIG.goddessDockY,
        scale: CONFIG.goddessDockScale,
        duration: CONFIG.meditationTransitionDuration,
        ease: 'power2.inOut',
        onStart: () => console.log('🌙 Goddess dropping to dock'),
        onComplete: () => {
          gsap.set(DOM.goddess, { 
            cursor: 'pointer',
            pointerEvents: 'auto' 
          });
        }
      }, 0.2);
    }
    
    // Metatron teleport sequence
    // Phase 1: Shrink at current position (top)
    // Phase 2: Instant reposition to center
    // Phase 3: Grow at center
    if (DOM.metatron) {
      // Phase 1: Shrink
      tl.to(DOM.metatron, {
        scale: 0.01,
        duration: 0.7,
        ease: 'power2.in',
        onStart: () => console.log('🌀 Metatron teleporting')
      }, 0.3);
      
      // Phase 2: Reposition (instant)
      tl.set(DOM.metatron, {
        y: 0, // Reset to center position
        x: 0
      });
      
      // Phase 3: Grow
      tl.to(DOM.metatron, {
        scale: 1.25,
        duration: 0.9,
        ease: 'power2.out'
      });
    }
    
    // Title breathes back to center
    if (DOM.title) {
      tl.fromTo(DOM.title,
        { scale: 0, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 1.0,
          ease: 'power2.out'
        },
        '-=0.5'
      );
    }
    
    // Start meditation audio crossfade
    tl.add(() => crossfadeToMeditation(), '-=0.8');
    
    // Start facet animation
    tl.add(() => startFacetAnimation(), '-=0.3');
  }
  
  /**
   * Exit meditation mode and return to content
   */
  function exitMeditationMode() {
    if (!State.inMeditation) return;
    
    console.log('📖 Exiting meditation mode');
    
    // Disable center divination
    disableCenterDivination();
    
    // Stop facet animation
    stopFacetAnimation();
    
    // Determine which block to return to
    let returnIndex = State.lastContentBlockBeforeMeditation;
    
    // Special case: If entered meditation from final prompt, return to prompt0
    const finalPromptIndex = State.contentBlocks.length - 1;
    if (State.lastContentBlockBeforeMeditation === finalPromptIndex) {
      // Find prompt0 index
      const prompt0Index = State.contentBlocks.findIndex(block => block === DOM.prompt0);
      if (prompt0Index !== -1) {
        returnIndex = prompt0Index;
        console.log('🔄 Returning to Prompt0 (entered from final prompt)');
      }
    }
    
    State.inMeditation = false;
    State.canScroll = false;
    
    try {
      localStorage.setItem(CONFIG.storageKeys.inMeditation, 'false');
    } catch (e) {
      console.warn('Could not save meditation state:', e);
    }
    
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        State.currentBlockIndex = returnIndex;
        State.canScroll = true;
        console.log('✅ Returned to content');
      }
    });
    
    // Hide title
    if (DOM.title) {
      tl.to(DOM.title, {
        autoAlpha: 0,
        scale: 0,
        duration: 0.6,
        ease: 'power2.in'
      }, 0);
    }
    
    // Goddess rises back to original position
    if (DOM.goddess) {
      tl.to(DOM.goddess, {
        y: 0,
        scale: 1,
        duration: CONFIG.meditationTransitionDuration,
        ease: 'power2.inOut',
        onStart: () => console.log('🌙 Goddess rising'),
        onComplete: () => {
          gsap.set(DOM.goddess, { cursor: 'pointer' });
        }
      }, 0.2);
    }
    
    // Metatron teleport back to top
    if (DOM.metatron) {
      // Shrink at center
      tl.to(DOM.metatron, {
        scale: 0.01,
        duration: 0.7,
        ease: 'power2.in',
        onStart: () => console.log('🌀 Metatron returning to top')
      }, 0.3);
      
      // Instant reposition
      tl.set(DOM.metatron, {
        y: '-30vh', // Back to top position (adjust as needed)
        x: 0
      });
      
      // Grow at top
      tl.to(DOM.metatron, {
        scale: 1,
        duration: 0.9,
        ease: 'power2.out'
      });
    }
    
    // Crossfade audio back to background
    tl.add(() => crossfadeToBackground(), '-=0.8');
    
    // Reveal content block with breathing animation
    const targetBlock = State.contentBlocks[returnIndex];
    if (targetBlock) {
      tl.add(() => breatheOut(targetBlock), '-=0.3');
    }
  }

  // ============================================================
  // CENTER DIVINATION
  // ============================================================
  
  /**
   * Enable center click for divination
   */
  function enableCenterDivination() {
    if (!DOM.metatronCenter) {
      console.warn('⚠️ Metatron center (P_C) not found');
      return;
    }
    
    console.log('🎯 Center divination enabled');
    
    gsap.set(DOM.metatronCenter, {
      cursor: 'pointer',
      pointerEvents: 'auto',
      opacity: 0.8
    });
    
    // Gentle pulse to indicate interactivity
    gsap.to(DOM.metatronCenter, {
      opacity: 1,
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      transformOrigin: 'center center'
    });
  }
  
  /**
   * Disable center divination
   */
  function disableCenterDivination() {
    if (!DOM.metatronCenter) return;
    
    gsap.killTweensOf(DOM.metatronCenter);
    gsap.set(DOM.metatronCenter, {
      pointerEvents: 'none',
      opacity: 0
    });
  }
  
  /**
   * Trigger divination sequence and navigate to next scene
   */
  function triggerDivination() {
    console.log('🔮 Divination triggered');
    
    // Play divination SFX
    playSfx(DOM.divinationSfx);
    
    // Disable further clicks
    disableCenterDivination();
    
    // Select next scene
    const nextScene = selectNextScene();
    
    if (!nextScene) {
      console.error('❌ No next scene available!');
      return;
    }
    
    // Save current scene to history
    const currentId = getCurrentSceneId();
    if (currentId) {
      saveToHistory(currentId);
    }
    
    // Divination animation sequence
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        console.log('🌀 Navigating to:', nextScene.url);
        window.location.href = nextScene.url;
      }
    });
    
    // Brief ritual animation - center pulses and expands
    tl.to(DOM.metatronCenter, {
      scale: 1.5,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out'
    })
    .to(DOM.metatronCenter, {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in'
    })
    .to({}, { duration: 0.3 }); // Brief pause
    
    // Fade out shader
    if (DOM.shader) {
      tl.to(DOM.shader, {
        autoAlpha: 0,
        duration: 1.0,
        ease: 'power2.in'
      }, '-=0.8');
    }
    
    // Metatron spins and shrinks
    if (DOM.metatron) {
      tl.to(DOM.metatron, {
        scale: 0.01,
        rotation: '+=360',
        duration: CONFIG.divinationDuration,
        ease: 'power2.in',
        force3D: true
      }, '-=1.0');
    }
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  /**
   * Mouse wheel handler (desktop)
   */
  function handleWheel(e) {
    if (State.inMeditation || !State.canScroll) return;
    
    e.preventDefault();
    
    if (e.deltaY < 0) {
      // Scrolling up
      navigateBackward();
    } else if (e.deltaY > 0) {
      // Scrolling down
      navigateForward();
    }
  }
  
  /**
   * Touch handlers (mobile)
   */
  function handleTouchStart(e) {
    if (State.inMeditation) return;
    
    State.touchStartY = e.touches[0].clientY;
    State.touchStartX = e.touches[0].clientX;
  }
  
  function handleTouchEnd(e) {
    if (State.inMeditation || !State.canScroll) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    
    const deltaY = State.touchStartY - touchEndY;
    const deltaX = Math.abs(State.touchStartX - touchEndX);
    
    // Only trigger if vertical swipe is dominant and meets minimum distance
    if (Math.abs(deltaY) < CONFIG.swipeMinDistance) return;
    if (deltaX > Math.abs(deltaY)) return; // Horizontal swipe, ignore
    
    if (deltaY > 0) {
      // Swiped up (scroll forward)
      navigateForward();
    } else {
      // Swiped down (scroll backward)
      navigateBackward();
    }
  }
  
  /**
   * Goddess click handler
   */
  function handleGoddessClick(e) {
    e.stopPropagation();
    
    console.log('🌙 Goddess clicked');
    playSfx(DOM.goddessClickSfx);
    
    // Pulse animation
    const fullCircle = DOM.goddess.querySelector('#full-circle');
    if (fullCircle) {
      gsap.to(fullCircle, {
        scale: 1.15,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        transformOrigin: '50% 50%',
        ease: 'power2.inOut'
      });
    }
    
    // Toggle meditation state
    if (State.inMeditation) {
      exitMeditationMode();
    } else {
      enterMeditationMode();
    }
  }
  
  /**
   * Center click handler (divination)
   */
  function handleCenterClick(e) {
    e.stopPropagation();
    
    if (!State.inMeditation) return;
    
    console.log('🎯 Center clicked');
    playSfx(DOM.centerClickSfx);
    
    triggerDivination();
  }
  
  /**
   * Audio toggle handler
   */
  async function handleAudioToggle(e) {
    e.stopPropagation();
    
    if (!State.backgroundAudio) return;
    
    if (window.AHAudioState) {
      await window.AHAudioState.toggle(State.backgroundAudio, DOM.audioIcon);
    } else {
      // Fallback toggle
      const isPlaying = !State.backgroundAudio.paused;
      
      if (isPlaying) {
        gsap.to(State.backgroundAudio, {
          volume: 0,
          duration: 0.3,
          onComplete: () => State.backgroundAudio.pause()
        });
        if (DOM.audioIcon) {
          gsap.to(DOM.audioIcon, { opacity: 0.4, duration: 0.3 });
        }
      } else {
        try {
          if (State.backgroundAudio.paused) {
            await State.backgroundAudio.play();
          }
          gsap.to(State.backgroundAudio, {
            volume: CONFIG.audioVolume,
            duration: 0.3
          });
          if (DOM.audioIcon) {
            gsap.to(DOM.audioIcon, { opacity: 1, duration: 0.3 });
          }
        } catch (err) {
          console.warn('Audio play failed:', err);
        }
      }
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  /**
   * Setup initial state and visibility
   */
  function setupInitialState() {
    console.log('🎬 Setting up initial scene state');
    
    // Hide all content blocks except first
    State.contentBlocks.forEach((block, index) => {
      if (index === 0) {
        gsap.set(block, { autoAlpha: 1, scale: 1 });
      } else {
        gsap.set(block, { autoAlpha: 0, scale: 0 });
      }
    });
    
    // Set goddess initial state
    if (DOM.goddess) {
      gsap.set(DOM.goddess, {
        y: 0,
        scale: 1,
        cursor: 'pointer',
        pointerEvents: 'auto',
        transformOrigin: '50% 50%'
      });
    }
    
    // Set metatron initial state (at top)
    if (DOM.metatron) {
      gsap.set(DOM.metatron, {
        y: '0vh',
        scale: 1,
        transformOrigin: '50% 50%',
        force3D: true
      });
    }
    
    // Set title initial state
    if (DOM.title) {
      gsap.set(DOM.title, { autoAlpha: 1 });
    }
    
    // Disable center initially
    if (DOM.metatronCenter) {
      gsap.set(DOM.metatronCenter, {
        pointerEvents: 'none',
        opacity: 0
      });
    }
    
    // Check if we're restoring meditation state
    try {
      const wasInMeditation = localStorage.getItem(CONFIG.storageKeys.inMeditation) === 'true';
      if (wasInMeditation) {
        console.log('🔄 Restoring meditation state');
        // Note: We don't auto-restore meditation mode on page load
        // User needs to navigate there again
        localStorage.setItem(CONFIG.storageKeys.inMeditation, 'false');
      }
    } catch (e) {
      console.warn('Could not check meditation state:', e);
    }
  }
  
  /**
   * Attach all event listeners
   */
  function attachEventListeners() {
    console.log('🔗 Attaching event listeners');
    
    // Wheel events (desktop)
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events (mobile)
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Goddess click
    if (DOM.goddess) {
      DOM.goddess.addEventListener('click', handleGoddessClick);
    }
    
    // Center click
    if (DOM.metatronCenter) {
      DOM.metatronCenter.addEventListener('click', handleCenterClick);
    }
    
    // Audio toggle
    if (DOM.audioToggle) {
      DOM.audioToggle.addEventListener('click', handleAudioToggle);
    }
  }
  
  /**
   * Main initialization
   */
  async function init() {
    console.log('💖 Oracle Scene Controller v2.0 initializing...');
    
    // Cache DOM elements
    cacheDOM();
    
    // Setup initial state
    setupInitialState();
    
    // Initialize audio
    await initAudio();
    
    // Attach event listeners
    attachEventListeners();
    
    // Start scene animations if configured
    if (window.metatron && window.AHCONFIG) {
      const timing = window.AHCONFIG.timing || {};
      
      // Note: We don't auto-start facets here - they start in meditation mode
      // But we do start portals if configured
      if (timing.portalsDelay !== undefined) {
        setTimeout(() => {
          if (window.metatron.startPortals) {
            window.metatron.startPortals(window.AHCONFIG.portals);
          }
        }, timing.portalsDelay * 1000);
      }
    }
    
    console.log('✨ Oracle Scene Controller ready');
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
