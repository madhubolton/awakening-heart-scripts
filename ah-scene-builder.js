/*--------------------------------------------------------------
  Awakening Heart : Scene Builder
  Version: 1.1.0 | Date: 2025-01-16
  
  Unified animation system for Metatron facets and portals.
  Replaces ah-animation-patterns.js and ah-metatron.js
  
  CHANGES in v1.1.0:
  - Configurable outer portals (breathing with fill color)
  - Configurable inner portals (animated like facets)
  - Configurable center portal (static, separate from divination)
  - Fixed portal fill color application
  
  Features:
  - Multiple facet groups with independent timing
  - Breathing outer portals synchronized to therapeutic HRV patterns
  - Animated inner portals (wave, pulse, sequential patterns)
  - Clean API with stop/pause/resume/restart controls
  - Compositional layering (same facets in multiple groups)
  
  Usage:
    window.sceneBuilder({
      name: "My Scene",
      breathPreset: "deepCalm",
      outerPortals: {
        fill: "#ed95df",
        opacity: 0.6
      },
      innerPortals: {
        fill: "#77ffcc",
        duration: 2.0,
        stagger: 0.15,
        delay: 0,
        repeat: -1,
        yoyo: true
      },
      centerPortal: {
        fill: "#ffffff",
        opacity: 0.5
      },
      facetGroups: [
        {
          name: "Group 1",
          ids: ["F_O_OCT_TL", "F_O_OCT_TR", ...],
          fill: "#33ffcc",
          duration: 2.5,
          stagger: 0.15,
          delay: 0,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        }
      ]
    });
    
    // Control the scene
    window.activeScene.stop();
    window.activeScene.pause();
    window.activeScene.resume();
--------------------------------------------------------------*/

