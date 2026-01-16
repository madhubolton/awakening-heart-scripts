/*--------------------------------------------------------------
  Awakening Heart : Scene Builder
  Version: 1.0.0 | Date: 2025-01-16
  
  Unified animation system for Metatron facets and breathing portals.
  Replaces ah-animation-patterns.js and ah-metatron.js
  
  Features:
  - Multiple facet groups with independent timing
  - Breathing portals synchronized to therapeutic HRV patterns
  - Clean API with stop/pause/resume/restart controls
  - Compositional layering (same facets in multiple groups)
  
  Usage:
    // Start a scene
    window.sceneBuilder({
      name: "My Scene",
      breathPreset: "deepCalm",
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
    window.activeScene.restart();
    
    // Stop everything
    window.stopAllAnimations();
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
    opacityMin: 0.4,
    opacityMax: 0.95,
    holdScale: 0.008,
    holdOpacity: 0.03
  };

  // ============================================================
  // PORTAL IDS (Outer ring breathing elements)
  // ============================================================
  
  const OUTER_PORTAL_IDS = ["P_OT", "P_ORT", "P_ORB", "P_OB", "P_OLB", "P_OLT"];
  const OUTER_STROKE_IDS = ["P_OT_S", "P_ORT_S", "P_ORB_S", "P_OB_S", "P_OLB_S", "P_OLT_S"];

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
  // BREATHING PORTALS ANIMATION
  // ============================================================
  
  function createBreathingAnimation(preset, options = {}) {
    const timing = BREATH_PRESETS[preset] || BREATH_PRESETS.deepCalm;
    const cycle = timing.inhale + timing.holdIn + timing.exhale + timing.holdOut;
    
    const BREATH = {
      scaleMin: options.scaleMin ?? BREATH_DEFAULTS.scaleMin,
      scaleMax: options.scaleMax ?? BREATH_DEFAULTS.scaleMax,
      opacityMin: options.opacityMin ?? BREATH_DEFAULTS.opacityMin,
      opacityMax: options.opacityMax ?? BREATH_DEFAULTS.opacityMax,
      holdScale: BREATH_DEFAULTS.holdScale,
      holdOpacity: BREATH_DEFAULTS.holdOpacity
    };

    // Get portal elements
    const portalShapes = getShapes([...OUTER_PORTAL_IDS, ...OUTER_STROKE_IDS]);
    
    if (portalShapes.length === 0) {
      console.warn("⚠️ No breathing portal elements found");
      return null;
    }

    console.log(`🌬️ Breathing: ${preset} (${timing.inhale}s in → ${timing.holdIn}s hold → ${timing.exhale}s out → ${timing.holdOut}s hold)`);
    console.log(`   Cycle: ${cycle}s | Portals: ${portalShapes.length}`);

    // Set initial state (expanded + bright, ready to inhale)
    gsap.set(portalShapes, {
      scale: BREATH.scaleMax,
      opacity: BREATH.opacityMax,
      transformOrigin: "center center"
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
    const breathOptions = config.breathOptions || {};
    const facetGroups = config.facetGroups || [];
    const breathDelay = config.breathDelay ?? 0;
    const autoStartBreathing = config.autoStartBreathing ?? true;

    console.log(`🎬 Scene Builder: ${sceneName}`);
    console.log(`   Breath preset: ${breathPreset}`);
    console.log(`   Facet groups: ${facetGroups.length}`);
    console.log(`   Breath delay: ${breathDelay}s`);

    // --------------------------------------------------------
    // ANIMATE FACET GROUPS
    // --------------------------------------------------------
    
    const allTweens = [];
    
    facetGroups.forEach((group, index) => {
      const tweens = animateFacetGroup(group, index);
      allTweens.push(...tweens);
    });

    // --------------------------------------------------------
    // BREATHING PORTALS
    // --------------------------------------------------------
    
    let breathTimeline = null;
    
    if (autoStartBreathing) {
      if (breathDelay > 0) {
        setTimeout(() => {
          breathTimeline = createBreathingAnimation(breathPreset, breathOptions);
          if (breathTimeline) {
            window._breathTimeline = breathTimeline;
            window._sceneTimelines.push(breathTimeline);
          }
        }, breathDelay * 1000);
      } else {
        breathTimeline = createBreathingAnimation(breathPreset, breathOptions);
        if (breathTimeline) {
          window._breathTimeline = breathTimeline;
          window._sceneTimelines.push(breathTimeline);
        }
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
        breathTimeline = createBreathingAnimation(breathPreset, breathOptions);
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
        breathTimeline = createBreathingAnimation(newPreset, breathOptions);
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
    const el = document.getElementById('scene-config');
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
  // AUTO-START (if config exists in DOM)
  // ============================================================
  
  function autoStart() {
    const config = readSceneConfig();
    
    if (config) {
      // Check if breathing should be delayed (for scene entry animation)
      // The scene controller will handle this by setting autoStartBreathing: false
      // and calling startBreathing() after entry animation completes
      
      console.log("🚀 Auto-starting scene from config");
      sceneBuilder(config);
    } else {
      console.log("ℹ️ No auto-start config - waiting for manual sceneBuilder() call");
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
    getShape,
    getShapes,
    readSceneConfig,
    BREATH_PRESETS,
    BREATH_DEFAULTS,
    OUTER_PORTAL_IDS
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  console.log("🎬 Scene Builder v1.0.0 loaded");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Usage:");
  console.log("  sceneBuilder({ name, breathPreset, facetGroups: [...] })");
  console.log("  window.activeScene.stop() / .pause() / .resume()");
  console.log("  stopAllAnimations()");
  console.log("═══════════════════════════════════════════════════════");

  // Don't auto-start on DOMContentLoaded - let the scene controller handle timing
  // The scene controller will call sceneBuilder() after entry animation completes

})();
