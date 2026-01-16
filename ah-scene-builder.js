/*--------------------------------------------------------------
  Awakening Heart : Scene Builder
  Version: 1.2.1 | Date: 2025-01-16
  
  Unified animation system for Metatron facets and portals.
  
  CHANGES in v1.2.1:
  - Fixed inner portals incorrectly getting breathing animation
  - Fixed center portal breathing not working
  - Added more debug logging
  - Removed aggressive gsap.killTweensOf("*")
  
  CHANGES in v1.2.0:
  - Center portal breathing modes: static, synced, reversed
  
  CHANGES in v1.1.0:
  - Configurable outer portals (breathing with fill color)
  - Configurable inner portals (animated like facets)
  - Configurable center portal (static, separate from divination)
--------------------------------------------------------------*/

(function() {
  'use strict';

  // ============================================================
  // BREATH PRESETS (Elite HRV therapeutic patterns)
  // ============================================================
  
  const BREATH_PRESETS = {
    resonance:   { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
    deepCalm:    { inhale: 4, holdIn: 1, exhale: 8, holdOut: 1 },
    easeAnxiety: { inhale: 4, holdIn: 0, exhale: 7, holdOut: 0 },
    box:         { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
    relaxation:  { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
    simple:      { inhale: 3, holdIn: 0, exhale: 3, holdOut: 0 }
  };

  // ============================================================
  // BREATH INTENSITY DEFAULTS
  // ============================================================
  
  const BREATH_DEFAULTS = {
    scaleMin: 0.88,
    scaleMax: 1.0,
    opacityMin: 0.3,
    opacityMax: 0.9,
    holdScale: 0.008,
    holdOpacity: 0.03
  };

  // ============================================================
  // PORTAL IDS
  // ============================================================
  
  // Outer portals (breathing)
  const OUTER_PORTAL_FILL_IDS = ["P_OT", "P_ORT", "P_ORB", "P_OB", "P_OLB", "P_OLT"];
  const OUTER_PORTAL_STROKE_IDS = ["P_OT_S", "P_ORT_S", "P_ORB_S", "P_OB_S", "P_OLB_S", "P_OLT_S"];
  
  // Inner portals (animated like facets - NO breathing/scale)
  const INNER_PORTAL_FILL_IDS = ["P_IT", "P_IRT", "P_IRB", "P_IB", "P_ILB", "P_ILT"];
  const INNER_PORTAL_STROKE_IDS = ["P_IT_S", "P_IRT_S", "P_IRB_S", "P_IB_S", "P_ILB_S", "P_ILT_S"];
  
  // Center portal (separate)
  const CENTER_PORTAL_FILL_ID = "P_C";
  const CENTER_PORTAL_STROKE_ID = "P_C_S";

  // ============================================================
  // HELPER: Get element by ID (returns the element directly)
  // ============================================================
  
  function getShape(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`⚠️ Element not found: ${id}`);
      return null;
    }
    
    // If it's a group, find the shape inside
    if (el.tagName === 'g') {
      const shape = el.querySelector('polygon, polyline, circle, path, rect');
      if (!shape) {
        console.warn(`⚠️ No shape found inside group: ${id}`);
        return null;
      }
      return shape;
    }
    return el;
  }

  // ============================================================
  // HELPER: Get multiple shapes from ID array
  // ============================================================
  
  function getShapes(ids) {
    return ids.map(getShape).filter(Boolean);
  }

  // ============================================================
  // STOP ALL ANIMATIONS (more targeted)
  // ============================================================
  
  function stopAllAnimations() {
    // Kill stored timelines
    if (window._sceneTimelines) {
      window._sceneTimelines.forEach(tl => {
        if (tl && tl.kill) tl.kill();
      });
    }
    window._sceneTimelines = [];
    
    // Kill breath timeline
    if (window._breathTimeline) {
      window._breathTimeline.kill();
      window._breathTimeline = null;
    }
    
    // Kill center breath timeline
    if (window._centerBreathTimeline) {
      window._centerBreathTimeline.kill();
      window._centerBreathTimeline = null;
    }
    
    // Kill tweens on specific portal and facet elements (not everything)
    const allPortalIds = [
      ...OUTER_PORTAL_FILL_IDS, ...OUTER_PORTAL_STROKE_IDS,
      ...INNER_PORTAL_FILL_IDS, ...INNER_PORTAL_STROKE_IDS,
      CENTER_PORTAL_FILL_ID, CENTER_PORTAL_STROKE_ID
    ];
    
    allPortalIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) gsap.killTweensOf(el);
    });
    
    // Kill tweens on facets (F_ prefix)
    document.querySelectorAll('[id^="F_"]').forEach(el => {
      gsap.killTweensOf(el);
      const shape = el.querySelector('polygon, polyline, circle, path, rect');
      if (shape) gsap.killTweensOf(shape);
    });
    
    // Clear active scene reference
    window.activeScene = null;
    
    console.log("⏹️ All animations stopped");
  }

  // ============================================================
  // OUTER PORTALS: BREATHING ANIMATION
  // ============================================================
  
  function createBreathingAnimation(preset, portalConfig = {}) {
    const timing = BREATH_PRESETS[preset] || BREATH_PRESETS.deepCalm;
    const cycle = timing.inhale + timing.holdIn + timing.exhale + timing.holdOut;
    
    const portalFill = portalConfig.fill || "#ed95df";
    const portalOpacityMax = portalConfig.opacity ?? BREATH_DEFAULTS.opacityMax;
    const portalOpacityMin = portalConfig.opacityMin ?? BREATH_DEFAULTS.opacityMin;
    
    const BREATH = {
      scaleMin: portalConfig.scaleMin ?? BREATH_DEFAULTS.scaleMin,
      scaleMax: portalConfig.scaleMax ?? BREATH_DEFAULTS.scaleMax,
      opacityMin: portalOpacityMin,
      opacityMax: portalOpacityMax,
      holdScale: BREATH_DEFAULTS.holdScale,
      holdOpacity: BREATH_DEFAULTS.holdOpacity
    };

    // Get ONLY outer portal elements
    const outerFills = getShapes(OUTER_PORTAL_FILL_IDS);
    const outerStrokes = getShapes(OUTER_PORTAL_STROKE_IDS);
    
    console.log(`🌬️ Outer Portals Breathing: ${preset}`);
    console.log(`   Found ${outerFills.length} fills, ${outerStrokes.length} strokes`);
    console.log(`   IDs: ${OUTER_PORTAL_FILL_IDS.join(', ')}`);
    
    if (outerFills.length === 0) {
      console.warn("⚠️ No outer portal fill elements found");
      return null;
    }

    console.log(`   Pattern: ${timing.inhale}s in → ${timing.holdIn}s hold → ${timing.exhale}s out → ${timing.holdOut}s hold`);
    console.log(`   Cycle: ${cycle}s`);
    console.log(`   Fill: ${portalFill} | Opacity: ${BREATH.opacityMin} → ${BREATH.opacityMax}`);

    // Set initial state - ONLY outer fills
    outerFills.forEach(shape => {
      gsap.set(shape, {
        fill: portalFill,
        scale: BREATH.scaleMax,
        opacity: BREATH.opacityMax,
        transformOrigin: "center center"
      });
    });
    
    // Strokes - ONLY outer strokes
    outerStrokes.forEach(shape => {
      gsap.set(shape, {
        scale: BREATH.scaleMax,
        opacity: BREATH.opacityMax,
        transformOrigin: "center center"
      });
    });

    // Combine for animation
    const portalShapes = [...outerFills, ...outerStrokes];

    // Create breath timeline
    const tl = gsap.timeline({ repeat: -1 });
    let pos = 0;

    // INHALE: Contract + Dim
    tl.to(portalShapes, {
      scale: BREATH.scaleMin,
      opacity: BREATH.opacityMin,
      duration: timing.inhale,
      ease: "sine.inOut"
    }, pos);
    pos += timing.inhale;

    // HOLD-IN
    if (timing.holdIn > 0) {
      tl.to(portalShapes, {
        scale: BREATH.scaleMin + BREATH.holdScale,
        opacity: BREATH.opacityMin + BREATH.holdOpacity,
        duration: timing.holdIn / 2,
        ease: "sine.inOut"
      }, pos);
      tl.to(portalShapes, {
        scale: BREATH.scaleMin,
        opacity: BREATH.opacityMin,
        duration: timing.holdIn / 2,
        ease: "sine.inOut"
      }, pos + timing.holdIn / 2);
      pos += timing.holdIn;
    }

    // EXHALE: Expand + Brighten
    tl.to(portalShapes, {
      scale: BREATH.scaleMax,
      opacity: BREATH.opacityMax,
      duration: timing.exhale,
      ease: "sine.inOut"
    }, pos);
    pos += timing.exhale;

    // HOLD-OUT
    if (timing.holdOut > 0) {
      tl.to(portalShapes, {
        scale: BREATH.scaleMax - BREATH.holdScale,
        opacity: BREATH.opacityMax - BREATH.holdOpacity,
        duration: timing.holdOut / 2,
        ease: "sine.inOut"
      }, pos);
      tl.to(portalShapes, {
        scale: BREATH.scaleMax,
        opacity: BREATH.opacityMax,
        duration: timing.holdOut / 2,
        ease: "sine.inOut"
      }, pos + timing.holdOut / 2);
    }

    return tl;
  }

  // ============================================================
  // CENTER PORTAL: BREATHING ANIMATION (Synced or Reversed)
  // ============================================================
  
  function createCenterBreathingAnimation(preset, centerConfig = {}, reversed = false) {
    const timing = BREATH_PRESETS[preset] || BREATH_PRESETS.deepCalm;
    
    const centerFill = centerConfig.fill || "#ffffff";
    const centerOpacityMax = centerConfig.opacity ?? 0.8;
    const centerOpacityMin = centerConfig.opacityMin ?? 0.2;
    
    const BREATH = {
      scaleMin: centerConfig.scaleMin ?? 0.85,
      scaleMax: centerConfig.scaleMax ?? 1.1,
      opacityMin: centerOpacityMin,
      opacityMax: centerOpacityMax,
      holdScale: BREATH_DEFAULTS.holdScale,
      holdOpacity: BREATH_DEFAULTS.holdOpacity
    };

    // Get center portal elements directly
    const centerFillEl = document.getElementById(CENTER_PORTAL_FILL_ID);
    const centerStrokeEl = document.getElementById(CENTER_PORTAL_STROKE_ID);
    
    console.log(`🎯 Looking for center portal: ${CENTER_PORTAL_FILL_ID}`);
    console.log(`   Found fill element: ${!!centerFillEl}`);
    console.log(`   Found stroke element: ${!!centerStrokeEl}`);
    
    if (!centerFillEl) {
      console.warn("⚠️ Center portal fill element not found");
      return null;
    }
    
    const centerShapes = [centerFillEl, centerStrokeEl].filter(Boolean);
    
    const modeLabel = reversed ? "reversed" : "synced";
    console.log(`🎯 Center Portal Breathing: ${modeLabel}`);
    console.log(`   Fill: ${centerFill} | Opacity: ${BREATH.opacityMin} → ${BREATH.opacityMax}`);
    console.log(`   Scale: ${BREATH.scaleMin} → ${BREATH.scaleMax}`);

    // Set initial state based on mode
    const initialScale = reversed ? BREATH.scaleMin : BREATH.scaleMax;
    const initialOpacity = reversed ? BREATH.opacityMin : BREATH.opacityMax;
    
    gsap.set(centerFillEl, {
      fill: centerFill,
      scale: initialScale,
      opacity: initialOpacity,
      transformOrigin: "center center"
    });
    
    if (centerStrokeEl) {
      gsap.set(centerStrokeEl, {
        scale: initialScale,
        opacity: initialOpacity * 0.8,
        transformOrigin: "center center"
      });
    }

    // Create breath timeline
    const tl = gsap.timeline({ repeat: -1 });
    let pos = 0;

    if (reversed) {
      // REVERSED: Expand on inhale, contract on exhale
      
      // INHALE: Expand + Brighten
      tl.to(centerShapes, {
        scale: BREATH.scaleMax,
        opacity: BREATH.opacityMax,
        duration: timing.inhale,
        ease: "sine.inOut"
      }, pos);
      pos += timing.inhale;

      // HOLD-IN
      if (timing.holdIn > 0) {
        tl.to(centerShapes, {
          scale: BREATH.scaleMax - BREATH.holdScale,
          opacity: BREATH.opacityMax - BREATH.holdOpacity,
          duration: timing.holdIn / 2,
          ease: "sine.inOut"
        }, pos);
        tl.to(centerShapes, {
          scale: BREATH.scaleMax,
          opacity: BREATH.opacityMax,
          duration: timing.holdIn / 2,
          ease: "sine.inOut"
        }, pos + timing.holdIn / 2);
        pos += timing.holdIn;
      }

      // EXHALE: Contract + Dim
      tl.to(centerShapes, {
        scale: BREATH.scaleMin,
        opacity: BREATH.opacityMin,
        duration: timing.exhale,
        ease: "sine.inOut"
      }, pos);
      pos += timing.exhale;

      // HOLD-OUT
      if (timing.holdOut > 0) {
        tl.to(centerShapes, {
          scale: BREATH.scaleMin + BREATH.holdScale,
          opacity: BREATH.opacityMin + BREATH.holdOpacity,
          duration: timing.holdOut / 2,
          ease: "sine.inOut"
        }, pos);
        tl.to(centerShapes, {
          scale: BREATH.scaleMin,
          opacity: BREATH.opacityMin,
          duration: timing.holdOut / 2,
          ease: "sine.inOut"
        }, pos + timing.holdOut / 2);
      }
      
    } else {
      // SYNCED: Same as outer portals
      
      // INHALE: Contract + Dim
      tl.to(centerShapes, {
        scale: BREATH.scaleMin,
        opacity: BREATH.opacityMin,
        duration: timing.inhale,
        ease: "sine.inOut"
      }, pos);
      pos += timing.inhale;

      // HOLD-IN
      if (timing.holdIn > 0) {
        tl.to(centerShapes, {
          scale: BREATH.scaleMin + BREATH.holdScale,
          opacity: BREATH.opacityMin + BREATH.holdOpacity,
          duration: timing.holdIn / 2,
          ease: "sine.inOut"
        }, pos);
        tl.to(centerShapes, {
          scale: BREATH.scaleMin,
          opacity: BREATH.opacityMin,
          duration: timing.holdIn / 2,
          ease: "sine.inOut"
        }, pos + timing.holdIn / 2);
        pos += timing.holdIn;
      }

      // EXHALE: Expand + Brighten
      tl.to(centerShapes, {
        scale: BREATH.scaleMax,
        opacity: BREATH.opacityMax,
        duration: timing.exhale,
        ease: "sine.inOut"
      }, pos);
      pos += timing.exhale;

      // HOLD-OUT
      if (timing.holdOut > 0) {
        tl.to(centerShapes, {
          scale: BREATH.scaleMax - BREATH.holdScale,
          opacity: BREATH.opacityMax - BREATH.holdOpacity,
          duration: timing.holdOut / 2,
          ease: "sine.inOut"
        }, pos);
        tl.to(centerShapes, {
          scale: BREATH.scaleMax,
          opacity: BREATH.opacityMax,
          duration: timing.holdOut / 2,
          ease: "sine.inOut"
        }, pos + timing.holdOut / 2);
      }
    }

    console.log(`✅ Center breathing timeline created`);
    return tl;
  }

  // ============================================================
  // INNER PORTALS: FILL ANIMATION ONLY (no scale/breathing)
  // ============================================================
  
  function animateInnerPortals(config = {}) {
    const fill = config.fill || "#77ffcc";
    const duration = config.duration ?? 2.0;
    const stagger = config.stagger ?? 0.15;
    const delay = config.delay ?? 0;
    const repeat = config.repeat ?? -1;
    const yoyo = config.yoyo ?? true;
    const ease = config.ease || "sine.inOut";
    
    // Get ONLY inner portal fills
    const innerFills = getShapes(INNER_PORTAL_FILL_IDS);
    
    console.log(`✨ Inner Portals: ${innerFills.length} fills (NO scale animation)`);
    console.log(`   IDs: ${INNER_PORTAL_FILL_IDS.join(', ')}`);
    console.log(`   Fill: ${fill}, duration: ${duration}s, stagger: ${stagger}s, delay: ${delay}s`);
    
    if (innerFills.length === 0) {
      console.warn("⚠️ No inner portal elements found");
      return [];
    }
    
    // Set initial state - transparent fill, NO scale changes
    innerFills.forEach(shape => {
      gsap.set(shape, {
        fill: "transparent",
        opacity: 1
        // NO scale or transformOrigin - we don't want any scale animation
      });
    });
    
    // Create tweens for FILL ONLY
    const tweens = [];
    innerFills.forEach((shape, i) => {
      const tween = gsap.to(shape, {
        fill: fill,
        duration: duration,
        repeat: repeat,
        yoyo: yoyo,
        ease: ease,
        delay: delay + (i * stagger)
        // NO scale animation
      });
      tweens.push(tween);
    });
    
    return tweens;
  }

  // ============================================================
  // CENTER PORTAL: STATIC CONFIGURATION
  // ============================================================
  
  function configureCenterPortalStatic(config = {}) {
    const fill = config.fill || "transparent";
    const opacity = config.opacity ?? 0;
    
    const centerFill = document.getElementById(CENTER_PORTAL_FILL_ID);
    const centerStroke = document.getElementById(CENTER_PORTAL_STROKE_ID);
    
    if (centerFill) {
      gsap.set(centerFill, {
        fill: fill,
        opacity: opacity
      });
      console.log(`🎯 Center Portal (static): fill ${fill}, opacity ${opacity}`);
    }
    
    if (centerStroke) {
      gsap.set(centerStroke, {
        opacity: opacity > 0 ? 0.8 : 0
      });
    }
  }

  // ============================================================
  // FACET GROUP ANIMATION
  // ============================================================
  
  function animateFacetGroup(group, groupIndex) {
    const ids = group.ids || [];
    const fill = group.fill || "#33ffcc";
    const duration = group.duration ?? 2.5;
    const stagger = group.stagger ?? 0.15;
    const delay = group.delay ?? 0;
    const repeat = group.repeat ?? -1;
    const yoyo = group.yoyo ?? true;
    const ease = group.ease || "sine.inOut";
    const groupName = group.name || `Group ${groupIndex + 1}`;

    const shapes = getShapes(ids);

    console.log(`   ${groupName}: ${shapes.length}/${ids.length} facets`);
    console.log(`      fill: ${fill}, duration: ${duration}s, stagger: ${stagger}s, delay: ${delay}s`);

    if (shapes.length === 0) return [];

    // Set initial state
    shapes.forEach(shape => {
      gsap.set(shape, {
        fill: "transparent",
        opacity: 1
      });
    });

    // Create tweens
    const tweens = [];
    shapes.forEach((shape, i) => {
      const tween = gsap.to(shape, {
        fill: fill,
        duration: duration,
        repeat: repeat,
        yoyo: yoyo,
        ease: ease,
        delay: delay + (i * stagger)
      });
      tweens.push(tween);
    });

    return tweens;
  }

  // ============================================================
  // SCENE BUILDER (Main Function)
  // ============================================================
  
  function sceneBuilder(config) {
    // Stop any existing animations
    stopAllAnimations();
    
    // Initialize storage
    window._sceneTimelines = [];
    
    // Extract config
    const sceneName = config.name || "Custom Scene";
    const breathPreset = config.breathPreset || "deepCalm";
    const outerPortalsConfig = config.outerPortals || {};
    const innerPortalsConfig = config.innerPortals || null;
    const centerPortalConfig = config.centerPortal || null;
    const facetGroups = config.facetGroups || [];
    const breathDelay = config.breathDelay ?? 0;
    const autoStartBreathing = config.autoStartBreathing ?? true;

    console.log(`🎬 Scene Builder: ${sceneName}`);
    console.log(`   Breath preset: ${breathPreset}`);
    console.log(`   Facet groups: ${facetGroups.length}`);
    console.log(`   Outer portals config: ${JSON.stringify(outerPortalsConfig)}`);
    console.log(`   Inner portals config: ${innerPortalsConfig ? 'yes' : 'no'}`);
    console.log(`   Center portal config: ${centerPortalConfig ? JSON.stringify(centerPortalConfig) : 'no'}`);

    // --------------------------------------------------------
    // ANIMATE FACET GROUPS
    // --------------------------------------------------------
    
    const allTweens = [];
    
    facetGroups.forEach((group, index) => {
      const tweens = animateFacetGroup(group, index);
      allTweens.push(...tweens);
    });

    // --------------------------------------------------------
    // ANIMATE INNER PORTALS (fill only, no breathing)
    // --------------------------------------------------------
    
    if (innerPortalsConfig) {
      const innerTweens = animateInnerPortals(innerPortalsConfig);
      allTweens.push(...innerTweens);
    }

    // --------------------------------------------------------
    // BREATHING: OUTER PORTALS + CENTER PORTAL
    // --------------------------------------------------------
    
    let breathTimeline = null;
    let centerBreathTimeline = null;
    
    const startBreathing = () => {
      console.log(`🌬️ Starting breathing animations...`);
      
      // Start outer portals breathing
      breathTimeline = createBreathingAnimation(breathPreset, outerPortalsConfig);
      if (breathTimeline) {
        window._breathTimeline = breathTimeline;
        window._sceneTimelines.push(breathTimeline);
        console.log(`✅ Outer portals breathing started`);
      }
      
      // Start center portal breathing if configured
      if (centerPortalConfig) {
        const centerMode = centerPortalConfig.mode || "static";
        console.log(`🎯 Center portal mode: ${centerMode}`);
        
        if (centerMode === "synced") {
          centerBreathTimeline = createCenterBreathingAnimation(breathPreset, centerPortalConfig, false);
          if (centerBreathTimeline) {
            window._centerBreathTimeline = centerBreathTimeline;
            window._sceneTimelines.push(centerBreathTimeline);
            console.log(`✅ Center portal breathing started (synced)`);
          }
        } else if (centerMode === "reversed") {
          centerBreathTimeline = createCenterBreathingAnimation(breathPreset, centerPortalConfig, true);
          if (centerBreathTimeline) {
            window._centerBreathTimeline = centerBreathTimeline;
            window._sceneTimelines.push(centerBreathTimeline);
            console.log(`✅ Center portal breathing started (reversed)`);
          }
        } else {
          // Static mode
          configureCenterPortalStatic(centerPortalConfig);
        }
      }
    };
    
    if (autoStartBreathing) {
      if (breathDelay > 0) {
        console.log(`⏳ Breathing will start in ${breathDelay}s`);
        setTimeout(startBreathing, breathDelay * 1000);
      } else {
        startBreathing();
      }
    }

    console.log(`🎬 ${sceneName} running`);

    // --------------------------------------------------------
    // CONTROL API
    // --------------------------------------------------------
    
    const controls = {
      name: sceneName,
      
      stop: () => {
        stopAllAnimations();
        console.log(`⏹️ ${sceneName} stopped`);
      },
      
      pause: () => {
        if (window._breathTimeline) window._breathTimeline.pause();
        if (window._centerBreathTimeline) window._centerBreathTimeline.pause();
        allTweens.forEach(tween => { if (tween && tween.pause) tween.pause(); });
        console.log(`⏸️ ${sceneName} paused`);
      },
      
      resume: () => {
        if (window._breathTimeline) window._breathTimeline.resume();
        if (window._centerBreathTimeline) window._centerBreathTimeline.resume();
        allTweens.forEach(tween => { if (tween && tween.resume) tween.resume(); });
        console.log(`▶️ ${sceneName} resumed`);
      },
      
      restart: () => {
        console.log(`🔄 Restarting ${sceneName}`);
        sceneBuilder(config);
      },
      
      startBreathing: () => {
        if (window._breathTimeline) {
          console.log("⚠️ Breathing already running");
          return;
        }
        startBreathing();
      },
      
      stopBreathing: () => {
        if (window._breathTimeline) {
          window._breathTimeline.kill();
          window._breathTimeline = null;
        }
        if (window._centerBreathTimeline) {
          window._centerBreathTimeline.kill();
          window._centerBreathTimeline = null;
        }
        console.log(`🌬️ Breathing stopped`);
      },
      
      stopFacets: () => {
        allTweens.forEach(tween => { if (tween && tween.kill) tween.kill(); });
        console.log(`✨ Facets stopped`);
      },
      
      setBreathPreset: (newPreset) => {
        if (window._breathTimeline) window._breathTimeline.kill();
        if (window._centerBreathTimeline) window._centerBreathTimeline.kill();
        
        breathTimeline = createBreathingAnimation(newPreset, outerPortalsConfig);
        if (breathTimeline) window._breathTimeline = breathTimeline;
        
        if (centerPortalConfig) {
          const centerMode = centerPortalConfig.mode || "static";
          if (centerMode === "synced" || centerMode === "reversed") {
            centerBreathTimeline = createCenterBreathingAnimation(newPreset, centerPortalConfig, centerMode === "reversed");
            if (centerBreathTimeline) window._centerBreathTimeline = centerBreathTimeline;
          }
        }
        
        console.log(`🌬️ Breath preset changed to: ${newPreset}`);
      },
      
      getState: () => ({
        name: sceneName,
        breathPreset: breathPreset,
        facetGroupCount: facetGroups.length,
        isBreathing: !!window._breathTimeline,
        isCenterBreathing: !!window._centerBreathTimeline,
        isPaused: window._breathTimeline ? window._breathTimeline.paused() : false
      })
    };

    window.activeScene = controls;
    return controls;
  }

  // ============================================================
  // READ CONFIG FROM DOM
  // ============================================================
  
  function readSceneConfig() {
    const el = document.getElementById('scene-config') || document.getElementById('scene-config-data');
    if (!el) {
      console.log("ℹ️ No scene-config element found");
      return null;
    }
    
    try {
      const config = JSON.parse(el.textContent.trim());
      console.log("📋 Scene config loaded from DOM:", config.name || "Unnamed");
      return config;
    } catch (e) {
      console.warn("⚠️ Failed to parse scene-config JSON:", e);
      return null;
    }
  }

  // ============================================================
  // EXPORTS
  // ============================================================
  
  window.sceneBuilder = sceneBuilder;
  window.stopAllAnimations = stopAllAnimations;
  
  window.AHSceneBuilder = {
    sceneBuilder,
    stopAllAnimations,
    createBreathingAnimation,
    createCenterBreathingAnimation,
    animateInnerPortals,
    configureCenterPortalStatic,
    getShape,
    getShapes,
    readSceneConfig,
    BREATH_PRESETS,
    BREATH_DEFAULTS,
    OUTER_PORTAL_FILL_IDS,
    INNER_PORTAL_FILL_IDS,
    CENTER_PORTAL_FILL_ID
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  console.log("🎬 Scene Builder v1.2.1 loaded");
  console.log("═══════════════════════════════════════════════════════");

})();
