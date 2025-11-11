/*--------------------------------------------------------------
  Awakening Heart : Oracle Scene Controller
  Version: 1.0.0 | Date: 2025-11-10
  
  Handles CMS-delivered oracle scenes with:
  - Persistent audio state from localStorage
  - Scene-specific audio loading
  - Wisdom content reveal sequence
  - Metatron animations from scene config
  - Shader integration
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔮 Oracle Scene Controller initialized (v1.0.0)");

  // ------- Core DOM Elements -------
  const shader = document.getElementById("shader");
  const metatronNav = document.getElementById("metatron"); // Navigation metatron (static)
  const metatronScene = document.getElementById("metatronScene"); // Scene metatron (animated)
  const tripleGoddess = document.getElementById("triple-goddess"); // Navigation plinth
  const uiCluster = document.getElementById("ui-cluster");
  const audioToggle = document.getElementById("audioToggle");
  const icon = audioToggle?.querySelector('svg') || audioToggle?.querySelector('.icon-On');
  
  // Audio elements - background and SFX
  const bgMusic = document.getElementById("bgMusic");
  const voiceover = document.getElementById("voiceover");
  
  // Get scene-specific audio URL from data attribute
  const sceneAudioUrl = bgMusic?.getAttribute('data-scene-audio') || bgMusic?.src;
  
  // Wisdom content elements - 5 sections
  const ahTitle = document.getElementById("ah-title");
  const introText = document.getElementById("intro-text");
  const quoteText = document.getElementById("quote-text");
  const shareText = document.getElementById("share-text");
  const practiceText = document.getElementById("practice-text");
  const distinctionText = document.getElementById("distinction-text");

  console.log("🧩 Scene elements:", { 
    shader, metatronNav, metatronScene, tripleGoddess, uiCluster, bgMusic, voiceover,
    sceneAudioUrl, ahTitle, introText, quoteText, shareText, practiceText, distinctionText
  });

  // ------- Initial States -------
  // Hide all wisdom content initially
  const wisdomElements = [introText, quoteText, shareText, practiceText, distinctionText].filter(Boolean);
  gsap.set(wisdomElements, { autoAlpha: 0, y: 20 });
  
  // Set shader and UI cluster initial states
  gsap.set(shader, { autoAlpha: 0 });
  gsap.set(uiCluster, { autoAlpha: 1, pointerEvents: "auto" });
  
  // Metatron setup - scene metatron for content animations
  if (metatronScene) {
    gsap.set(metatronScene, { transformOrigin: "50% 50%", force3D: true });
  }
  
  // Navigation metatron stays static during scene playback
  if (metatronNav) {
    gsap.set(metatronNav, { transformOrigin: "50% 50%", force3D: true });
  }

  // ------- Restore Audio State -------
  // Use the persistent audio state manager to restore user preference
  if (bgMusic && window.AHAudioState) {
    console.log("🎵 Restoring audio state for scene...");
    
    try {
      // Initialize audio with scene-specific file and user's preference
      const wasPlaying = await window.AHAudioState.initAudio(
        bgMusic, 
        icon, 
        sceneAudioUrl
      );
      
      console.log(wasPlaying ? "▶️ Scene audio auto-started" : "⏸️ Scene audio paused per user preference");
    } catch (e) {
      console.warn("Could not initialize scene audio:", e);
    }
  }

  // ------- Shader Reveal -------
  const revealShader = () => {
    if (window.AHShader?.reveal) {
      window.AHShader.reveal({ beams: true });
    } else {
      gsap.to(shader, { autoAlpha: 1, duration: 1.2, ease: "sine.inOut" });
    }
  };

  // Start shader immediately for oracle scenes
  setTimeout(revealShader, 300);

  // ------- Wisdom Content Sequence -------
  const revealWisdom = () => {
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onStart: () => console.log("📖 Revealing wisdom content")
    });

    // Fade in title first
    if (ahTitle) {
      tl.to(ahTitle, { autoAlpha: 1, duration: 0.8 });
    }

    // Reveal wisdom elements in sequence with breathing pauses
    // Order: intro → quote → share → practice → distinction
    wisdomElements.forEach((el, index) => {
      if (!el) return;
      
      // Each element fades in and slides up slightly
      tl.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: 1.0,
        ease: "power2.out"
      }, `>+${index === 0 ? 0.5 : 1.5}`); // First element after 0.5s, others after 1.5s
    });

    return tl;
  };

  // Start wisdom reveal after brief delay
  setTimeout(revealWisdom, 800);

  // ------- Metatron Animations -------
  // Start animations based on scene config
  // NOTE: Scene Metatron uses S_ prefixed IDs (S_P_C, S_P_IT, etc.)
  // CMS JSON configs must use these S_ prefixed IDs
  if (window.metatron && window.AHCONFIG) {
    const timing = window.AHCONFIG.timing || {};
    
    setTimeout(() => {
      if (window.metatron.startFacets) {
        window.metatron.startFacets(window.AHCONFIG.facets);
      }
    }, (timing.facetsDelay || 0) * 1000);
    
    setTimeout(() => {
      if (window.metatron.startPortals) {
        window.metatron.startPortals(window.AHCONFIG.portals);
      }
    }, (timing.portalsDelay || 2) * 1000);
  }

  // ------- Audio Toggle Control -------
  audioToggle?.addEventListener("click", async () => {
    if (!bgMusic) return;
    
    // Use persistent state manager for toggle
    if (window.AHAudioState) {
      await window.AHAudioState.toggle(bgMusic, icon);
    } else {
      // Fallback toggle
      console.warn("AHAudioState not found, using local toggle");
      const isPlaying = !bgMusic.paused;
      
      if (isPlaying) {
        gsap.to(bgMusic, { volume: 0, duration: 0.3, onComplete: () => bgMusic.pause() });
        if (icon) gsap.to(icon, { opacity: 0.4, duration: 0.3 });
      } else {
        try {
          if (bgMusic.paused) await bgMusic.play();
          gsap.to(bgMusic, { volume: 0.35, duration: 0.3 });
          if (icon) gsap.to(icon, { opacity: 1, duration: 0.3 });
        } catch (e) {
          console.warn("Audio play failed:", e);
        }
      }
    }
  });

  // ------- Voiceover Control (if present) -------
  if (voiceover) {
    // Voiceover plays independently of background music
    // Can be triggered by UI or automatically
    voiceover.volume = 0.6;
    
    // Example: Auto-play voiceover after intro reveal
    setTimeout(() => {
      if (window.AHAudioState?.getState().isPlaying) {
        voiceover.play().catch(e => console.warn("Voiceover autoplay blocked:", e));
      }
    }, 3000);
  }

  console.log("✨ Oracle scene ready");
});
