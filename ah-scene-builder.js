/*--------------------------------------------------------------
  Awakening Heart : Scene Builder
  Version: 1.4.2 | Date: 2025-01-18
  
  Unified animation system for Metatron facets and portals.
  
  CHANGES in v1.4.2:
  - Fixed: Breath sound only plays in MEDITATION mode (not philosophy/content)
  - Fixed: Breath sound volume reduced (configurable via BREATH_SOUND_VOLUME)
  
  CHANGES in v1.4.1:
  - Fixed: Breath sound now plays ONCE at inhale start AND exhale start
  - Fixed: Breath sound respects audio toggle state
  - Removed loop from breath audio (plays as marker, not continuous)
  
  CHANGES in v1.3.2:
  - Added try-catch error handling for center portal setup
  - Added try-catch around breathing animation startup
  - Better logging for center portal element detection
  - Prevents breathing errors from breaking facet animations
--------------------------------------------------------------*/

(function() {
  'use strict';

  // ============================================================
  // BREATH PRESETS (Elite HRV therapeutic patterns)
  // ============================================================
  
  const BREATH_PRESETS = {
    coherent:    { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },  // 6 breaths/min - easiest to drop into
    resonance:   { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },  // 6 breaths/min - slight exhale bias
    deepCalm:    { inhale: 4, holdIn: 1, exhale: 8, holdOut: 1 },  // 4.3 breaths/min - requires practice
    easeAnxiety: { inhale: 4, holdIn: 0, exhale: 7, holdOut: 0 },  // 5.5 breaths/min
    box:         { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },  // Box breathing
    relaxation:  { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },  // 4-7-8 pattern
    simple:      { inhale: 3, holdIn: 0, exhale: 3, holdOut: 0 }   // Gentle entry point
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
  
  const OUTER_PORTAL_FILL_IDS = ["P_OT", "P_ORT", "P_ORB", "P_OB", "P_OLB", "P_OLT"];
  const OUTER_PORTAL_STROKE_IDS = ["P_OT_S", "P_ORT_S", "P_ORB_S", "P_OB_S", "P_OLB_S", "P_OLT_S"];
  const INNER_PORTAL_FILL_IDS = ["P_IT", "P_IRT", "P_IRB", "P_IB", "P_ILB", "P_ILT"];
  const INNER_PORTAL_STROKE_IDS = ["P_IT_S", "P_IRT_S", "P_IRB_S", "P_IB_S", "P_ILB_S", "P_ILT_S"];
  const CENTER_PORTAL_FILL_ID = "P_C";
  const CENTER_PORTAL_STROKE_ID = "P_C_S";

  // ============================================================
  // HELPER: Get element by ID
  // ============================================================
  
  function getShape(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`⚠️ Element not found: ${id}`);
      return null;
    }
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

  function getShapes(ids) {
    return ids.map(getShape).filter(Boolean);
  }

  // ============================================================
  // STOP ALL ANIMATIONS
  // ============================================================
  
  function stopAllAnimations() {
    if (window._sceneTimelines) {
      window._sceneTimelines.forEach(tl => {
        if (tl && tl.kill) tl.kill();
      });
    }
    window._sceneTimelines = [];
    
    if (window._breathTimeline) {
      window._breathTimeline.kill();
      window._breathTimeline = null;
    }
    
    // Kill tweens on specific elements
    const allPortalIds = [
      ...OUTER_PORTAL_FILL_IDS, ...OUTER_PORTAL_STROKE_IDS,
      ...INNER_PORTAL_FILL_IDS, ...INNER_PORTAL_STROKE_IDS,
      CENTER_PORTAL_FILL_ID, CENTER_PORTAL_STROKE_ID
    ];
    
    allPortalIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) gsap.killTweensOf(el);
    });
    
    document.querySelectorAll('[id^="F_"]').forEach(el => {
      gsap.killTweensOf(el);
      const shape = el.querySelector('polygon, polyline, circle, path, rect');
      if (shape) gsap.killTweensOf(shape);
    });
    
    window.activeScene = null;
    console.log("⏹️ All animations stopped");
  }

  // ============================================================
  // BREATH SOUND PLAYBACK (Triggers on inhale and exhale)
  // Only plays in meditation mode
  // ============================================================
  
  const BREATH_SOUND_VOLUME = 0.05;  // Adjust this value (0.0 to 1.0)
  
  function playBreathSound() {
    const breathSound = document.getElementById('breathSound');
    if (!breathSound) return;
    
    // Only play in meditation mode
    const inMeditation = window.AHSceneController?.getState()?.inMeditation;
    if (!inMeditation) return;
    
    // Check if audio is enabled via AHAudioState or fallback to meditation/background audio
    let audioEnabled = false;
    
    if (window.AHAudioState) {
      audioEnabled = window.AHAudioState.getState().isPlaying;
    } else {
      // Fallback: check if any main audio is playing
      const bgMusic = document.getElementById('bgMusic');
      const medMusic = document.getElementById('meditationMusic');
      audioEnabled = (bgMusic && !bgMusic.paused) || (medMusic && !medMusic.paused);
    }
    
    if (!audioEnabled) return;
    
    // Play once (not looped) - reset and play at reduced volume
    breathSound.currentTime = 0;
    breathSound.volume = BREATH_SOUND_VOLUME;
    breathSound.loop = false;
    breathSound.play().catch(e => console.warn('🌬️ Breath sound play failed:', e));
  }

  // ============================================================
  // BREATHING: CREATE SINGLE BREATH CYCLE
  // Simplified: visual animation + sound trigger only
  // ============================================================
  
  function createBreathCycle(preset, outerShapes, OUTER_BREATH, centerShapes, CENTER_BREATH, centerMode, repeatCount = -1) {
    const timing = BREATH_PRESETS[preset] || BREATH_PRESETS.coherent;
    const cycle = timing.inhale + timing.holdIn + timing.exhale + timing.holdOut;
    
    const breathTl = gsap.timeline({ repeat: repeatCount });
    let pos = 0;

    // Trigger breath sound at INHALE start
    breathTl.call(() => {
      console.log('🌬️ Inhale');
      playBreathSound();
    }, [], pos);

    // INHALE: Contract + Dim
    breathTl.to(outerShapes, {
      scale: OUTER_BREATH.scaleMin,
      opacity: OUTER_BREATH.opacityMin,
      duration: timing.inhale,
      ease: "sine.inOut"
    }, pos);
    
    if (centerShapes.length > 0 && CENTER_BREATH) {
      if (centerMode === "reversed") {
        breathTl.to(centerShapes, {
          scale: CENTER_BREATH.scaleMax,
          opacity: CENTER_BREATH.opacityMax,
          duration: timing.inhale,
          ease: "sine.inOut"
        }, pos);
      } else {
        breathTl.to(centerShapes, {
          scale: CENTER_BREATH.scaleMin,
          opacity: CENTER_BREATH.opacityMin,
          duration: timing.inhale,
          ease: "sine.inOut"
        }, pos);
      }
    }
    
    pos += timing.inhale;

    // HOLD-IN
    if (timing.holdIn > 0) {
      breathTl.to(outerShapes, {
        scale: OUTER_BREATH.scaleMin + OUTER_BREATH.holdScale,
        opacity: OUTER_BREATH.opacityMin + OUTER_BREATH.holdOpacity,
        duration: timing.holdIn / 2,
        ease: "sine.inOut"
      }, pos);
      breathTl.to(outerShapes, {
        scale: OUTER_BREATH.scaleMin,
        opacity: OUTER_BREATH.opacityMin,
        duration: timing.holdIn / 2,
        ease: "sine.inOut"
      }, pos + timing.holdIn / 2);
      
      if (centerShapes.length > 0 && CENTER_BREATH) {
        if (centerMode === "reversed") {
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMax - CENTER_BREATH.holdScale,
            opacity: CENTER_BREATH.opacityMax - CENTER_BREATH.holdOpacity,
            duration: timing.holdIn / 2,
            ease: "sine.inOut"
          }, pos);
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMax,
            opacity: CENTER_BREATH.opacityMax,
            duration: timing.holdIn / 2,
            ease: "sine.inOut"
          }, pos + timing.holdIn / 2);
        } else {
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMin + CENTER_BREATH.holdScale,
            opacity: CENTER_BREATH.opacityMin + CENTER_BREATH.holdOpacity,
            duration: timing.holdIn / 2,
            ease: "sine.inOut"
          }, pos);
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMin,
            opacity: CENTER_BREATH.opacityMin,
            duration: timing.holdIn / 2,
            ease: "sine.inOut"
          }, pos + timing.holdIn / 2);
        }
      }
      
      pos += timing.holdIn;
    }

    // Trigger breath sound at EXHALE start
    breathTl.call(() => {
      console.log('🌬️ Exhale');
      playBreathSound();
    }, [], pos);

    // EXHALE: Expand + Brighten
    breathTl.to(outerShapes, {
      scale: OUTER_BREATH.scaleMax,
      opacity: OUTER_BREATH.opacityMax,
      duration: timing.exhale,
      ease: "sine.inOut"
    }, pos);
    
    if (centerShapes.length > 0 && CENTER_BREATH) {
      if (centerMode === "reversed") {
        breathTl.to(centerShapes, {
          scale: CENTER_BREATH.scaleMin,
          opacity: CENTER_BREATH.opacityMin,
          duration: timing.exhale,
          ease: "sine.inOut"
        }, pos);
      } else {
        breathTl.to(centerShapes, {
          scale: CENTER_BREATH.scaleMax,
          opacity: CENTER_BREATH.opacityMax,
          duration: timing.exhale,
          ease: "sine.inOut"
        }, pos);
      }
    }
    
    pos += timing.exhale;

    // HOLD-OUT
    if (timing.holdOut > 0) {
      breathTl.to(outerShapes, {
        scale: OUTER_BREATH.scaleMax - OUTER_BREATH.holdScale,
        opacity: OUTER_BREATH.opacityMax - OUTER_BREATH.holdOpacity,
        duration: timing.holdOut / 2,
        ease: "sine.inOut"
      }, pos);
      breathTl.to(outerShapes, {
        scale: OUTER_BREATH.scaleMax,
        opacity: OUTER_BREATH.opacityMax,
        duration: timing.holdOut / 2,
        ease: "sine.inOut"
      }, pos + timing.holdOut / 2);
      
      if (centerShapes.length > 0 && CENTER_BREATH) {
        if (centerMode === "reversed") {
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMin + CENTER_BREATH.holdScale,
            opacity: CENTER_BREATH.opacityMin + CENTER_BREATH.holdOpacity,
            duration: timing.holdOut / 2,
            ease: "sine.inOut"
          }, pos);
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMin,
            opacity: CENTER_BREATH.opacityMin,
            duration: timing.holdOut / 2,
            ease: "sine.inOut"
          }, pos + timing.holdOut / 2);
        } else {
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMax - CENTER_BREATH.holdScale,
            opacity: CENTER_BREATH.opacityMax - CENTER_BREATH.holdOpacity,
            duration: timing.holdOut / 2,
            ease: "sine.inOut"
          }, pos);
          breathTl.to(centerShapes, {
            scale: CENTER_BREATH.scaleMax,
            opacity: CENTER_BREATH.opacityMax,
            duration: timing.holdOut / 2,
            ease: "sine.inOut"
          }, pos + timing.holdOut / 2);
        }
      }
    }

    return { timeline: breathTl, cycleDuration: cycle };
  }

  // ============================================================
  // BREATHING: PROGRESSIVE SEQUENCE
  // ============================================================
  
  function createBreathSequence(sequence, outerConfig = {}, centerConfig = null) {
    // Get outer portal elements
    const outerFills = getShapes(OUTER_PORTAL_FILL_IDS);
    const outerStrokes = getShapes(OUTER_PORTAL_STROKE_IDS);
    const outerShapes = [...outerFills, ...outerStrokes];
    
    if (outerFills.length === 0) {
      console.warn("⚠️ No outer portal fill elements found");
      return null;
    }

    // Outer breath settings
    const outerFill = outerConfig.fill || "#ed95df";
    const outerOpacityMax = outerConfig.opacity ?? BREATH_DEFAULTS.opacityMax;
    const outerOpacityMin = outerConfig.opacityMin ?? BREATH_DEFAULTS.opacityMin;
    
    const OUTER_BREATH = {
      scaleMin: outerConfig.scaleMin ?? BREATH_DEFAULTS.scaleMin,
      scaleMax: outerConfig.scaleMax ?? BREATH_DEFAULTS.scaleMax,
      opacityMin: outerOpacityMin,
      opacityMax: outerOpacityMax,
      holdScale: BREATH_DEFAULTS.holdScale,
      holdOpacity: BREATH_DEFAULTS.holdOpacity
    };

    // Set initial state for outer portals
    outerFills.forEach(shape => {
      gsap.set(shape, {
        fill: outerFill,
        scale: OUTER_BREATH.scaleMax,
        opacity: 0,
        transformOrigin: "center center"
      });
    });
    
    outerStrokes.forEach(shape => {
      gsap.set(shape, {
        scale: OUTER_BREATH.scaleMax,
        opacity: 0,
        transformOrigin: "center center"
      });
    });

    // Center portal setup
    let centerShapes = [];
    let centerMode = "static";
    let CENTER_BREATH = null;
    
    if (centerConfig && (centerConfig.mode === "synced" || centerConfig.mode === "reversed")) {
      try {
        centerMode = centerConfig.mode;
        
        const centerFill = centerConfig.fill || "#ffffff";
        const centerOpacityMax = centerConfig.opacity ?? 0.8;
        const centerOpacityMin = centerConfig.opacityMin ?? 0.2;
        
        CENTER_BREATH = {
          scaleMin: centerConfig.scaleMin ?? 0.88,
          scaleMax: centerConfig.scaleMax ?? 1.0,
          opacityMin: centerOpacityMin,
          opacityMax: centerOpacityMax,
          holdScale: BREATH_DEFAULTS.holdScale,
          holdOpacity: BREATH_DEFAULTS.holdOpacity
        };
        
        const centerFillEl = document.getElementById(CENTER_PORTAL_FILL_ID);
        const centerStrokeEl = document.getElementById(CENTER_PORTAL_STROKE_ID);
        
        console.log(`🎯 Center portal elements: fill=${!!centerFillEl}, stroke=${!!centerStrokeEl}`);
        
        if (centerFillEl) {
          centerShapes = [centerFillEl, centerStrokeEl].filter(Boolean);
          
          const isReversed = centerMode === "reversed";
          const targetScale = isReversed ? CENTER_BREATH.scaleMin : CENTER_BREATH.scaleMax;
          
          gsap.set(centerFillEl, {
            fill: centerFill,
            scale: targetScale,
            opacity: 0,
            transformOrigin: "center center"
          });
          
          if (centerStrokeEl) {
            gsap.set(centerStrokeEl, {
              scale: targetScale,
              opacity: 0,
              transformOrigin: "center center"
            });
          }
          
          console.log(`🎯 Center portal: ${centerMode} mode, ${centerShapes.length} shapes`);
        } else {
          console.warn("⚠️ Center portal fill element (P_C) not found, falling back to static");
          centerMode = "static";
          CENTER_BREATH = null;
        }
      } catch (e) {
        console.error("❌ Error setting up center portal:", e);
        centerMode = "static";
        CENTER_BREATH = null;
        centerShapes = [];
      }
    }

    // Build master timeline with sequence
    const masterTl = gsap.timeline();
    
    // Log the sequence
    console.log(`🌬️ Breath Sequence: ${sequence.length} stages`);
    sequence.forEach((stage, i) => {
      const timing = BREATH_PRESETS[stage.preset] || BREATH_PRESETS.coherent;
      const cycleDuration = timing.inhale + timing.holdIn + timing.exhale + timing.holdOut;
      const cycles = stage.cycles === -1 ? '∞' : stage.cycles;
      console.log(`   ${i + 1}. ${stage.preset}: ${cycles} cycles (${cycleDuration}s each)`);
    });

    // Intro fade-in
    masterTl.to(outerShapes, {
      opacity: OUTER_BREATH.opacityMax,
      duration: 1.5,
      ease: "sine.inOut"
    }, 0);
    
    if (centerShapes.length > 0 && CENTER_BREATH) {
      const centerTargetOpacity = centerMode === "reversed" 
        ? CENTER_BREATH.opacityMin 
        : CENTER_BREATH.opacityMax;
      
      masterTl.to(centerShapes, {
        opacity: centerTargetOpacity,
        duration: 1.5,
        ease: "sine.inOut"
      }, 0);
    }

    // Add each stage of the sequence
    let currentPos = 1.5; // Start after intro fade-in
    
    sequence.forEach((stage, index) => {
      const preset = stage.preset;
      const cycles = stage.cycles;
      
      // For the last stage with -1 cycles, repeat infinitely
      // For other stages, repeat (cycles - 1) times (since first play counts as 1)
      const repeatCount = cycles === -1 ? -1 : cycles - 1;
      
      const { timeline: breathTl, cycleDuration } = createBreathCycle(
        preset, 
        outerShapes, 
        OUTER_BREATH, 
        centerShapes, 
        CENTER_BREATH, 
        centerMode, 
        repeatCount
      );
      
      // Add label for this stage
      masterTl.addLabel(`stage_${index}`, currentPos);
      masterTl.add(breathTl, currentPos);
      
      // Calculate duration for this stage (if not infinite)
      if (cycles !== -1) {
        const stageDuration = cycleDuration * cycles;
        currentPos += stageDuration;
        console.log(`   Stage ${index + 1} duration: ${stageDuration}s`);
      }
    });

    console.log(`✅ Breath sequence timeline created`);
    return masterTl;
  }

  // ============================================================
  // BREATHING ANIMATION (Single preset)
  // ============================================================
  
  function createBreathingAnimation(preset, outerConfig = {}, centerConfig = null) {
    const timing = BREATH_PRESETS[preset] || BREATH_PRESETS.deepCalm;
    const cycle = timing.inhale + timing.holdIn + timing.exhale + timing.holdOut;
    
    // Outer portal settings
    const outerFill = outerConfig.fill || "#ed95df";
    const outerOpacityMax = outerConfig.opacity ?? BREATH_DEFAULTS.opacityMax;
    const outerOpacityMin = outerConfig.opacityMin ?? BREATH_DEFAULTS.opacityMin;
    
    const OUTER_BREATH = {
      scaleMin: outerConfig.scaleMin ?? BREATH_DEFAULTS.scaleMin,
      scaleMax: outerConfig.scaleMax ?? BREATH_DEFAULTS.scaleMax,
      opacityMin: outerOpacityMin,
      opacityMax: outerOpacityMax,
      holdScale: BREATH_DEFAULTS.holdScale,
      holdOpacity: BREATH_DEFAULTS.holdOpacity
    };

    // Get outer portal elements
    const outerFills = getShapes(OUTER_PORTAL_FILL_IDS);
    const outerStrokes = getShapes(OUTER_PORTAL_STROKE_IDS);
    const outerShapes = [...outerFills, ...outerStrokes];
    
    console.log(`🌬️ Breathing Animation: ${preset}`);
    console.log(`   Pattern: ${timing.inhale}s in → ${timing.holdIn}s hold → ${timing.exhale}s out → ${timing.holdOut}s hold`);
    console.log(`   Cycle: ${cycle}s`);
    console.log(`   Outer portals: ${outerFills.length} fills, ${outerStrokes.length} strokes`);

    if (outerFills.length === 0) {
      console.warn("⚠️ No outer portal fill elements found");
      return null;
    }

    // Set initial state for outer portals - start invisible
    outerFills.forEach(shape => {
      gsap.set(shape, {
        fill: outerFill,
        scale: OUTER_BREATH.scaleMax,
        opacity: 0,
        transformOrigin: "center center"
      });
    });
    
    outerStrokes.forEach(shape => {
      gsap.set(shape, {
        scale: OUTER_BREATH.scaleMax,
        opacity: 0,
        transformOrigin: "center center"
      });
    });

    // Center portal setup (if configured for breathing)
    let centerShapes = [];
    let centerMode = "static";
    let CENTER_BREATH = null;
    
    if (centerConfig && (centerConfig.mode === "synced" || centerConfig.mode === "reversed")) {
      centerMode = centerConfig.mode;
      
      const centerFill = centerConfig.fill || "#ffffff";
      const centerOpacityMax = centerConfig.opacity ?? 0.8;
      const centerOpacityMin = centerConfig.opacityMin ?? 0.2;
      
      CENTER_BREATH = {
        scaleMin: centerConfig.scaleMin ?? 0.88,
        scaleMax: centerConfig.scaleMax ?? 1.0,
        opacityMin: centerOpacityMin,
        opacityMax: centerOpacityMax,
        holdScale: BREATH_DEFAULTS.holdScale,
        holdOpacity: BREATH_DEFAULTS.holdOpacity
      };
      
      const centerFillEl = document.getElementById(CENTER_PORTAL_FILL_ID);
      const centerStrokeEl = document.getElementById(CENTER_PORTAL_STROKE_ID);
      
      if (centerFillEl) {
        centerShapes = [centerFillEl, centerStrokeEl].filter(Boolean);
        
        // Set initial state for center - start invisible for graceful fade-in
        const isReversed = centerMode === "reversed";
        const targetScale = isReversed ? CENTER_BREATH.scaleMin : CENTER_BREATH.scaleMax;
        const targetOpacity = isReversed ? CENTER_BREATH.opacityMin : CENTER_BREATH.opacityMax;
        
        gsap.set(centerFillEl, {
          fill: centerFill,
          scale: targetScale,
          opacity: 0,
          transformOrigin: "center center"
        });
        
        if (centerStrokeEl) {
          gsap.set(centerStrokeEl, {
            scale: targetScale,
            opacity: 0,
            transformOrigin: "center center"
          });
        }
        
        // Graceful fade-in for center portal
        gsap.to(centerShapes, {
          opacity: targetOpacity,
          duration: 1.5,
          ease: "sine.inOut"
        });
        
        console.log(`🎯 Center portal: ${centerMode} mode`);
      }
    } else if (centerConfig && centerConfig.mode === "static") {
      // Static center - just set fill/opacity, no animation
      const centerFillEl = document.getElementById(CENTER_PORTAL_FILL_ID);
      const centerStrokeEl = document.getElementById(CENTER_PORTAL_STROKE_ID);
      
      if (centerFillEl) {
        gsap.set(centerFillEl, {
          fill: centerConfig.fill || "transparent",
          opacity: centerConfig.opacity ?? 0
        });
      }
      if (centerStrokeEl) {
        gsap.set(centerStrokeEl, {
          opacity: (centerConfig.opacity ?? 0) > 0 ? 0.8 : 0
        });
      }
      console.log(`🎯 Center portal: static mode`);
    }

    // Create breathing animation with intro fade-in + repeating breath cycle
    const masterTl = gsap.timeline();
    
    // ============================================================
    // INTRO: Graceful fade-in (plays once)
    // ============================================================
    
    // Fade in outer portals
    masterTl.to(outerShapes, {
      opacity: OUTER_BREATH.opacityMax,
      duration: 1.5,
      ease: "sine.inOut"
    }, 0);
    
    // Fade in center portal (if breathing)
    if (centerShapes.length > 0 && CENTER_BREATH) {
      const centerTargetOpacity = centerMode === "reversed" 
        ? CENTER_BREATH.opacityMin 
        : CENTER_BREATH.opacityMax;
      
      masterTl.to(centerShapes, {
        opacity: centerTargetOpacity,
        duration: 1.5,
        ease: "sine.inOut"
      }, 0);
    }
    
    // ============================================================
    // BREATH CYCLE (repeats infinitely after intro)
    // ============================================================
    
    const { timeline: breathTl } = createBreathCycle(
      preset, 
      outerShapes, 
      OUTER_BREATH, 
      centerShapes, 
      CENTER_BREATH, 
      centerMode, 
      -1  // repeat infinitely
    );

    // Add the repeating breath cycle to master timeline after intro
    masterTl.add(breathTl, 1.5);

    console.log(`✅ Breathing timeline created (intro fade-in + repeating cycle)`);
    return masterTl;
  }

  // ============================================================
  // INNER PORTALS: FILL ANIMATION ONLY
  // ============================================================
  
  function animateInnerPortals(config = {}) {
    const fill = config.fill || "#77ffcc";
    const opacity = config.opacity ?? 1.0;
    const duration = config.duration ?? 2.0;
    const stagger = config.stagger ?? 0.15;
    const delay = config.delay ?? 0;
    const repeat = config.repeat ?? -1;
    const yoyo = config.yoyo ?? true;
    const ease = config.ease || "sine.inOut";
    
    const innerFills = getShapes(INNER_PORTAL_FILL_IDS);
    
    console.log(`✨ Inner Portals: ${innerFills.length} fills (fill animation only)`);
    
    if (innerFills.length === 0) {
      console.warn("⚠️ No inner portal elements found");
      return [];
    }
    
    innerFills.forEach(shape => {
      gsap.set(shape, { fill: "transparent", opacity: opacity });
    });
    
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

    if (shapes.length === 0) return [];

    shapes.forEach(shape => {
      gsap.set(shape, { fill: "transparent", opacity: 1 });
    });

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
    stopAllAnimations();
    window._sceneTimelines = [];
    
    const sceneName = config.name || "Custom Scene";
    const breathPreset = config.breathPreset || null;
    const breathSequence = config.breathSequence || null;
    const outerPortalsConfig = config.outerPortals || {};
    const innerPortalsConfig = config.innerPortals || null;
    const centerPortalConfig = config.centerPortal || null;
    const facetGroups = config.facetGroups || [];
    const breathDelay = config.breathDelay ?? 0;
    const autoStartBreathing = config.autoStartBreathing ?? true;

    console.log(`🎬 Scene Builder: ${sceneName}`);
    if (breathSequence) {
      console.log(`   Breath mode: progressive sequence (${breathSequence.length} stages)`);
    } else {
      console.log(`   Breath preset: ${breathPreset || 'coherent'}`);
    }
    console.log(`   Facet groups: ${facetGroups.length}`);

    // Animate facet groups
    const allTweens = [];
    facetGroups.forEach((group, index) => {
      const tweens = animateFacetGroup(group, index);
      allTweens.push(...tweens);
    });

    // Animate inner portals
    if (innerPortalsConfig) {
      const innerTweens = animateInnerPortals(innerPortalsConfig);
      allTweens.push(...innerTweens);
    }

    // Breathing (supports single preset OR progressive sequence)
    let breathTimeline = null;
    
    const startBreathing = () => {
      try {
        if (breathSequence && breathSequence.length > 0) {
          // Progressive breathing sequence
          breathTimeline = createBreathSequence(breathSequence, outerPortalsConfig, centerPortalConfig);
        } else {
          // Single preset (default to 'coherent' if not specified)
          const preset = breathPreset || 'coherent';
          breathTimeline = createBreathingAnimation(preset, outerPortalsConfig, centerPortalConfig);
        }
        
        if (breathTimeline) {
          window._breathTimeline = breathTimeline;
          window._sceneTimelines.push(breathTimeline);
        }
      } catch (e) {
        console.error("❌ Error starting breathing animation:", e);
      }
    };
    
    if (autoStartBreathing) {
      if (breathDelay > 0) {
        setTimeout(startBreathing, breathDelay * 1000);
      } else {
        startBreathing();
      }
    }

    console.log(`🎬 ${sceneName} running`);

    // Control API
    const controls = {
      name: sceneName,
      
      stop: () => {
        stopAllAnimations();
        console.log(`⏹️ ${sceneName} stopped`);
      },
      
      pause: () => {
        if (window._breathTimeline) window._breathTimeline.pause();
        allTweens.forEach(tween => { if (tween && tween.pause) tween.pause(); });
        console.log(`⏸️ ${sceneName} paused`);
      },
      
      resume: () => {
        if (window._breathTimeline) window._breathTimeline.resume();
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
        console.log(`🌬️ Breathing stopped`);
      },
      
      stopFacets: () => {
        allTweens.forEach(tween => { if (tween && tween.kill) tween.kill(); });
        console.log(`✨ Facets stopped`);
      },
      
      setBreathPreset: (newPreset) => {
        if (window._breathTimeline) window._breathTimeline.kill();
        breathTimeline = createBreathingAnimation(newPreset, outerPortalsConfig, centerPortalConfig);
        if (breathTimeline) window._breathTimeline = breathTimeline;
        console.log(`🌬️ Breath preset changed to: ${newPreset}`);
      },
      
      getState: () => ({
        name: sceneName,
        breathPreset: breathPreset,
        facetGroupCount: facetGroups.length,
        isBreathing: !!window._breathTimeline,
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
    createBreathSequence,
    createBreathCycle,
    animateInnerPortals,
    getShape,
    getShapes,
    readSceneConfig,
    BREATH_PRESETS,
    BREATH_DEFAULTS,
    OUTER_PORTAL_FILL_IDS,
    INNER_PORTAL_FILL_IDS,
    CENTER_PORTAL_FILL_ID
  };

  console.log("🎬 Scene Builder v1.4.2 loaded");
  console.log("   Breath audio: Plays on inhale/exhale (meditation mode only)");
  console.log("   Supports: breathPreset (single) or breathSequence (progressive)");
  console.log("═══════════════════════════════════════════════════════");

})();
