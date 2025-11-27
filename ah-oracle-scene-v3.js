/*--------------------------------------------------------------
  Awakening Heart : Oracle Scene Controller
  Version: 4.0.0 | Date: 2025-11-27
  
  CHANGES in v4.0:
  - Click navigation with top/bottom zones (top=back, bottom=forward)
  - Metatron breathes out on scene entry (consistent with content blocks)
  - Enhanced randomizer debugging
  - Skips empty content blocks during navigation
  - No audio autoplay - user enables manually
  
  COMPLETE CYCLICAL FLOW:
  Entry Scene → Divination → New Scene Entry → Content Navigation → 
  Meditation Mode → Divination → (cycle repeats)
--------------------------------------------------------------*/

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    breathIn: 0.8,
    breathPause: 0.2,
    breathOut: 1.2,
    scrollCooldown: 300,
    audioVolume: 0.35,
    audioFadeDuration: 1.0,
    breathDuckAmount: 0.15,
    goddessDockY: '20vh',
    goddessDockScale: 0.5,
    goddessCenterY: 0,
    goddessCenterScale: 1.0,
    metatronContentOpacity: 0.3,
    metatronMeditationOpacity: 1.0,
    metatronScale: 1.25,
    sceneEntryDuration: 2.0,
    metatronBreatheDuration: 1.2,
    meditationTransitionDuration: 1.4,
    divinationDuration: 2.6,
    swipeMinDistance: 50,
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
    sceneEntryComplete: false,
    touchStartY: 0,
    touchStartX: 0,
    backgroundAudio: null,
    meditationAudio: null,
    breathAudio: null,
    facetAnimation: null,
    isTransitioning: false
  };

  // ============================================================
  // DOM CACHE
  // ============================================================
  
  let DOM = {};
  
  function hasContent(element) {
    if (!element) return false;
    const text = element.textContent?.trim() || '';
    if (text.length > 0) return true;
    const hasImages = element.querySelector('img') !== null;
    const hasSvg = element.querySelector('svg') !== null;
    return hasImages || hasSvg;
  }
  
  function cacheDOM() {
    DOM = {
      title: document.getElementById('ah-title'),
      metatron: document.getElementById('metatron'),
      metatronCenter: document.getElementById('P_C'),
      goddess: document.getElementById('triple-goddess-wrapper'),
      shader: document.querySelector('.shader-wrapper') || document.getElementById('shader'),
      
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
      
      bgMusic: document.getElementById('bgMusic'),
      meditationMusic: document.getElementById('meditationMusic'),
      breathSound: document.getElementById('breathSound'),
      goddessClickSfx: document.getElementById('goddessClickSfx'),
      centerClickSfx: document.getElementById('centerClickSfx'),
      divinationSfx: document.getElementById('divinationSfx'),
      
      audioToggle: document.getElementById('audioToggle'),
      audioIcon: document.querySelector('#audioToggle svg, #audioToggle .icon-On')
    };
    
    const allBlocks = [
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
    ];
    
    State.contentBlocks = allBlocks.filter(hasContent);
    
    console.log('📦 DOM cached:', {
      totalBlocks: allBlocks.length,
      blocksWithContent: State.contentBlocks.length,
      emptyBlocks: allBlocks.length - State.contentBlocks.length,
      goddess: !!DOM.goddess,
      metatron: !!DOM.metatron,
      center: !!DOM.metatronCenter,
      shader: !!DOM.shader
    });
    
    const blockNames = ['intro', 'distinction', 'quote', 'share', 'practice', 
                        'prompt0', 'prompt1', 'prompt2', 'prompt3', 'prompt4'];
    const contentStatus = allBlocks.map((block, i) => ({
      name: blockNames[i],
      hasContent: hasContent(block)
    }));
    
    console.log('📝 Content blocks status:', contentStatus);
  }

  // ============================================================
  // SCENE POOL & RANDOMIZATION
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
    console.log('🎲 Scene pool loaded:', validPool.length, 'valid oracle scenes');
    console.log('📋 Pool contents:', validPool.map(s => ({ id: s.id, weight: s.weight })));
    
    return validPool;
  }
  
  function getCurrentSceneId() {
    const path = window.location.pathname;
    const match = path.match(/\/scenes\/([^\/]+)/);
    const id = match ? match[1] : null;
    console.log('📍 Current scene ID:', id);
    return id;
  }
  
  function getSceneHistory() {
    try {
      const stored = localStorage.getItem(CONFIG.storageKeys.sceneHistory);
      const history = stored ? JSON.parse(stored) : [];
      console.log('📚 Scene history:', history);
      return history;
    } catch (e) {
      console.warn('⚠️ Could not read scene history:', e);
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
      localStorage.setItem(CONFIG.storageKeys.sceneHistory, JSON.stringify(history));
      console.log('💾 Scene history updated:', history);
    } catch (e) {
      console.warn('⚠️ Could not save scene history:', e);
    }
  }
  
  function selectNextScene() {
    const pool = loadScenePool();
    const currentId = getCurrentSceneId();
    const history = getSceneHistory();
    
    const excluded = [...history, currentId].filter(Boolean);
    console.log('🚫 Excluding from selection:', excluded);
    
    const available = pool.filter(scene => !excluded.includes(scene.id));
    
    console.log('✅ Available scenes:', available.length, '/', pool.length);
    console.log('📋 Available scene IDs:', available.map(s => s.id));
    
    if (available.length === 0) {
      console.warn('⚠️ No available scenes after exclusion - using fallback');
      const fallback = pool.filter(scene => scene.id !== currentId);
      if (fallback.length > 0) {
        console.log('🎯 Fallback scene:', fallback[0].id);
        return fallback[0];
      }
      console.error('❌ No fallback available!');
      return null;
    }
    
    const totalWeight = available.reduce((sum, scene) => sum + scene.weight, 0);
    let random = Math.random() * totalWeight;
    
    console.log('🎰 Weighted random selection:', random.toFixed(2), '/', totalWeight.toFixed(2));
    
    for (const scene of available) {
      random -= scene.weight;
      if (random <= 0) {
        console.log('🎯 Selected scene:', scene.id, `(weight: ${scene.weight})`);
        console.log('📍 Navigating to:', scene.url);
        return scene;
      }
    }
    
    const fallback = available[0];
    console.log('🎯 Fallback to first available:', fallback.id);
    return fallback;
  }

  // ============================================================
  // AUDIO MANAGEMENT
  // ============================================================
  
  async function initAudio() {
    if (!DOM.bgMusic) return;
    
    State.backgroundAudio = DOM.bgMusic;
    State.meditationAudio = DOM.meditationMusic;
    State.breathAudio = DOM.breathSound;
    
    const sceneAudioUrl = DOM.bgMusic.getAttribute('data-scene-audio') || DOM.bgMusic.src;
    
    if (window.AHAudioState) {
      try {
        await window.AHAudioState.initAudio(DOM.bgMusic, DOM.audioIcon, sceneAudioUrl);
        console.log('🎵 Audio initialized (OFF by default, user must enable)');
      } catch (e) {
        console.warn('⚠️ Audio init failed:', e);
      }
    } else {
      DOM.bgMusic.volume = 0;
      DOM.bgMusic.pause();
      DOM.bgMusic.loop = true;
      console.log('🎵 Audio initialized without state manager (OFF)');
    }
    
    if (State.meditationAudio) {
      State.meditationAudio.volume = 0;
      State.meditationAudio.loop = true;
    }
    
    if (State.breathAudio) {
      State.breathAudio.volume = CONFIG.audioVolume;
    }
  }
  
  function playBreathSound() {
    if (!State.breathAudio || !State.backgroundAudio) return;
    
    const audioEnabled = window.AHAudioState 
      ? window.AHAudioState.getState().isPlaying 
      : !State.backgroundAudio.paused;
    
    if (!audioEnabled) return;
    
    const originalVolume = State.backgroundAudio.volume;
    gsap.to(State.backgroundAudio, {
      volume: originalVolume * (1 - CONFIG.breathDuckAmount),
      duration: 0.2,
      onComplete: () => {
        gsap.to(State.backgroundAudio, {
          volume: originalVolume,
          duration: 0.3,
          delay: CONFIG.breathIn + CONFIG.breathPause + CONFIG.breathOut - 0.5
        });
      }
    });
    
    State.breathAudio.currentTime = 0;
    State.breathAudio.play().catch(e => console.warn('⚠️ Breath sound failed:', e));
  }
  
  async function crossfadeToMeditation() {
    if (!State.meditationAudio) return;
    
    const audioState = window.AHAudioState ? window.AHAudioState.getState() : { isPlaying: !State.backgroundAudio.paused };
    if (!audioState.isPlaying) {
      console.log('⏭️ Skipping meditation crossfade - audio OFF');
      return;
    }
    
    console.log('🎵 Crossfading to meditation audio');
    
    try {
      State.meditationAudio.currentTime = 0;
      State.meditationAudio.volume = 0;
      await State.meditationAudio.play();
      
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
      console.warn('⚠️ Meditation audio crossfade failed:', e);
    }
  }
  
  async function crossfadeToBackground() {
    if (!State.meditationAudio || State.meditationAudio.paused) return;
    
    console.log('🎵 Crossfading back to background audio');
    
    try {
      State.backgroundAudio.currentTime = 0;
      State.backgroundAudio.volume = 0;
      await State.backgroundAudio.play();
      
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
      console.warn('⚠️ Background audio crossfade failed:', e);
    }
  }
  
  function playSfx(sfxElement) {
    if (!sfxElement) return;
    sfxElement.currentTime = 0;
    sfxElement.volume = 0.5;
    sfxElement.play().catch(e => console.warn('⚠️ SFX play failed:', e));
  }

  // ============================================================
  // SCENE ENTRY ANIMATION (Metatron breathes out)
  // ============================================================
  
  async function playSceneEntryAnimation() {
    console.log('🎬 Playing scene entry animation (Metatron breathes out)');
    
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => {
          State.sceneEntryComplete = true;
          State.canScroll = true;
          console.log('✅ Scene entry complete - content mode active');
          resolve();
        }
      });
      
      // Metatron BREATHES OUT from tiny center (consistent with content blocks)
      if (DOM.metatron) {
        tl.fromTo(DOM.metatron,
          {
            scale: 0,
            autoAlpha: 0,
            transformOrigin: '50% 50%',
            force3D: true
          },
          {
            scale: CONFIG.metatronScale,
            autoAlpha: 1.0,
            duration: CONFIG.metatronBreatheDuration,
            ease: 'power2.out',
            onStart: () => console.log('🌬️ Metatron breathing out')
          },
          0
        );
      }
      
      // Shader fades IN
      if (DOM.shader) {
        tl.fromTo(DOM.shader,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 1.0,
            ease: 'sine.inOut'
          },
          '-=0.8'
        );
      }
      
      // Metatron dims to content mode
      if (DOM.metatron) {
        tl.to(DOM.metatron, {
          opacity: CONFIG.metatronContentOpacity,
          visibility: 'visible',
          duration: 0.6,
          ease: 'sine.out'
        });
      }
      
      // Title breathes out
      if (DOM.title) {
        tl.fromTo(DOM.title,
          { autoAlpha: 0, scale: 0 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: CONFIG.breathOut,
            ease: 'power2.out'
          },
          '-=0.4'
        );
      }
      
      // First content block breathes out
      const firstBlock = State.contentBlocks[0];
      if (firstBlock) {
        tl.fromTo(firstBlock,
          { autoAlpha: 0, scale: 0 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: CONFIG.breathOut,
            ease: 'power2.out',
            transformOrigin: '50% 50%'
          },
          '-=0.2'
        );
      } else {
        console.log('ℹ️ No content blocks to animate');
      }
      
      if (tl.totalDuration() === 0) {
        console.warn('⚠️ Scene entry timeline is empty, resolving immediately');
        State.sceneEntryComplete = true;
        State.canScroll = true;
        resolve();
      }
    });
  }

  // ============================================================
  // CONTENT NAVIGATION
  // ============================================================
  
  function breatheIn(element) {
    console.log('🌬️ Content breathing in');
    return gsap.to(element, {
      scale: 0,
      duration: CONFIG.breathIn,
      ease: 'power2.in',
      transformOrigin: '50% 50%'
    });
  }
  
  function breatheOut(element) {
    console.log('🌬️ Content breathing out');
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
  
  function navigateToBlock(targetIndex) {
    if (State.isTransitioning) {
      console.log('⏳ Navigation blocked - transition in progress');
      return;
    }
    if (targetIndex < 0 || targetIndex >= State.contentBlocks.length) {
      console.log('🚫 Invalid block index:', targetIndex);
      return;
    }
    
    State.isTransitioning = true;
    State.canScroll = false;
    
    const currentBlock = State.contentBlocks[State.currentBlockIndex];
    const nextBlock = State.contentBlocks[targetIndex];
    
    console.log(`📖 Navigating blocks: ${State.currentBlockIndex} → ${targetIndex}`);
    
    const tl = gsap.timeline({
      onComplete: () => {
        State.currentBlockIndex = targetIndex;
        State.isTransitioning = false;
        setTimeout(() => {
          State.canScroll = true;
          console.log('✅ Navigation ready');
        }, CONFIG.scrollCooldown);
      }
    });
    
    tl.add(() => playBreathSound());
    
    if (currentBlock) {
      tl.add(breatheIn(currentBlock), 0);
    }
    
    tl.to({}, { duration: CONFIG.breathPause });
    
    tl.add(breatheOut(nextBlock));
    
    return tl;
  }
  
  function navigateForward() {
    if (!State.canScroll || State.inMeditation || !State.sceneEntryComplete) {
      console.log('⏸️ Forward navigation blocked');
      return;
    }
    
    if (State.contentBlocks.length === 0) {
      console.log('🧘 No content available - entering meditation');
      enterMeditationMode();
      return;
    }
    
    const nextIndex = State.currentBlockIndex + 1;
    
    if (nextIndex >= State.contentBlocks.length) {
      console.log('🧘 Reached end of content - entering meditation');
      enterMeditationMode();
      return;
    }
    
    navigateToBlock(nextIndex);
  }
  
  function navigateBackward() {
    if (!State.canScroll || State.inMeditation || !State.sceneEntryComplete) {
      console.log('⏸️ Backward navigation blocked');
      return;
    }
    
    if (State.contentBlocks.length === 0) {
      console.log('ℹ️ No content available');
      return;
    }
    
    const prevIndex = State.currentBlockIndex - 1;
    
    if (prevIndex < 0) {
      console.log('🚫 Already at first block');
      return;
    }
    
    navigateToBlock(prevIndex);
  }

  // ============================================================
  // MEDITATION MODE
  // ============================================================
  
  function startFacetAnimation() {
    if (!window.metatron || !window.AHCONFIG) return;
    
    console.log('✨ Starting facet animation pattern');
    
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
  
  function stopFacetAnimation() {
    if (window.metatron && window.metatron.stopFacets) {
      console.log('🛑 Stopping facet animation');
      window.metatron.stopFacets();
    }
  }
  
  function enterMeditationMode() {
    if (State.inMeditation || !State.sceneEntryComplete) return;
    
    console.log('🧘 Entering meditation mode');
    
    State.lastContentBlockBeforeMeditation = State.currentBlockIndex;
    State.inMeditation = true;
    State.canScroll = false;
    
    try {
      localStorage.setItem(CONFIG.storageKeys.lastContentBlock, State.currentBlockIndex);
      localStorage.setItem(CONFIG.storageKeys.inMeditation, 'true');
    } catch (e) {
      console.warn('⚠️ Could not save meditation state:', e);
    }
    
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        console.log('✅ Meditation mode active');
        enableCenterDivination();
      }
    });
    
    const currentBlock = State.contentBlocks[State.currentBlockIndex];
    if (currentBlock) {
      tl.to(currentBlock, {
        autoAlpha: 0,
        scale: 0,
        duration: 0.6,
        ease: 'power2.in'
      }, 0);
    }
    
    if (DOM.goddess) {
      tl.to(DOM.goddess, {
        y: CONFIG.goddessCenterY,
        scale: CONFIG.goddessCenterScale,
        duration: CONFIG.meditationTransitionDuration,
        ease: 'power2.inOut',
        onStart: () => console.log('🌙 Goddess rising to center')
      }, 0.2);
    }
    
    if (DOM.metatron) {
      tl.to(DOM.metatron, {
        opacity: CONFIG.metatronMeditationOpacity,
        visibility: 'visible',
        duration: 0.9,
        ease: 'power2.out'
      }, 0.3);
    }
    
    if (DOM.title) {
      const titleVisible = gsap.getProperty(DOM.title, 'autoAlpha') > 0.5;
      if (!titleVisible) {
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
    }
    
    tl.add(() => crossfadeToMeditation(), '-=0.8');
    tl.add(() => startFacetAnimation(), '-=0.3');
  }
  
  function exitMeditationMode() {
    if (!State.inMeditation) return;
    
    console.log('📖 Exiting meditation mode');
    
    disableCenterDivination();
    stopFacetAnimation();
    
    let returnIndex = State.lastContentBlockBeforeMeditation;
    
    const finalPromptIndex = State.contentBlocks.length - 1;
    if (State.lastContentBlockBeforeMeditation === finalPromptIndex) {
      const prompt0Index = State.contentBlocks.findIndex(block => block === DOM.prompt0);
      if (prompt0Index !== -1) {
        returnIndex = prompt0Index;
        console.log('🔄 Returning to Prompt0');
      }
    }
    
    State.inMeditation = false;
    State.canScroll = false;
    
    try {
      localStorage.setItem(CONFIG.storageKeys.inMeditation, 'false');
    } catch (e) {
      console.warn('⚠️ Could not save meditation state:', e);
    }
    
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        State.currentBlockIndex = returnIndex;
        State.canScroll = true;
        console.log('✅ Returned to content');
      }
    });
    
    if (DOM.goddess) {
      tl.to(DOM.goddess, {
        y: CONFIG.goddessDockY,
        scale: CONFIG.goddessDockScale,
        duration: CONFIG.meditationTransitionDuration,
        ease: 'power2.inOut'
      }, 0);
    }
    
    if (DOM.metatron) {
      tl.to(DOM.metatron, {
        opacity: CONFIG.metatronContentOpacity,
        visibility: 'visible',
        duration: 0.7,
        ease: 'power2.in'
      }, 0.3);
    }
    
    tl.add(() => crossfadeToBackground(), '-=0.8');
    
    const targetBlock = State.contentBlocks[returnIndex];
    if (targetBlock) {
      tl.add(() => breatheOut(targetBlock), '-=0.3');
    }
  }

  // ============================================================
  // CENTER DIVINATION
  // ============================================================
  
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
  
  function disableCenterDivination() {
    if (!DOM.metatronCenter) return;
    
    gsap.killTweensOf(DOM.metatronCenter);
    gsap.set(DOM.metatronCenter, {
      pointerEvents: 'none',
      opacity: 0
    });
  }
  
  function triggerDivination() {
    console.log('🔮 Divination triggered');
    
    playSfx(DOM.divinationSfx);
    disableCenterDivination();
    stopFacetAnimation();
    
    const nextScene = selectNextScene();
    
    if (!nextScene) {
      console.error('❌ No next scene available!');
      return;
    }
    
    const currentId = getCurrentSceneId();
    if (currentId) {
      saveToHistory(currentId);
    }
    
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        console.log('🌀 Navigating to:', nextScene.url);
        window.location.href = nextScene.url;
      }
    });
    
    const goddessY = gsap.getProperty(DOM.goddess, 'y');
    const isGoddessAtCenter = (typeof goddessY === 'string' && goddessY === '0px') || goddessY === 0;
    
    if (isGoddessAtCenter && DOM.goddess) {
      tl.to(DOM.goddess, {
        y: CONFIG.goddessDockY,
        scale: CONFIG.goddessDockScale,
        duration: 0.8,
        ease: 'power2.in'
      });
    }
    
    if (DOM.metatronCenter) {
      tl.to(DOM.metatronCenter, {
        scale: 1.5,
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.2')
      .to(DOM.metatronCenter, {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.in'
      });
    }
    
    if (DOM.title) {
      tl.to(DOM.title, {
        autoAlpha: 0,
        scale: 0,
        duration: 0.8,
        ease: 'power2.in'
      }, '-=0.6');
    }
    
    if (DOM.shader) {
      tl.to(DOM.shader, {
        autoAlpha: 0,
        duration: 1.4,
        ease: 'power2.in'
      }, '-=1.0');
    }
    
    if (DOM.metatron) {
      tl.to(DOM.metatron, {
        scale: 0.01,
        rotation: '+=720',
        duration: CONFIG.divinationDuration,
        ease: 'power2.in',
        force3D: true,
        transformOrigin: '50% 50%'
      }, '-=1.8');
    }
    
    tl.add(() => {
      const allShapes = document.querySelectorAll('#metatron polygon, #metatron polyline');
      gsap.to(allShapes, {
        opacity: 0,
        duration: 1.5,
        ease: 'power2.in'
      });
    }, '-=2.0');
    
    tl.to({}, { duration: 0.5 });
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  function handleWheel(e) {
    if (State.inMeditation || !State.canScroll || !State.sceneEntryComplete) return;
    
    e.preventDefault();
    
    if (e.deltaY < 0) {
      console.log('⬆️ Scroll up');
      navigateBackward();
    } else if (e.deltaY > 0) {
      console.log('⬇️ Scroll down');
      navigateForward();
    }
  }
  
  function handleTouchStart(e) {
    if (State.inMeditation || !State.sceneEntryComplete) return;
    State.touchStartY = e.touches[0].clientY;
    State.touchStartX = e.touches[0].clientX;
  }
  
  function handleTouchEnd(e) {
    if (State.inMeditation || !State.canScroll || !State.sceneEntryComplete) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    
    const deltaY = State.touchStartY - touchEndY;
    const deltaX = Math.abs(State.touchStartX - touchEndX);
    
    if (Math.abs(deltaY) < CONFIG.swipeMinDistance) return;
    if (deltaX > Math.abs(deltaY)) return;
    
    if (deltaY > 0) {
      console.log('👆 Swipe up');
      navigateForward();
    } else {
      console.log('👇 Swipe down');
      navigateBackward();
    }
  }
  
  function handleClick(e) {
    if (State.inMeditation || !State.canScroll || !State.sceneEntryComplete) return;
    
    // Ignore clicks on UI elements
    if (DOM.audioToggle && DOM.audioToggle.contains(e.target)) return;
    if (DOM.goddess && DOM.goddess.contains(e.target)) return;
    
    // Determine click zone
    const clickY = e.clientY;
    const windowHeight = window.innerHeight;
    const topZone = windowHeight * 0.5;
    
    if (clickY < topZone) {
      console.log('👆 Top zone clicked - navigate backward');
      navigateBackward();
    } else {
      console.log('👇 Bottom zone clicked - navigate forward');
      navigateForward();
    }
  }
  
  function handleGoddessClick(e) {
    e.stopPropagation();
    
    if (!State.sceneEntryComplete) return;
    
    console.log('🌙 Goddess clicked');
    playSfx(DOM.goddessClickSfx);
    
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
    
    if (State.inMeditation) {
      exitMeditationMode();
    } else {
      enterMeditationMode();
    }
  }
  
  function handleCenterClick(e) {
    e.stopPropagation();
    
    if (!State.inMeditation || !State.sceneEntryComplete) return;
    
    console.log('🎯 Center clicked');
    playSfx(DOM.centerClickSfx);
    
    triggerDivination();
  }
  
  async function handleAudioToggle(e) {
    e.stopPropagation();
    
    const activeAudio = (State.inMeditation && State.meditationAudio && !State.meditationAudio.paused) 
      ? State.meditationAudio 
      : State.backgroundAudio;
    
    if (!activeAudio) return;
    
    console.log('🎵 Audio toggle clicked');
    
    if (window.AHAudioState) {
      await window.AHAudioState.toggle(activeAudio, DOM.audioIcon);
      
      if (State.breathAudio) {
        const audioState = window.AHAudioState.getState();
        if (!audioState.isPlaying) {
          State.breathAudio.pause();
          State.breathAudio.volume = 0;
        } else {
          State.breathAudio.volume = CONFIG.audioVolume;
        }
      }
    } else {
      const isPlaying = !activeAudio.paused;
      
      if (isPlaying) {
        if (State.backgroundAudio) {
          gsap.to(State.backgroundAudio, {
            volume: 0,
            duration: 0.3,
            onComplete: () => State.backgroundAudio.pause()
          });
        }
        if (State.meditationAudio) {
          gsap.to(State.meditationAudio, {
            volume: 0,
            duration: 0.3,
            onComplete: () => State.meditationAudio.pause()
          });
        }
        if (State.breathAudio) {
          State.breathAudio.pause();
          State.breathAudio.volume = 0;
        }
        if (DOM.audioIcon) {
          gsap.to(DOM.audioIcon, { opacity: 0.4, duration: 0.3 });
        }
      } else {
        try {
          if (activeAudio.paused) {
            await activeAudio.play();
          }
          gsap.to(activeAudio, {
            volume: CONFIG.audioVolume,
            duration: 0.3
          });
          if (State.breathAudio) {
            State.breathAudio.volume = CONFIG.audioVolume;
          }
          if (DOM.audioIcon) {
            gsap.to(DOM.audioIcon, { opacity: 1, duration: 0.3 });
          }
        } catch (err) {
          console.warn('⚠️ Audio play failed:', err);
        }
      }
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  function setupInitialState() {
    console.log('🎬 Setting up initial scene state');
    
    // Hide all content blocks
    State.contentBlocks.forEach((block) => {
      if (block) {
        block.style.visibility = 'hidden';
        block.style.opacity = '0';
        gsap.set(block, { autoAlpha: 0, scale: 0 });
      }
    });
    
    // Goddess at dock
    if (DOM.goddess) {
      gsap.set(DOM.goddess, {
        y: CONFIG.goddessDockY,
        scale: CONFIG.goddessDockScale,
        autoAlpha: 1,
        cursor: 'pointer',
        pointerEvents: 'auto',
        transformOrigin: '50% 50%',
        zIndex: 50
      });
      console.log('🌙 Goddess at dock position');
    }
    
    // Metatron tiny at center (ready to breathe out)
    if (DOM.metatron) {
      gsap.set(DOM.metatron, {
        y: 0,
        x: 0,
        scale: 0,
        autoAlpha: 0,
        rotation: 0,
        transformOrigin: '50% 50%',
        force3D: true,
        cursor: 'default',
        pointerEvents: 'none'
      });
      
      const metatronShapes = DOM.metatron.querySelectorAll('polygon, polyline, path, circle');
      metatronShapes.forEach(shape => {
        gsap.set(shape, { pointerEvents: 'none' });
      });
      
      console.log('🌀 Metatron ready to breathe out');
    }
    
    if (DOM.title) {
      gsap.set(DOM.title, { autoAlpha: 0, scale: 0 });
    }
    
    if (DOM.shader) {
      gsap.set(DOM.shader, { 
        autoAlpha: 0,
        pointerEvents: 'none'
      });
    }
    
    if (DOM.metatronCenter) {
      gsap.set(DOM.metatronCenter, {
        pointerEvents: 'none',
        opacity: 0
      });
    }
    
    State.inMeditation = false;
    State.canScroll = false;
    State.sceneEntryComplete = false;
  }
  
  function attachEventListeners() {
    console.log('🔗 Attaching event listeners');
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('click', handleClick);
    
    if (DOM.goddess) {
      DOM.goddess.addEventListener('click', handleGoddessClick);
      console.log('✅ Goddess click handler attached');
    }
    
    if (DOM.metatronCenter) {
      DOM.metatronCenter.addEventListener('click', handleCenterClick);
      console.log('✅ Center click handler attached');
    }
    
    if (DOM.audioToggle) {
      DOM.audioToggle.addEventListener('click', handleAudioToggle);
    }
  }
  
  async function init() {
    try {
      console.log('💖 Oracle Scene Controller v4.0 initializing...');
      
      cacheDOM();
      setupInitialState();
      await initAudio();
      attachEventListeners();
      
      if (State.contentBlocks.length === 0) {
        console.warn('⚠️ No content blocks found - entering meditation mode directly');
        await playSceneEntryAnimation();
        setTimeout(() => {
          console.log('🧘 Auto-entering meditation mode (no content available)');
          enterMeditationMode();
        }, 1000);
        return;
      }
      
      console.log('⏳ Playing scene entry animation...');
      await playSceneEntryAnimation();
      
      if (window.metatron && window.AHCONFIG) {
        const timing = window.AHCONFIG.timing || {};
        
        if (timing.portalsDelay !== undefined) {
          setTimeout(() => {
            if (window.metatron.startPortals) {
              window.metatron.startPortals(window.AHCONFIG.portals);
            }
          }, timing.portalsDelay * 1000);
        }
      }
      
      console.log('✨ Oracle Scene Controller ready');
    } catch (error) {
      console.error('❌ Scene controller initialization failed:', error);
      console.error('Stack trace:', error.stack);
      
      console.log('🔄 Attempting recovery...');
      setTimeout(async () => {
        try {
          await playSceneEntryAnimation();
        } catch (e) {
          console.error('❌ Recovery failed:', e);
        }
      }, 500);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    if (document.referrer && document.referrer.includes(window.location.origin)) {
      console.log('🔄 Detected internal navigation, adding delay...');
      setTimeout(init, 100);
    } else {
      init();
    }
  }
  
  // ============================================================
  // PUBLIC API
  // ============================================================
  
  window.AHSceneController = {
    handleGoddessClick,
    handleCenterClick,
    enterMeditationMode,
    exitMeditationMode,
    getState: () => State,
    getDOM: () => DOM
  };
  
  console.log('✅ Scene controller API exposed');

})();
