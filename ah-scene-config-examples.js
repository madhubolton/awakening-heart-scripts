/*--------------------------------------------------------------
  Awakening Heart : Scene Configuration Examples
  Shows how to use the Animation Patterns Library
  
  These configs can be embedded in <script id="scene-config"> tags
  or loaded dynamically for CMS-driven scenes.
--------------------------------------------------------------*/

// ============================================================
// EXAMPLE 1: Opening Scene (Portal Sweep with Sequential)
// ============================================================
const openingSceneConfig = {
  "name": "Oracle Opening",
  "timing": { 
    "facetsDelay": 99,  // Facets controlled by enter sequence
    "portalsDelay": 0 
  },
  
  "facets": {
    "pattern": "sequential",  // Uses AHPatterns.sequential()
    "ids": [
      "F_O_TRI1_T", "F_O_TRI2_T",
      "F_I_BG_TR", "F_I_OCT_TR", "F_I_TRI1_TR", "F_I_TRI2_TR",
      "F_I_OCT_R", "F_I_BG_R",
      "F_O_TRI1_BR", "F_O_TRI2_BR",
      "F_I_BG_BR", "F_I_OCT_BR",
      "F_I_TRI1_B", "F_I_TRI2_B",
      "F_I_OCT_BL", "F_I_BG_BL",
      "F_O_TRI1_BL", "F_O_TRI2_BL",
      "F_I_BG_L", "F_I_OCT_L",
      "F_I_TRI1_TL", "F_I_TRI2_TL",
      "F_I_OCT_TL", "F_I_BG_TL"
    ],
    "options": {
      "fill": "#77ffcc",
      "duration": 0.6,
      "stagger": 0.025,
      "repeat": 0,
      "yoyo": false
    }
  },
  
  "portals": {
    "pattern": "radialBurst",  // Uses AHPatterns.radialBurst()
    "groups": {
      "center": ["P_C"],
      "inner": [
        "P_IT", "P_IRT", "P_IRB", "P_IB", "P_ILB", "P_ILT"
      ],
      "outer": [
        "P_OT", "P_ORT", "P_ORB", "P_OB", "P_OLB", "P_OLT"
      ]
    },
    "options": {
      "fill": "#ed95df",
      "duration": 1.3,
      "stagger": 0.1,
      "groupDelay": 0.25,
      "repeat": -1,
      "yoyo": true
    }
  },
  
  "goddess": {
    "pattern": "breathing",  // Uses AHPatterns.breathing()
    "ids": ["crescent-left", "crescent-right", "crescent-top"],
    "options": {
      "opacityFrom": 0.7,
      "opacityTo": 1.0,
      "duration": 2.5,
      "stagger": 0.3
    }
  }
};

// ============================================================
// EXAMPLE 2: Healing Realm Scene (Gentle Pulse)
// ============================================================
const healingSceneConfig = {
  "name": "Healing Oracle",
  "timing": { 
    "facetsDelay": 2,
    "portalsDelay": 3 
  },
  
  "facets": {
    "pattern": "pulseAll",  // All facets pulse together
    "ids": [
      "S_F_O_TRI1_T", "S_F_O_TRI2_T",  // Note: Scene Metatron uses S_ prefix
      "S_F_I_BG_TR", "S_F_I_OCT_TR",
      // ... rest of scene facet IDs
    ],
    "options": {
      "fill": "#a8e6cf",  // Soft healing green
      "duration": 2.0,
      "repeat": -1,
      "yoyo": true,
      "ease": "sine.inOut"
    }
  },
  
  "portals": {
    "pattern": "wave",
    "ids": [
      "S_P_C",
      "S_P_IT", "S_P_IRT", "S_P_IRB", "S_P_IB", "S_P_ILB", "S_P_ILT",
      "S_P_OT", "S_P_ORT", "S_P_ORB", "S_P_OB", "S_P_OLB", "S_P_OLT"
    ],
    "options": {
      "fill": "#dcedc8",
      "duration": 1.8,
      "stagger": 0.15,
      "repeat": -1,
      "yoyo": true
    }
  },
  
  "goddess": {
    "pattern": "goddessPhases",  // Moon phase cycling
    "options": {
      "duration": 3.0,
      "stagger": 1.0
    }
  }
};

