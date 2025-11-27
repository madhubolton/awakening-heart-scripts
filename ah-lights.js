/*--------------------------------------------------------------
  Awakening Heart : Stairway Light Controller
  Version: 2.0 | Date: 2025-11-27
  
  ENTRY SEQUENCE MODE:
  - Steps progressively light up as user navigates prompts
  - 3 steps correspond to 3 navigation points (prompts 1-3)
  - Forward navigation: lights up steps
  - Backward navigation: dims steps back to neutral
  
  ORACLE SCENE MODE:
  - Disabled/inactive (gentle ambient pulse only)
--------------------------------------------------------------*/

window.AHLights = (() => {
  
  // Step element IDs
  const STEPS = {
    floor: 'floor-shape',
    riser1: 'riser1-shape',
    step1: 'step1-shape',
    riser2: 'riser2-shape',
    step2: 'step2-shape',
    plinthFace: 'plinth-face-shape',
    plinthTop: 'plinth-top-shape'
  };
  
  // Color states
  const COLORS = {
    neutral: {
      floor: '#5a5468',
      riser1: '#4a4458',
      step1: '#6a5f7a',
      riser2: '#5a4f6a',
      step2: '#7a6f8a',
      plinthFace: '#6a5f7a',
      plinthTop: '#8a7f9a'
    },
    lit: {
      floor: '#726b84',
      riser1: '#625c72',
      step1: '#9c90b0',
      riser2: '#827696',
      step2: '#c8c0de',
      plinthFace: '#a297b8',
      plinthTop: '#f0e9fb'
    }
  };
  
  // Step groups for progressive lighting (4 prompts = 4 steps)
  const STEP_GROUPS = [
    ['floor', 'riser1'],                     // Step 1 (prompt 1) - bottom riser
    ['step1', 'riser2'],                     // Step 2 (prompt 2) - second step/riser
    ['step2', 'plinthFace'],                 // Step 3 (prompt 3) - third step/riser
    ['plinthTop']                            // Step 4 (prompt 4) - plinth top
  ];
  
  let currentStepIndex = -1; // -1 = all neutral (prompt0 visible)
  let entryMode = false;
  let ambientTimeline = null;
  
  /**
   * Initialize stairway lights
   */
  const init = (isEntrySequence = false) => {
    entryMode = isEntrySequence;
    
    if (entryMode) {
      console.log('✨ Stairway lights: ENTRY MODE (interactive)');
      setAllNeutral();
    } else {
      console.log('✨ Stairway lights: ORACLE MODE (ambient only)');
      startAmbientPulse();
    }
  };
  
  /**
   * Set all steps to neutral color
   */
  const setAllNeutral = () => {
    console.log('🌑 Stairway: Setting all steps to neutral');
    
    Object.keys(STEPS).forEach(key => {
      const el = document.getElementById(STEPS[key]);
      if (el) {
        gsap.to(el, {
          fill: COLORS.neutral[key],
          duration: 0.8,
          ease: 'sine.inOut'
        });
      }
    });
    
    currentStepIndex = -1;
  };
  
  /**
   * Light up steps up to target index
   */
  const lightUpToStep = (targetIndex) => {
    if (!entryMode) return;
    if (targetIndex === currentStepIndex) return;
    if (targetIndex < -1 || targetIndex >= STEP_GROUPS.length) return;
    
    console.log(`🌟 Stairway: Lighting steps 0 → ${targetIndex}`);
    
    // Animate steps
    STEP_GROUPS.forEach((group, stepIdx) => {
      const shouldBeLit = stepIdx <= targetIndex;
      
      group.forEach(key => {
        const el = document.getElementById(STEPS[key]);
        if (el) {
          gsap.to(el, {
            fill: shouldBeLit ? COLORS.lit[key] : COLORS.neutral[key],
            duration: 0.6,
            ease: 'sine.inOut',
            delay: shouldBeLit ? stepIdx * 0.1 : 0
          });
        }
      });
    });
    
    currentStepIndex = targetIndex;
    console.log(`✅ Stairway: Current step index = ${currentStepIndex}`);
  };
  
  /**
   * Navigate to specific step (called by entry sequence)
   * Maps prompt index to step lighting:
   * - promptIndex 0 (Welcome): no steps lit
   * - promptIndex 1: step 0 lit
   * - promptIndex 2: steps 0-1 lit
   * - promptIndex 3: steps 0-2 lit (all lit)
   */
  /**
   * Navigate to specific step (called by entry sequence)
   * Maps prompt index to step lighting:
   * - promptIndex 0 (Welcome): no steps lit (all grey)
   * - promptIndex 1: step 0 lit (bottom step/riser violet)
   * - promptIndex 2: steps 0-1 lit (second step/riser violet)
   * - promptIndex 3: steps 0-2 lit (third step/riser violet)
   * - promptIndex 4: steps 0-3 lit (plinth top violet - all lit)
   */
  const navigateToPrompt = (promptIndex) => {
    if (!entryMode) return;
    
    console.log(`🚶 Stairway: Navigating to prompt ${promptIndex}`);
    
    // Map prompt index to step index
    // prompt 0 = -1 (no steps)
    // prompt 1 = 0 (first step)
    // prompt 2 = 1 (second step)
    // prompt 3 = 2 (third step - all lit)
    const stepIndex = promptIndex - 1;
    
    lightUpToStep(stepIndex);
  };
  
  /**
   * Start gentle ambient pulse (oracle mode)
   */
  const startAmbientPulse = () => {
    if (ambientTimeline) ambientTimeline.kill();
    
    console.log('🌊 Stairway: Starting ambient pulse');
    
    ambientTimeline = gsap.timeline({
      repeat: -1,
      yoyo: true,
      defaults: { ease: 'sine.inOut', duration: 2.5 }
    });
    
    ambientTimeline
      .to(`#${STEPS.floor}`, { fill: '#726b84' }, 0)
      .to(`#${STEPS.riser1}`, { fill: '#625c72' }, 0.25)
      .to(`#${STEPS.step1}`, { fill: '#9c90b0' }, 0.5)
      .to(`#${STEPS.riser2}`, { fill: '#827696' }, 0.75)
      .to(`#${STEPS.step2}`, { fill: '#c8c0de' }, 1.0)
      .to(`#${STEPS.plinthFace}`, { fill: '#a297b8' }, 1.25)
      .to(`#${STEPS.plinthTop}`, { fill: '#f0e9fb' }, 1.5);
  };
  
  /**
   * Stop all animations
   */
  const stop = () => {
    if (ambientTimeline) {
      ambientTimeline.kill();
      ambientTimeline = null;
    }
    
    Object.values(STEPS).forEach(id => {
      const el = document.getElementById(id);
      if (el) gsap.killTweensOf(el);
    });
    
    console.log('🛑 Stairway lights stopped');
  };
  
  /**
   * Get current state
   */
  const getState = () => ({
    entryMode,
    currentStepIndex,
    maxSteps: STEP_GROUPS.length
  });
  
  // Public API
  return {
    init,
    navigateToPrompt,
    lightUpToStep,
    setAllNeutral,
    stop,
    getState
  };
})();

// Auto-detect mode on load
document.addEventListener('DOMContentLoaded', () => {
  // Entry sequence has temple container
  const isEntrySequence = document.getElementById('temple-container') !== null;
  
  if (window.AHLights) {
    window.AHLights.init(isEntrySequence);
  }
});

console.log('✨ Stairway Light Controller loaded (v2.0)');
