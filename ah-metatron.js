/*--------------------------------------------------------------
  Awakening Heart : Metatron Engine Core v2.0
  Handles facet + portal animations with Pattern Library support
  Version: 2.0 | Date: 2025-11-15
  
  New in v2.0:
  - Integration with AHPatterns animation library
  - Support for pattern-based configs
  - Backward compatible with legacy group-based configs
  - Triple Goddess animation support
--------------------------------------------------------------*/

const deepMerge = (a, b) => {
  if (!b) return a;
  const o = { ...a };
  for (const k in b) {
    o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]))
      ? deepMerge(a[k] || {}, b[k])
      : b[k];
  }
  return o;
};

// Legacy defaults for backward compatibility
const DEFAULTS = {
  timing: { facetsDelay: 0, portalsDelay: 4 },
  facets: { 
    groups: {}, 
    sequence: [], 
    styles: {}, 
    delayBetweenGroups: 0.4,
    // New pattern-based fields
    pattern: null,
    ids: [],
    options: {}
  },
  portals: { 
    groups: {}, 
    sequence: [], 
    styles: {}, 
    delayBetweenGroups: 0.3,
    // New pattern-based fields
    pattern: null,
    ids: [],
    options: {}
  },
  goddess: {
    pattern: null,
    ids: [],
    options: {}
  }
};

/**
 * Read scene configuration from JSON script tag
 */
function readSceneConfig() {
  const el = document.getElementById('scene-config');
  if (!el) return DEFAULTS;
  
  try {
    const config = JSON.parse(el.textContent.trim());
    return deepMerge(DEFAULTS, config);
  } catch (e) {
    console.warn('Bad scene JSON', e);
    return DEFAULTS;
  }
}

// Make config globally available
window.AHCONFIG = readSceneConfig();

/**
 * Metatron Animation Engine
 */
window.metatron = {
  
  /**
   * Start facet animations
   * Supports both legacy group-based and new pattern-based configs
   */
  startFacets(cfg = window.AHCONFIG.facets) {
    this.stopFacets();
    
    // Check if using new pattern-based config
    if (cfg.pattern && window.AHPatterns) {
      console.log(`🎨 Starting facets with pattern: ${cfg.pattern}`);
      
      const target = cfg.ids || this._flattenGroups(cfg.groups, cfg.sequence);
      
      window.AHPatterns.playPattern(
        cfg.pattern,
        target,
        cfg.options || {}
      );
      
      return;
    }
    
    // Legacy group-based animation (backward compatible)
    console.log('🔄 Using legacy facet animation');
    let total = 0;
    
    (cfg.sequence || []).forEach(g => {
      const ids = cfg.groups[g] || [];
      const style = cfg.styles[g] || {};
      
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const shape = el.tagName === 'g' 
          ? el.querySelector('polygon, polyline') 
          : el;
        if (!shape) return;
        
        gsap.to(shape, {
          fill: style.fill || "#bb9adc",
          duration: style.duration || 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: total + i * 0.1
        });
      });
      
      total += cfg.delayBetweenGroups || 0;
    });
  },

  /**
   * Start portal animations
   * Supports both legacy group-based and new pattern-based configs
   */
  startPortals(cfg = window.AHCONFIG.portals) {
    this.stopPortals();
    
    // Check if using new pattern-based config
    if (cfg.pattern && window.AHPatterns) {
      console.log(`🎨 Starting portals with pattern: ${cfg.pattern}`);
      
      const target = cfg.ids || cfg.groups;
      
      window.AHPatterns.playPattern(
        cfg.pattern,
        target,
        cfg.options || {}
      );
      
      return;
    }
    
    // Legacy group-based animation (backward compatible)
    console.log('🔄 Using legacy portal animation');
    let total = 0;
    
    (cfg.sequence || []).forEach(g => {
      const ids = cfg.groups[g] || [];
      const style = cfg.styles[g] || {};
      
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        
        gsap.to(el, {
          fill: style.fill || "#ed95df",
          duration: style.duration || 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: total + i * 0.1
        });
      });
      
      total += cfg.delayBetweenGroups || 0;
    });
  },

  /**
   * Start Triple Goddess animations
   * NEW in v2.0
   */
  startGoddess(cfg = window.AHCONFIG.goddess) {
    if (!cfg || !cfg.pattern) {
      console.log('⏭️ No goddess animation configured');
      return;
    }
    
    if (!window.AHPatterns) {
      console.warn('⚠️ AHPatterns library not loaded');
      return;
    }
    
    console.log(`🌙 Starting goddess with pattern: ${cfg.pattern}`);
    
    // Default goddess element IDs if not specified
    const goddessIds = cfg.ids || [
      'crescent-left', 
      'crescent-right', 
      'crescent-top',
      'full-circle',
      'bindu'
    ];
    
    window.AHPatterns.playPattern(
      cfg.pattern,
      goddessIds,
      cfg.options || {}
    );
  },

  /**
   * Stop facet animations
   */
  stopFacets() {
    gsap.killTweensOf("polygon, polyline");
  },

  /**
   * Stop portal animations
   */
  stopPortals() {
    gsap.killTweensOf("path, circle, polygon");
  },

  /**
   * Stop goddess animations
   */
  stopGoddess() {
    const goddessElements = [
      '#crescent-left', 
      '#crescent-right', 
      '#crescent-top',
      '#full-circle',
      '#bindu'
    ];
    gsap.killTweensOf(goddessElements.join(','));
  },

  /**
   * Stop all animations
   */
  stopAll() {
    this.stopFacets();
    this.stopPortals();
    this.stopGoddess();
  },

  /**
   * Helper: Flatten groups into a single ID array
   * Used when converting legacy group configs to pattern format
   */
  _flattenGroups(groups, sequence) {
    if (!groups || !sequence) return [];
    
    const ids = [];
    sequence.forEach(groupName => {
      const groupIds = groups[groupName] || [];
      ids.push(...groupIds);
    });
    
    return ids;
  }
};

/**
 * Auto-start animations when DOM is ready
 */
window.addEventListener('DOMContentLoaded', () => {
  const t = window.AHCONFIG.timing || {};
  
  console.log('🎭 Metatron Engine v2.0 initialized', {
    config: window.AHCONFIG,
    patternsAvailable: !!window.AHPatterns
  });
  
  // Start facets
  setTimeout(() => {
    window.metatron.startFacets();
  }, (t.facetsDelay || 0) * 1000);
  
  // Start portals
  setTimeout(() => {
    window.metatron.startPortals();
  }, (t.portalsDelay || 0) * 1000);
  
  // Start goddess (if configured)
  if (window.AHCONFIG.goddess && window.AHCONFIG.goddess.pattern) {
    setTimeout(() => {
      window.metatron.startGoddess();
    }, (t.goddessDelay || 5) * 1000);
  }
});