(function() {
  'use strict';

  // ============================================================
  // BREATH PRESETS (Elite HRV therapeutic patterns)
  // ============================================================
  
  const BREATH_PRESETS = {
    resonance:   { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },  // 6 breaths/min
    deepCalm:    { inhale: 4, holdIn: 1, exhale: 8, holdOut: 1 },  // 4.3 breaths/min
    easeAnxiety: { inhale: 4, holdIn: 0, exhale: 7, holdOut: 0 },  // 5.5 breaths/min
    box:         { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },  // Box breathing
    relaxation:  { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },  // 4-7-8 pattern
    simple:      { inhale: 3, holdIn: 0, exhale: 3, holdOut: 0 }   // Simple rhythm
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
  
  // Inner portals (animated like facets)
  const INNER_PORTAL_FILL_IDS = ["P_IT", "P_IRT", "P_IRB", "P_IB", "P_ILB", "P_ILT"];
  const INNER_PORTAL_STROKE_IDS = ["P_IT_S", "P_IRT_S", "P_IRB_S", "P_IB_S", "P_ILB_S", "P_ILT_S"];
  
  // Center portal (separate - used for divination)
  const CENTER_PORTAL_FILL_ID = "P_C";
  const CENTER_PORTAL_STROKE_ID = "P_C_S";

  // ============================================================
  // HELPER: Get animatable shape from element ID
  // ============================================================
  
  function getShape(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    
    // If it's a group, find the shape inside
    if (el.tagName === 'g') {
      return el.querySelector('polygon, polyline, circle, path, rect') || el;
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
  // STOP ALL ANIMATIONS
  // ============================================================
  
  function stopAllAnimations() {
    // Clear GSAP
    gsap.globalTimeline.clear();
    gsap.killTweensOf("*");
    
    // Clear stored timelines
    if (window._sceneTimelines) {
      window._sceneTimelines.forEach(tl => {
        if (tl && tl.kill) tl.kill();
      });
    }
    window._sceneTimelines = [];
    
    // Clear breath timeline
    if (window._breathTimeline) {
      window._breathTimeline.kill();
      window._breathTimeline = null;
    }
    
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
    
    // Get portal fill color from config
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

    // Get outer portal elements (fills and strokes)
    const outerFills = getShapes(OUTER_PORTAL_FILL_IDS);
    const outerStrokes = getShapes(OUTER_PORTAL_STROKE_IDS);
    const portalShapes = [...outerFills, ...outerStrokes];
    
    if (portalShapes.length === 0) {
      console.warn("⚠️ No outer portal elements found");
      return null;
    }

    console.log(`🌬️ Outer Portals Breathing: ${preset}`);
    console.log(`   Pattern: ${timing.inhale}s in → ${timing.holdIn}s hold → ${timing.exhale}s out → ${timing.holdOut}s hold`);
    console.log(`   Cycle: ${cycle}s | Portals: ${portalShapes.length}`);
    console.log(`   Fill: ${portalFill} | Opacity: ${BREATH.opacityMin} → ${BREATH.opacityMax}`);

    // Set initial state with fill color (expanded + bright, ready to inhale)
    outerFills.forEach(shape => {
      gsap.set(shape, {
        fill: portalFill,
        scale: BREATH.scaleMax,
        opacity: BREATH.opacityMax,
        transformOrigin: "center center"
      });
    });
    
    // Strokes just scale and fade, no fill change
    outerStrokes.forEach(shape => {
      gsap.set(shape, {
        scale: BREATH.scaleMax,
        opacity: BREATH.opacityMax,
        transformOrigin: "center center"
      });
    });

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

    // HOLD-IN: Subtle micro-motion
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

    // HOLD-OUT: Subtle micro-motion
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
  // INNER PORTALS: ANIMATED LIKE FACETS
  // ============================================================
  
  function animateInnerPortals(config = {}) {
    // Extract config with defaults
    const fill = config.fill || "#77ffcc";
    const duration = config.duration ?? 2.0;
    const stagger = config.stagger ?? 0.15;
    const delay = config.delay ?? 0;
    const repeat = config.repeat ?? -1;
    const yoyo = config.yoyo ?? true;
    const ease = config.ease || "sine.inOut";
    
    // Get inner portal elements
    const innerFills = getShapes(INNER_PORTAL_FILL_IDS);
    const innerStrokes = getShapes(INNER_PORTAL_STROKE_IDS);
    
    console.log(`✨ Inner Portals: ${innerFills.length} fills, ${innerStrokes.length} strokes`);
    console.log(`   Fill: ${fill}, duration: ${duration}s, stagger: ${stagger}s, delay: ${delay}s`);
    
    if (innerFills.length === 0) {
      console.warn("⚠️ No inner portal elements found");
      return [];
    }
    
    // Set initial state (transparent)
    innerFills.forEach(shape => {
      shape.style.fill = "transparent";
      shape.style.opacity = "1";
    });
    
    // Create tweens for fills
    const tweens = [];
    innerFills.forEach((shape, i) => {
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
  // CENTER PORTAL: STATIC CONFIGURATION
  // ============================================================
  
  function configureCenterPortal(config = {}) {
    const fill = config.fill || "transparent";
    const opacity = config.opacity ?? 0;
    
    const centerFill = getShape(CENTER_PORTAL_FILL_ID);
    const centerStroke = getShape(CENTER_PORTAL_STROKE_ID);
    
    if (centerFill) {
      gsap.set(centerFill, {
        fill: fill,
        opacity: opacity
      });
      console.log(`🎯 Center Portal: fill ${fill}, opacity ${opacity}`);
    }
    
    // Stroke stays as-is (white outline)
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
    // Extract config with defaults
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

    // Set initial state (transparent)
    shapes.forEach(shape => {
      shape.style.fill = "transparent";
      shape.style.opacity = "1";
    });

    // Create individual tweens for each shape
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
    console.log(`   Breath delay: ${breathDelay}s`);

    // --------------------------------------------------------
    // CONFIGURE CENTER PORTAL (static)
    // --------------------------------------------------------
    
    if (centerPortalConfig) {
      configureCenterPortal(centerPortalConfig);
    }

    // --------------------------------------------------------
    // ANIMATE FACET GROUPS
    // --------------------------------------------------------
    
    const allTweens = [];
    
    facetGroups.forEach((group, index) => {
      const tweens = animateFacetGroup(group, index);
      allTweens.push(...tweens);
    });

    // --------------------------------------------------------
    // ANIMATE INNER PORTALS (like facets)
    // --------------------------------------------------------
    
    if (innerPortalsConfig) {
      const innerTweens = animateInnerPortals(innerPortalsConfig);
      allTweens.push(...innerTweens);
    }

    // --------------------------------------------------------
    // BREATHING OUTER PORTALS
    // --------------------------------------------------------
    
    let breathTimeline = null;
    
    if (autoStartBreathing) {
      const startBreathing = () => {
        breathTimeline = createBreathingAnimation(breathPreset, outerPortalsConfig);
        if (breathTimeline) {
          window._breathTimeline = breathTimeline;
          window._sceneTimelines.push(breathTimeline);
        }
      };
      
      if (breathDelay > 0) {
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
      
      // Stop all animations
      stop: () => {
        stopAllAnimations();
        console.log(`⏹️ ${sceneName} stopped`);
      },
      
      // Pause all animations
      pause: () => {
        if (window._breathTimeline) {
          window._breathTimeline.pause();
        }
        allTweens.forEach(tween => {
          if (tween && tween.pause) tween.pause();
        });
        console.log(`⏸️ ${sceneName} paused`);
      },
      
      // Resume all animations
      resume: () => {
        if (window._breathTimeline) {
          window._breathTimeline.resume();
        }
        allTweens.forEach(tween => {
          if (tween && tween.resume) tween.resume();
        });
        console.log(`▶️ ${sceneName} resumed`);
      },
      
      // Restart the scene
      restart: () => {
        console.log(`🔄 Restarting ${sceneName}`);
        sceneBuilder(config);
      },
      
      // Start breathing manually (if autoStartBreathing was false)
      startBreathing: () => {
        if (window._breathTimeline) {
          console.log("⚠️ Breathing already running");
          return;
        }
        breathTimeline = createBreathingAnimation(breathPreset, outerPortalsConfig);
        if (breathTimeline) {
          window._breathTimeline = breathTimeline;
          window._sceneTimelines.push(breathTimeline);
          console.log(`🌬️ Breathing started manually`);
        }
      },
      
      // Stop only breathing
      stopBreathing: () => {
        if (window._breathTimeline) {
          window._breathTimeline.kill();
          window._breathTimeline = null;
          console.log(`🌬️ Breathing stopped`);
        }
      },
      
      // Stop only facets
      stopFacets: () => {
        allTweens.forEach(tween => {
          if (tween && tween.kill) tween.kill();
        });
        console.log(`✨ Facets stopped`);
      },
      
      // Change breath preset on the fly
      setBreathPreset: (newPreset) => {
        if (window._breathTimeline) {
          window._breathTimeline.kill();
        }
        breathTimeline = createBreathingAnimation(newPreset, outerPortalsConfig);
        if (breathTimeline) {
          window._breathTimeline = breathTimeline;
          console.log(`🌬️ Breath preset changed to: ${newPreset}`);
        }
      },
      
      // Get current state
      getState: () => ({
        name: sceneName,
        breathPreset: breathPreset,
        facetGroupCount: facetGroups.length,
        isBreathing: !!window._breathTimeline,
        isPaused: window._breathTimeline ? window._breathTimeline.paused() : false
      })
    };

    // Store as active scene
    window.activeScene = controls;

    return controls;
  }

  // ============================================================
  // READ CONFIG FROM DOM (for CMS integration)
  // ============================================================
  
  function readSceneConfig() {
    // Try both possible element IDs
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
  
  // Main functions
  window.sceneBuilder = sceneBuilder;
  window.stopAllAnimations = stopAllAnimations;
  
  // Helpers (exposed for debugging/tools)
  window.AHSceneBuilder = {
    sceneBuilder,
    stopAllAnimations,
    createBreathingAnimation,
    animateInnerPortals,
    configureCenterPortal,
    getShape,
    getShapes,
    readSceneConfig,
    BREATH_PRESETS,
    BREATH_DEFAULTS,
    OUTER_PORTAL_FILL_IDS,
    OUTER_PORTAL_STROKE_IDS,
    INNER_PORTAL_FILL_IDS,
    INNER_PORTAL_STROKE_IDS,
    CENTER_PORTAL_FILL_ID
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  console.log("🎬 Scene Builder v1.1.0 loaded");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Usage:");
  console.log("  sceneBuilder({ name, breathPreset, outerPortals, innerPortals, centerPortal, facetGroups })");
  console.log("  window.activeScene.stop() / .pause() / .resume()");
  console.log("  stopAllAnimations()");
  console.log("═══════════════════════════════════════════════════════");

})();
