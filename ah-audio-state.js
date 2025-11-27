/*--------------------------------------------------------------
  Awakening Heart : Audio State Manager (Session Only)
  Version: 3.0 | Date: 2025-11-27
  
  Simplified audio management - no localStorage persistence.
  Audio starts OFF by default. User enables manually.
  State only persists within current page session.
--------------------------------------------------------------*/

window.AHAudioState = (() => {
  const VOLUME_LEVEL = 0.35;
  
  // Session-only state (resets on page load)
  let sessionState = {
    isPlaying: false,
    volume: VOLUME_LEVEL
  };
  
  console.log('🎵 Audio State Manager initialized (session-only, no persistence)');
  
  // Get current session state
  const getState = () => {
    return { ...sessionState };
  };
  
  // Update session state
  const setState = (isPlaying, volume = VOLUME_LEVEL) => {
    sessionState = { 
      isPlaying, 
      volume,
      timestamp: Date.now()
    };
    console.log('🎵 Audio state updated:', sessionState);
  };
  
  // Clear state (for cleanup)
  const clearState = () => {
    sessionState = { isPlaying: false, volume: VOLUME_LEVEL };
    console.log('🎵 Audio state cleared');
  };
  
  // Initialize audio element - always starts paused
  const initAudio = async (audioElement, iconElement, sceneAudioUrl = null) => {
    if (!audioElement) {
      console.warn('⚠️ No audio element provided to initAudio');
      return false;
    }
    
    console.log('🎵 Initializing audio (starts OFF by default)');
    
    // If scene provides a specific audio URL, load it
    if (sceneAudioUrl) {
      console.log('🎼 Loading scene audio:', sceneAudioUrl);
      audioElement.src = sceneAudioUrl;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Set to paused state
    audioElement.pause();
    audioElement.volume = 0;
    audioElement.currentTime = 0;
    
    // Set icon to OFF state
    if (iconElement) {
      gsap.set(iconElement, { opacity: 0.4 });
    }
    
    setState(false, VOLUME_LEVEL);
    console.log('✅ Audio initialized (paused, user must enable manually)');
    
    return false;
  };
  
  // Toggle audio state
  const toggle = async (audioElement, iconElement) => {
    if (!audioElement) {
      console.warn('⚠️ No audio element provided to toggle');
      return false;
    }
    
    const currentState = getState();
    const newState = !currentState.isPlaying;
    
    console.log(`🎵 Audio toggle: ${currentState.isPlaying ? 'ON' : 'OFF'} → ${newState ? 'ON' : 'OFF'}`);
    
    if (newState) {
      // Turn ON
      try {
        if (audioElement.paused) {
          audioElement.currentTime = 0;
          await audioElement.play();
        }
        gsap.to(audioElement, { volume: VOLUME_LEVEL, duration: 0.3 });
        if (iconElement) gsap.to(iconElement, { opacity: 1.0, duration: 0.3 });
        setState(true, VOLUME_LEVEL);
        console.log('🎵 Audio ON');
        return true;
      } catch (e) {
        console.warn('❌ Audio play failed:', e);
        setState(false);
        return false;
      }
    } else {
      // Turn OFF
      gsap.to(audioElement, { 
        volume: 0, 
        duration: 0.3, 
        onComplete: () => audioElement.pause() 
      });
      if (iconElement) gsap.to(iconElement, { opacity: 0.4, duration: 0.3 });
      setState(false);
      console.log('🔇 Audio OFF');
      return false;
    }
  };
  
  // Crossfade between two audio elements (optional feature)
  const crossfade = async (fromAudio, toAudio, iconElement, duration = 1.0) => {
    if (!fromAudio || !toAudio) return false;
    
    const state = getState();
    if (!state.isPlaying) {
      console.log('⏭️ Crossfade skipped - audio is OFF');
      return false;
    }
    
    console.log('🎼 Crossfading audio...');
    
    try {
      toAudio.volume = 0;
      toAudio.currentTime = 0;
      await toAudio.play();
      
      gsap.to(fromAudio, { 
        volume: 0, 
        duration: duration,
        onComplete: () => fromAudio.pause()
      });
      gsap.to(toAudio, { 
        volume: VOLUME_LEVEL, 
        duration: duration 
      });
      
      console.log('✅ Crossfade complete');
      return true;
    } catch (e) {
      console.warn('❌ Crossfade failed:', e);
      return false;
    }
  };
  
  // Public API
  return {
    getState,
    setState,
    clearState,
    initAudio,
    toggle,
    crossfade,
    VOLUME_LEVEL
  };
})();

console.log('✅ Audio State Manager loaded (v3.0 - session-only)');
