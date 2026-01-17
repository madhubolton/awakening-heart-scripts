/*--------------------------------------------------------------
  Awakening Heart : Breath-Reactive Audio
  Version: 1.0.1 | Date: 2025-01-17
  
  Web Audio API system that modulates audio in sync with breath.
  Designed to work with the sceneBuilder breath timeline.
  
  CHANGES in v1.0.1:
  - Deferred AudioContext creation until start() (requires user interaction)
  - Prevents errors when init() is called before user interacts with page
  - Added isConnected state to track Web Audio node connection
  
  Features:
  - Gain modulation (volume swells with exhale)
  - Low-pass filter modulation (brightness follows breath)
  - GSAP-compatible animation targets
  - Integrates with existing audio state system
  
  Usage:
    // Initialize with breath audio element
    await AHBreathAudio.init(document.getElementById('breathAudio'));
    
    // In breath timeline, animate the proxy object:
    breathTl.to(AHBreathAudio.params, {
      gain: 0.8,
      filterFreq: 2000,
      duration: timing.exhale,
      ease: "sine.inOut"
    }, pos);
--------------------------------------------------------------*/

window.AHBreathAudio = (() => {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  
  let audioContext = null;
  let sourceNode = null;
  let gainNode = null;
  let filterNode = null;
  let audioElement = null;
  let storedConfig = null;
  let isInitialized = false;
  let isConnected = false;
  let isPlaying = false;

  // Default parameter ranges
  const DEFAULTS = {
    // Gain (volume)
    gainMin: 0.15,      // Inhale - quieter, drawing inward
    gainMax: 0.5,       // Exhale - fuller, releasing
    
    // Filter frequency (brightness)
    filterMin: 300,     // Inhale - darker, muffled
    filterMax: 3000,    // Exhale - brighter, open
    filterQ: 0.7,       // Resonance (subtle)
    
    // Master volume (respects user's audio state)
    masterVolume: 0.35
  };

  // ============================================================
  // ANIMATABLE PARAMS (GSAP targets this object)
  // ============================================================
  
  const params = {
    _gain: DEFAULTS.gainMax,
    _filterFreq: DEFAULTS.filterMax,
    _masterVolume: DEFAULTS.masterVolume,
    
    // Gain with setter that updates Web Audio (safe if not connected)
    get gain() { return this._gain; },
    set gain(value) {
      this._gain = value;
      if (gainNode && audioContext) {
        gainNode.gain.setTargetAtTime(value * this._masterVolume, audioContext.currentTime, 0.015);
      }
    },
    
    // Filter frequency with setter that updates Web Audio (safe if not connected)
    get filterFreq() { return this._filterFreq; },
    set filterFreq(value) {
      this._filterFreq = value;
      if (filterNode && audioContext) {
        filterNode.frequency.setTargetAtTime(value, audioContext.currentTime, 0.015);
      }
    },
    
    // Master volume (for integration with audio state)
    get masterVolume() { return this._masterVolume; },
    set masterVolume(value) {
      this._masterVolume = value;
      // Reapply gain with new master
      if (gainNode && audioContext) {
        gainNode.gain.setTargetAtTime(this._gain * value, audioContext.currentTime, 0.015);
      }
    }
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  async function init(element, options = {}) {
    if (!element) {
      console.warn('⚠️ AHBreathAudio: No audio element provided');
      return false;
    }
    
    // Merge options with defaults
    const config = { ...DEFAULTS, ...options };
    
    console.log('🌬️ Breath Audio: Pre-initializing (will fully init on start)');
    
    // Store element and config for later - don't create AudioContext yet
    // (AudioContext requires user interaction)
    audioElement = element;
    storedConfig = config;
    
    // Set initial param values
    params._gain = config.gainMax;
    params._filterFreq = config.filterMax;
    params._masterVolume = config.masterVolume;
    
    isInitialized = true;  // Mark as ready for start()
    
    console.log('✅ Breath Audio: Ready (will connect on start)');
    console.log(`   Gain range: ${config.gainMin} → ${config.gainMax}`);
    console.log(`   Filter range: ${config.filterMin}Hz → ${config.filterMax}Hz`);
    
    return true;
  }
  
  // Actually connect the Web Audio nodes (called on first start)
  async function connectAudioNodes() {
    if (isConnected || !audioElement) return false;
    
    try {
      // Create audio context (requires user interaction)
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create source from audio element
      sourceNode = audioContext.createMediaElementSource(audioElement);
      
      // Create gain node (volume control)
      gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Start silent
      
      // Create low-pass filter (brightness control)
      filterNode = audioContext.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = storedConfig.filterMax;
      filterNode.Q.value = storedConfig.filterQ;
      
      // Connect the chain: source → filter → gain → destination
      sourceNode.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      isConnected = true;
      console.log('🌬️ Breath Audio: Web Audio nodes connected');
      
      return true;
      
    } catch (e) {
      console.error('❌ Breath Audio: Failed to connect audio nodes', e);
      return false;
    }
  }

  // ============================================================
  // PLAYBACK CONTROL
  // ============================================================
  
  async function start() {
    if (!isInitialized || !audioElement) {
      console.warn('⚠️ Breath Audio: Not initialized');
      return false;
    }
    
    // Check global audio state (respect user's audio preference)
    const audioState = window.AHAudioState?.getState();
    if (audioState && !audioState.isPlaying) {
      console.log('🔇 Breath Audio: Global audio is OFF, not starting');
      return false;
    }
    
    try {
      // Connect Web Audio nodes on first start (requires user interaction)
      if (!isConnected) {
        const connected = await connectAudioNodes();
        if (!connected) {
          console.warn('⚠️ Breath Audio: Could not connect audio nodes');
          return false;
        }
      }
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      audioElement.currentTime = 0;
      audioElement.loop = true;
      await audioElement.play();
      
      // Fade in from 0
      gsap.to(params, {
        gain: DEFAULTS.gainMax,
        duration: 1.5,
        ease: "sine.inOut"
      });
      
      isPlaying = true;
      console.log('🌬️ Breath Audio: Playing');
      return true;
      
    } catch (e) {
      console.error('❌ Breath Audio: Play failed', e);
      return false;
    }
  }

  async function stop() {
    if (!isInitialized || !audioElement) return;
    
    // Fade out then pause
    gsap.to(params, {
      gain: 0,
      duration: 0.8,
      ease: "sine.inOut",
      onComplete: () => {
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
        }
      }
    });
    
    isPlaying = false;
    console.log('🌬️ Breath Audio: Stopped');
  }

  function pause() {
    if (!isInitialized || !audioElement) return;
    
    gsap.to(params, {
      gain: 0,
      duration: 0.5,
      ease: "sine.inOut",
      onComplete: () => {
        if (audioElement) audioElement.pause();
      }
    });
    
    isPlaying = false;
    console.log('🌬️ Breath Audio: Paused');
  }

  async function resume() {
    if (!isInitialized || !audioElement) return;
    
    // Check global audio state
    const audioState = window.AHAudioState?.getState();
    if (audioState && !audioState.isPlaying) {
      console.log('🔇 Breath Audio: Global audio is OFF');
      return false;
    }
    
    try {
      await audioElement.play();
      gsap.to(params, {
        gain: params._gain || DEFAULTS.gainMax,
        duration: 0.5,
        ease: "sine.inOut"
      });
      isPlaying = true;
      console.log('🌬️ Breath Audio: Resumed');
      return true;
    } catch (e) {
      console.error('❌ Breath Audio: Resume failed', e);
      return false;
    }
  }

  // ============================================================
  // BREATH PHASE HELPERS
  // ============================================================
  
  // Get inhale target values
  function getInhaleParams(options = {}) {
    return {
      gain: options.gainMin ?? DEFAULTS.gainMin,
      filterFreq: options.filterMin ?? DEFAULTS.filterMin
    };
  }
  
  // Get exhale target values
  function getExhaleParams(options = {}) {
    return {
      gain: options.gainMax ?? DEFAULTS.gainMax,
      filterFreq: options.filterMax ?? DEFAULTS.filterMax
    };
  }
  
  // Get hold micro-motion values (subtle variation during holds)
  function getHoldVariation(baseParams, amount = 0.05) {
    return {
      gain: baseParams.gain * (1 + amount),
      filterFreq: baseParams.filterFreq * (1 + amount)
    };
  }

  // ============================================================
  // INTEGRATION WITH BREATH TIMELINE
  // ============================================================
  
  /**
   * Add breath audio modulation to an existing GSAP timeline
   * @param {gsap.core.Timeline} timeline - The breath timeline
   * @param {Object} timing - Breath timing { inhale, holdIn, exhale, holdOut }
   * @param {Object} options - Optional overrides for gain/filter ranges
   */
  function addToTimeline(timeline, timing, options = {}) {
    if (!isInitialized) {
      console.warn('⚠️ Breath Audio: Not initialized, cannot add to timeline');
      return;
    }
    
    const inhaleParams = getInhaleParams(options);
    const exhaleParams = getExhaleParams(options);
    
    let pos = 0;
    
    // INHALE: Volume dips, filter closes
    timeline.to(params, {
      gain: inhaleParams.gain,
      filterFreq: inhaleParams.filterFreq,
      duration: timing.inhale,
      ease: "sine.inOut"
    }, pos);
    pos += timing.inhale;
    
    // HOLD-IN: Subtle micro-motion
    if (timing.holdIn > 0) {
      const holdVar = getHoldVariation(inhaleParams, 0.08);
      timeline.to(params, {
        gain: holdVar.gain,
        filterFreq: holdVar.filterFreq,
        duration: timing.holdIn / 2,
        ease: "sine.inOut"
      }, pos);
      timeline.to(params, {
        gain: inhaleParams.gain,
        filterFreq: inhaleParams.filterFreq,
        duration: timing.holdIn / 2,
        ease: "sine.inOut"
      }, pos + timing.holdIn / 2);
      pos += timing.holdIn;
    }
    
    // EXHALE: Volume swells, filter opens
    timeline.to(params, {
      gain: exhaleParams.gain,
      filterFreq: exhaleParams.filterFreq,
      duration: timing.exhale,
      ease: "sine.inOut"
    }, pos);
    pos += timing.exhale;
    
    // HOLD-OUT: Subtle micro-motion
    if (timing.holdOut > 0) {
      const holdVar = getHoldVariation(exhaleParams, -0.05);
      timeline.to(params, {
        gain: holdVar.gain,
        filterFreq: holdVar.filterFreq,
        duration: timing.holdOut / 2,
        ease: "sine.inOut"
      }, pos);
      timeline.to(params, {
        gain: exhaleParams.gain,
        filterFreq: exhaleParams.filterFreq,
        duration: timing.holdOut / 2,
        ease: "sine.inOut"
      }, pos + timing.holdOut / 2);
    }
    
    console.log('🌬️ Breath Audio: Added to timeline');
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  
  function destroy() {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    
    if (filterNode) {
      filterNode.disconnect();
      filterNode = null;
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    
    audioElement = null;
    storedConfig = null;
    isInitialized = false;
    isConnected = false;
    isPlaying = false;
    
    console.log('🌬️ Breath Audio: Destroyed');
  }

  // ============================================================
  // STATUS
  // ============================================================
  
  function getState() {
    return {
      isInitialized,
      isConnected,
      isPlaying,
      gain: params._gain,
      filterFreq: params._filterFreq,
      masterVolume: params._masterVolume,
      contextState: audioContext?.state || 'none'
    };
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  
  return {
    // Core
    init,
    start,
    stop,
    pause,
    resume,
    destroy,
    getState,
    
    // GSAP animation target
    params,
    
    // Timeline integration
    addToTimeline,
    getInhaleParams,
    getExhaleParams,
    
    // Defaults (for reference/override)
    DEFAULTS
  };

})();

console.log('🌬️ Breath Audio v1.0.1 loaded');
console.log('   Use: AHBreathAudio.init(audioElement)');
console.log('   Then: AHBreathAudio.start() (connects Web Audio on first call)');