// ============================================================
// EXAMPLE 3: Surrender Realm Scene (Spiral Inward)
// ============================================================
const surrenderSceneConfig = {
  "name": "Surrender Oracle",
  "timing": { 
    "facetsDelay": 1,
    "portalsDelay": 2.5 
  },
  
  "facets": {
    "pattern": "spiral",
    "ids": [
      // Ordered from outer to inner for inward spiral
      "S_F_O_TRI1_T", "S_F_O_TRI2_T",
      "S_F_O_TRI1_BR", "S_F_O_TRI2_BR",
      "S_F_O_TRI1_BL", "S_F_O_TRI2_BL",
      "S_F_I_BG_TR", "S_F_I_OCT_TR",
      "S_F_I_BG_R", "S_F_I_OCT_R",
      "S_F_I_BG_BR", "S_F_I_OCT_BR",
      "S_F_I_BG_L", "S_F_I_OCT_L",
      "S_F_I_BG_TL", "S_F_I_OCT_TL",
      "S_F_I_TRI1_TR", "S_F_I_TRI2_TR",
      "S_F_I_TRI1_B", "S_F_I_TRI2_B",
      "S_F_I_TRI1_TL", "S_F_I_TRI2_TL"
    ],
    "options": {
      "fill": "#c5a3ff",  // Soft purple
      "duration": 1.5,
      "stagger": 0.08,
      "inward": true,
      "repeat": -1,
      "yoyo": true
    }
  },
  
  "portals": {
    "pattern": "radialBurst",
    "groups": {
      "center": ["S_P_C"],
      "inner": [
        "S_P_IT", "S_P_IRT", "S_P_IRB", 
        "S_P_IB", "S_P_ILB", "S_P_ILT"
      ],
      "outer": [
        "S_P_OT", "S_P_ORT", "S_P_ORB", 
        "S_P_OB", "S_P_OLB", "S_P_OLT"
      ]
    },
    "options": {
      "fill": "#b39ddb",
      "duration": 1.6,
      "stagger": 0.12,
      "groupDelay": 0.3,
      "repeat": -1,
      "yoyo": true
    }
  }
};

// ============================================================
// EXAMPLE 4: Presence Realm Scene (Random Sparkle)
// ============================================================
const presenceSceneConfig = {
  "name": "Presence Oracle",
  "timing": { 
    "facetsDelay": 0.5,
    "portalsDelay": 2 
  },
  
  "facets": {
    "pattern": "randomSparkle",
    "ids": [
      // Mix of all facets - will be randomized
      "S_F_O_TRI1_T", "S_F_I_BG_TR", "S_F_I_TRI1_TR",
      "S_F_O_TRI2_T", "S_F_I_OCT_TR", "S_F_I_TRI2_TR",
      "S_F_I_OCT_R", "S_F_I_BG_R",
      "S_F_O_TRI1_BR", "S_F_O_TRI2_BR",
      "S_F_I_BG_BR", "S_F_I_OCT_BR",
      "S_F_I_TRI1_B", "S_F_I_TRI2_B",
      "S_F_I_OCT_BL", "S_F_I_BG_BL",
      "S_F_O_TRI1_BL", "S_F_O_TRI2_BL",
      "S_F_I_BG_L", "S_F_I_OCT_L",
      "S_F_I_TRI1_TL", "S_F_I_TRI2_TL",
      "S_F_I_OCT_TL", "S_F_I_BG_TL"
    ],
    "options": {
      "fill": "#fff9c4",  // Soft golden presence
      "duration": 1.2,
      "stagger": 0.05,
      "repeat": -1,
      "yoyo": true
    }
  },
  
  "portals": {
    "pattern": "binary",  // Alternating pattern
    "ids": [
      "S_P_C",
      "S_P_IT", "S_P_IRT", "S_P_IRB", 
      "S_P_IB", "S_P_ILB", "S_P_ILT",
      "S_P_OT", "S_P_ORT", "S_P_ORB", 
      "S_P_OB", "S_P_OLB", "S_P_OLT"
    ],
    "options": {
      "fillA": "#ffe082",
      "fillB": "#ffecb3",
      "duration": 1.4,
      "stagger": 0.1,
      "repeat": -1,
      "yoyo": true
    }
  }
};

// ============================================================
// HOW TO USE THESE CONFIGS
// ============================================================

/*
In your HTML, embed as JSON:

<script id="scene-config" type="application/json">
{
  "name": "Surrender Oracle",
  "timing": { "facetsDelay": 1, "portalsDelay": 2.5 },
  "facets": {
    "pattern": "spiral",
    "ids": ["S_F_O_TRI1_T", "S_F_O_TRI2_T", ...],
    "options": {
      "fill": "#c5a3ff",
      "duration": 1.5,
      "stagger": 0.08,
      "inward": true,
      "repeat": -1,
      "yoyo": true
    }
  },
  ...
}
</script>

Then in your script that reads the config:

const config = JSON.parse(document.getElementById('scene-config').textContent);

// Play facet pattern
if (config.facets && config.facets.pattern && window.AHPatterns) {
  window.AHPatterns.playPattern(
    config.facets.pattern,
    config.facets.ids || config.facets.groups,
    config.facets.options
  );
}

// Play portal pattern
if (config.portals && config.portals.pattern && window.AHPatterns) {
  window.AHPatterns.playPattern(
    config.portals.pattern,
    config.portals.ids || config.portals.groups,
    config.portals.options
  );
}

// Play goddess pattern
if (config.goddess && config.goddess.pattern && window.AHPatterns) {
  window.AHPatterns.playPattern(
    config.goddess.pattern,
    config.goddess.ids,
    config.goddess.options
  );
}
*/

// Export for reference
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    openingSceneConfig,
    healingSceneConfig,
    surrenderSceneConfig,
    presenceSceneConfig
  };
}
