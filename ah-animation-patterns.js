/*--------------------------------------------------------------
  Awakening Heart : Animation Patterns Library
  Version: 2.0.0 | Date: 2025-01-12
  
  Reusable animation choreography for:
  - Metatron facets (F_* elements)
  - Portal elements (P_* elements)  
  - Triple Goddess (crescent and circle elements)
  - Breath-synchronized regulation patterns (NEW)
  
  Usage:
  window.AHPatterns.playPattern('sequential', facetIds, options);
  window.AHPatterns.playPattern('breathCycle', null, { preset: 'deepCalm' });
--------------------------------------------------------------*/

window.AHPatterns = (() => {
  
  // Default animation options
  const DEFAULTS = {
    fill: "#77ffcc",
    duration: 1.5,
    stagger: 0.1,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  };

  // ============================================================
  // BREATH CYCLE CONFIGURATION
  // Elite HRV breathing presets: inhale-holdIn-exhale-holdOut
  // ============================================================
  
  const BREATH_PRESETS = {
    resonance: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },    // 6 breaths/min
    deepCalm: { inhale: 4, holdIn: 1, exhale: 8, holdOut: 1 },     // 4.3 breaths/min
    easeAnxiety: { inhale: 4, holdIn: 0, exhale: 7, holdOut: 0 }   // 5.5 breaths/min
  };

  // Metatron layer mapping (fixed geometry structure)
  const METATRON_LAYERS = {
    center: {
      facets: ["F_C_TR", "F_C_R", "F_C_BR", "F_C_BL", "F_C_L", "F_C_TL"],
      portals: ["P_C"]
    },
    inner: {
      facets: [
        "F_I_TRI1_T", "F_I_TRI2_T", "F_I_TRI1_TR", "F_I_TRI2_TR",
        "F_I_TRI1_BR", "F_I_TRI2_BR", "F_I_TRI1_B", "F_I_TRI2_B",
        "F_I_TRI1_BL", "F_I_TRI2_BL", "F_I_TRI1_TL", "F_I_TRI2_TL",
        "F_I_OCT_TL", "F_I_OCT_TR", "F_I_OCT_R", "F_I_OCT_BR", "F_I_OCT_BL", "F_I_OCT_L"
      ],
      portals: ["P_IT", "P_IRT", "P_IRB", "P_IB", "P_ILB", "P_ILT"]
    },
    middle: {
      facets: ["F_I_BG_TR", "F_I_BG_R", "F_I_BG_BR", "F_I_BG_BL", "F_I_BG_L", "F_I_BG_TL"],
      portals: []
    },
    outer: {
      facets: [
        "F_O_TRI1_T", "F_O_TRI2_T", "F_O_TRI1_TR", "F_O_TRI2_TR",
        "F_O_TRI1_BR", "F_O_TRI2_BR", "F_O_TRI1_B", "F_O_TRI2_B",
        "F_O_TRI1_BL", "F_O_TRI2_BL", "F_O_TRI1_TL", "F_O_TRI2_TL",
        "F_O_OCT_TL", "F_O_OCT_L", "F_O_OCT_BL", "F_O_OCT_BR", "F_O_OCT_R", "F_O_OCT_TR"
      ],
      portals: ["P_OT", "P_ORT", "P_ORB", "P_OB", "P_OLB", "P_OLT"]
    }
  };

  /**
   * Get the animatable shape from an element (handles groups)
   */
  const getShape = (id) => {
    const element = document.getElementById(id);
    if (!element) return null;
    
    // If it's a group, find the shape inside
    return element.tagName === 'g' 
      ? element.querySelector('polygon, polyline, path, circle') 
      : element;
  };

  /**
   * Get all shapes from an array of IDs
   */
  const getShapes = (ids) => {
    return ids.map(id => getShape(id)).filter(Boolean);
  };

  // ============================================================
  // BREATH CYCLE PATTERN (NEW)
  // Coordinates geometry to therapeutic breathing rhythms
  // ============================================================

  /**
   * PATTERN: Breath Cycle
   * Synchronized animation matching Elite HRV breathing patterns
   * 
   * @param {null} _ - Not used (layers are built-in)
   * @param {Object} options - Configuration options
   * @param {string} options.preset - 'resonance', 'deepCalm', or 'easeAnxiety'
   * @param {Object} options.timing - Custom timing { inhale, holdIn, exhale, holdOut }
   * @param {Object} options.colors - { bright, dim } fill colors
   */
  const breathCycle = (_, options = {}) => {
    const opts = {
      preset: 'deepCalm',
      timing: null,
      colors: {
        bright: "#77ffcc",
        dim: "#2a4a5e"
      },
      opacityPeak: 1.0,
      opacityBase: 0.25,
      ...options
    };

    // Get timing from preset or custom
    const timing = opts.timing || BREATH_PRESETS[opts.preset] || BREATH_PRESETS.deepCalm;
    const cycleDuration = timing.inhale + timing.holdIn + timing.exhale + timing.holdOut;

    console.log(`🌬️ Breath Cycle: ${timing.inhale}-${timing.holdIn}-${timing.exhale}-${timing.holdOut} (${cycleDuration}s)`);

    // Gather all shapes by layer
    const layers = {
      outer: {
        facets: getShapes(METATRON_LAYERS.outer.facets),
        portals: getShapes(METATRON_LAYERS.outer.portals)
      },
      middle: {
        facets: getShapes(METATRON_LAYERS.middle.facets),
        portals: []
      },
      inner: {
        facets: getShapes(METATRON_LAYERS.inner.facets),
        portals: getShapes(METATRON_LAYERS.inner.portals)
      },
      center: {
        facets: getShapes(METATRON_LAYERS.center.facets),
        portals: getShapes(METATRON_LAYERS.center.portals)
      }
    };

    // Set initial state (dim)
    const allShapes = [
      ...layers.outer.facets, ...layers.outer.portals,
      ...layers.middle.facets,
      ...layers.inner.facets, ...layers.inner.portals,
      ...layers.center.facets, ...layers.center.portals
    ];
    
    gsap.set(allShapes, { 
      fill: opts.colors.dim, 
      opacity: opts.opacityBase 
    });

    // Create the master timeline
    const tl = gsap.timeline({ repeat: -1 });

    // Layer order for inhale (outside → center) and exhale (center → outside)
    const layerOrder = ['outer', 'middle', 'inner', 'center'];
    const layerCount = layerOrder.length;

    // ============================================================
    // INHALE PHASE: Energy gathering inward
    // ============================================================
    const inhalePhase = gsap.timeline();
    
    layerOrder.forEach((layerName, i) => {
      const layer = layers[layerName];
      const layerDelay = (timing.inhale / layerCount) * i;
      const layerDuration = timing.inhale * 0.6; // Overlap for smooth flow

      // Facets brighten
      if (layer.facets.length) {
        inhalePhase.to(layer.facets, {
          fill: opts.colors.bright,
          opacity: opts.opacityPeak,
          duration: layerDuration,
          stagger: 0.02,
          ease: "sine.in"
        }, layerDelay);
      }

      // Portals brighten
      if (layer.portals.length) {
        inhalePhase.to(layer.portals, {
          fill: opts.colors.bright,
          opacity: opts.opacityPeak,
          duration: layerDuration,
          stagger: 0.05,
          ease: "sine.in"
        }, layerDelay);
      }
    });

    tl.add(inhalePhase, 0);

    // ============================================================
    // HOLD AFTER INHALE: Peak presence
    // ============================================================
    if (timing.holdIn > 0) {
      // Subtle pulse at peak
      const holdInPhase = gsap.timeline();
      holdInPhase.to(allShapes, {
        opacity: opts.opacityPeak * 0.95,
        duration: timing.holdIn * 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      });
      tl.add(holdInPhase, timing.inhale);
    }

    // ============================================================
    // EXHALE PHASE: Energy releasing outward
    // ============================================================
    const exhaleStart = timing.inhale + timing.holdIn;
    const exhalePhase = gsap.timeline();
    
    // Reverse order: center → outer
    const reverseOrder = [...layerOrder].reverse();
    
    reverseOrder.forEach((layerName, i) => {
      const layer = layers[layerName];
      const layerDelay = (timing.exhale / layerCount) * i;
      const layerDuration = timing.exhale * 0.7; // Longer, slower release

      // Facets dim
      if (layer.facets.length) {
        exhalePhase.to(layer.facets, {
          fill: opts.colors.dim,
          opacity: opts.opacityBase,
          duration: layerDuration,
          stagger: 0.03,
          ease: "sine.out"
        }, layerDelay);
      }

      // Portals dim
      if (layer.portals.length) {
        exhalePhase.to(layer.portals, {
          fill: opts.colors.dim,
          opacity: opts.opacityBase,
          duration: layerDuration,
          stagger: 0.06,
          ease: "sine.out"
        }, layerDelay);
      }
    });

    tl.add(exhalePhase, exhaleStart);

    // ============================================================
    // HOLD AFTER EXHALE: Rest/emptiness
    // ============================================================
    if (timing.holdOut > 0) {
      // Everything stays dim - the void before next breath
      // Center portal (bindu) remains slightly visible as seed
      const holdOutPhase = gsap.timeline();
      holdOutPhase.to(layers.center.portals, {
        opacity: opts.opacityBase * 1.5,
        duration: timing.holdOut,
        ease: "sine.inOut"
      });
      tl.add(holdOutPhase, exhaleStart + timing.exhale);
    }

    // Store reference for cleanup
    window._breathCycleTimeline = tl;

    return tl;
  };

  /**
   * Stop breath cycle animation
   */
  const stopBreathCycle = () => {
    if (window._breathCycleTimeline) {
      window._breathCycleTimeline.kill();
      window._breathCycleTimeline = null;
    }
    
    // Reset all Metatron elements
    const allIds = [
      ...METATRON_LAYERS.center.facets, ...METATRON_LAYERS.center.portals,
      ...METATRON_LAYERS.inner.facets, ...METATRON_LAYERS.inner.portals,
      ...METATRON_LAYERS.middle.facets,
      ...METATRON_LAYERS.outer.facets, ...METATRON_LAYERS.outer.portals
    ];
    
    allIds.forEach(id => {
      const shape = getShape(id);
      if (shape) gsap.killTweensOf(shape);
    });
  };

  // ============================================================
  // EXISTING PATTERNS (unchanged)
  // ============================================================

  /**
   * PATTERN: Sequential
   * Elements light up one after another in order
   */
  const sequential = (ids, options = {}) => {
    const opts = { ...DEFAULTS, ...options };
    
    ids.forEach((id, i) => {
      const shape = getShape(id);
      if (!shape) return;
      
      gsap.to(shape, {
        fill: opts.fill,
        duration: opts.duration,
        repeat: opts.repeat,
        yoyo: opts.yoyo,
        ease: opts.ease,
        delay: i * opts.stagger
      });
    });
    
    return ids.length * opts.stagger + opts.duration;
  };

  /**
   * PATTERN: Radial Burst
   * Elements light up from center outward in waves
   * Requires groups: center, inner, outer
   */
  const radialBurst = (groups, options = {}) => {
    const opts = { ...DEFAULTS, ...options };
    const sequence = ['center', 'inner', 'outer'];
    let totalDelay = 0;
    
    sequence.forEach((groupName, waveIndex) => {
      const ids = groups[groupName] || [];
      
      ids.forEach((id, i) => {
        const shape = getShape(id);
        if (!shape) return;
        
        gsap.to(shape, {
          fill: opts.fill,
          duration: opts.duration,
          repeat: opts.repeat,
          yoyo: opts.yoyo,
          ease: opts.ease,
          delay: totalDelay + (i * opts.stagger)
        });
      });
      
      totalDelay += (ids.length * opts.stagger) + (opts.groupDelay || 0.3);
    });
    
    return totalDelay;
  };

  /**
   * PATTERN: Wave (Left to Right or Top to Bottom)
   * Elements light up in a sweeping wave pattern
   */
  const wave = (ids, options = {}) => {
    const opts = { ...DEFAULTS, direction: 'horizontal', ...options };
    
    // For wave, we might want to sort by position
    // This is a simplified version - assumes ids are already in wave order
    return sequential(ids, opts);
  };

  /**
   * PATTERN: Spiral
   * Elements light up in a spiral pattern from outside to center
   */
  const spiral = (ids, options = {}) => {
    const opts = { ...DEFAULTS, inward: true, ...options };
    
    // Reverse order for inward spiral
    const orderedIds = opts.inward ? [...ids].reverse() : ids;
    
    orderedIds.forEach((id, i) => {
      const shape = getShape(id);
      if (!shape) return;
      
      gsap.to(shape, {
        fill: opts.fill,
        duration: opts.duration,
        repeat: opts.repeat,
        yoyo: opts.yoyo,
        ease: opts.ease,
        delay: i * opts.stagger
      });
    });
    
    return orderedIds.length * opts.stagger + opts.duration;
  };

  /**
   * PATTERN: Random Sparkle
   * Elements light up in random order with variation
   */
  const randomSparkle = (ids, options = {}) => {
    const opts = { ...DEFAULTS, ...options };
    
    // Shuffle ids for random order
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    
    shuffled.forEach((id, i) => {
      const shape = getShape(id);
      if (!shape) return;
      
      // Add some randomness to duration and delay
      const randomDuration = opts.duration * (0.8 + Math.random() * 0.4);
      const randomDelay = (i * opts.stagger) + (Math.random() * 0.2);
      
      gsap.to(shape, {
        fill: opts.fill,
        duration: randomDuration,
        repeat: opts.repeat,
        yoyo: opts.yoyo,
        ease: opts.ease,
        delay: randomDelay
      });
    });
    
    return shuffled.length * opts.stagger + opts.duration;
  };

  /**
   * PATTERN: Pulse All
   * All elements pulse together in sync
   */
  const pulseAll = (ids, options = {}) => {
    const opts = { ...DEFAULTS, stagger: 0, ...options };
    
    ids.forEach((id) => {
      const shape = getShape(id);
      if (!shape) return;
      
      gsap.to(shape, {
        fill: opts.fill,
        duration: opts.duration,
        repeat: opts.repeat,
        yoyo: opts.yoyo,
        ease: opts.ease,
        delay: opts.stagger
      });
    });
    
    return opts.duration;
  };

  /**
   * PATTERN: Binary (Alternating On/Off)
   * Elements alternate between two states
   */
  const binary = (ids, options = {}) => {
    const opts = { 
      ...DEFAULTS, 
      fillA: "#77ffcc",
      fillB: "#6699bf",
      ...options 
    };
    
    ids.forEach((id, i) => {
      const shape = getShape(id);
      if (!shape) return;
      
      const isEven = i % 2 === 0;
      
      gsap.to(shape, {
        fill: isEven ? opts.fillA : opts.fillB,
        duration: opts.duration,
        repeat: opts.repeat,
        yoyo: opts.yoyo,
        ease: opts.ease,
        delay: i * opts.stagger
      });
    });
    
    return ids.length * opts.stagger + opts.duration;
  };

  /**
   * PATTERN: Breathing (for Triple Goddess)
   * Gentle opacity pulse - creates breathing effect
   */
  const breathing = (ids, options = {}) => {
    const opts = {
      opacityFrom: 0.7,
      opacityTo: 1.0,
      duration: 2.5,
      stagger: 0.3,
      ease: "sine.inOut",
      ...options
    };
    
    ids.forEach((id, i) => {
      const element = document.getElementById(id);
      if (!element) return;
      
      gsap.to(element, {
        opacity: opts.opacityTo,
        duration: opts.duration,
        repeat: -1,
        yoyo: true,
        ease: opts.ease,
        delay: i * opts.stagger
      });
    });
    
    return ids.length * opts.stagger + opts.duration;
  };

  /**
   * PATTERN: Goddess Phases
   * Triple goddess cycles through moon phases
   * Waxing → Full → Waning
   */
  const goddessPhases = (options = {}) => {
    const opts = {
      duration: 3.0,
      stagger: 1.0,
      ease: "sine.inOut",
      ...options
    };
    
    const crescents = ['crescent-left', 'crescent-right', 'crescent-top'];
    const full = 'full-circle';
    const bindu = 'bindu';
    
    const tl = gsap.timeline({ repeat: -1 });
    
    // Waxing phase - left crescent brightens
    tl.to(`#${crescents[0]}`, {
      fill: "#99ceff",
      opacity: 1,
      duration: opts.duration,
      ease: opts.ease
    }, 0);
    
    // Full phase - center glows
    tl.to(`#${full}`, {
      fill: "#88b3dd",
      duration: opts.duration,
      ease: opts.ease
    }, opts.stagger);
    
    // Waning phase - right crescent brightens  
    tl.to(`#${crescents[1]}`, {
      fill: "#99ceff",
      opacity: 1,
      duration: opts.duration,
      ease: opts.ease
    }, opts.stagger * 2);
    
    // Bindu pulse throughout
    tl.to(`#${bindu}`, {
      opacity: 0.5,
      scale: 1.2,
      duration: opts.duration * 0.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      transformOrigin: "center center"
    }, 0);
    
    return opts.duration * 3;
  };

  /**
   * STOP all animations on given elements
   */
  const stop = (ids) => {
    ids.forEach(id => {
      const shape = getShape(id);
      if (shape) gsap.killTweensOf(shape);
    });
  };

  /**
   * STOP all animations everywhere
   */
  const stopAll = () => {
    stopBreathCycle();
    gsap.killTweensOf("polygon, polyline, path, circle");
  };

  // Public API
  return {
    // Pattern functions
    sequential,
    radialBurst,
    wave,
    spiral,
    randomSparkle,
    pulseAll,
    binary,
    breathing,
    goddessPhases,
    breathCycle,
    
    // Control functions
    stop,
    stopAll,
    stopBreathCycle,
    
    // Helpers
    getShape,
    getShapes,
    
    // Constants (exposed for reference)
    BREATH_PRESETS,
    METATRON_LAYERS,
    
    // Play pattern by name
    playPattern: (patternName, ids, options = {}) => {
      const patterns = {
        sequential,
        radialBurst,
        wave,
        spiral,
        randomSparkle,
        pulseAll,
        binary,
        breathing,
        goddessPhases,
        breathCycle
      };
      
      const pattern = patterns[patternName];
      if (!pattern) {
        console.warn(`Pattern "${patternName}" not found`);
        return 0;
      }
      
      return pattern(ids, options);
    }
  };
})();

console.log("🎨 Animation Patterns Library loaded (v2.0 with breathCycle)");
