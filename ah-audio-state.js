/*--------------------------------------------------------------
  Awakening Heart : Persistent Audio State Manager
  Version: 2.0 | Date: 2025-10-31
  
  Manages audio play/pause preference across scenes with different audio files.
  Each scene has its own audio file - state tracks user preference, not playback position.
--------------------------------------------------------------*/

window.AHAudioState = (() => {
  const STORAGE_KEY = 'ah_audio_state';
  const VOLUME_LEVEL = 0.35;
  
  // Get current state from localStorage
  const getState = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { isPlaying: false, volume: VOLUME_LEVEL };
    } catch (e) {
      console.warn('Could not read audio state:', e);
      return { isPlaying: false, volume: VOLUME_LEVEL };
    }
  };
  
  // Save state to localStorage
  const setState = (isPlaying, volume = VOLUME_LEVEL) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        isPlaying, 
        volume,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Could not save audio state:', e);
    }
  };
  
  // Clear state (useful for reset)
  const clearState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear audio state:', e);
    }
  };
  
  // Initialize audio element with stored state
  // This loads the scene's specific audio file and starts it if user preference is "playing"
  const initAudio = async (audioElement, iconElement, sceneAudioUrl = null) => {
    if (!audioElement) return false;
    
    const state = getState();
    console.log('🎵 Restoring audio state:', state);
    
    // If scene provides a specific audio URL, load it
    if (sceneAudioUrl) {
      console.log('🎼 Loading scene audio:', sceneAudioUrl);
      audioElement.src = sceneAudioUrl;
      // Small delay to ensure audio is loaded
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Set icon appearance based on stored preference
    if (iconElement) {
      gsap.set(iconElement, { opacity: state.isPlaying ? 1.0 : 0.4 });
    }
    
    // Apply user's audio preference to this scene's audio
    if (state.isPlaying) {
      try {
        audioElement.volume = 0;
        audioElement.currentTime = 0; // Always start from beginning for new scene
        await audioElement.play();
        gsap.to(audioElement, { volume: state.volume, duration: 0.8 });
        console.log('▶️ Scene audio started (per user preference)');
        return true;
      } catch (e) {
        console.warn('Could not auto-start audio:', e);
        // If autoplay fails, update state to paused
        setState(false);
        if (iconElement) gsap.set(iconElement, { opacity: 0.4 });
        return false;
      }
    } else {
      // User preference is to keep audio off
      audioElement.pause();
      audioElement.volume = 0;
      console.log('⏸️ Scene audio paused (per user preference)');
      return false;
    }
  };
  
  // Toggle audio state for current scene
  const toggle = async (audioElement, iconElement) => {
    if (!audioElement) return false;
    
    const currentState = getState();
    const newState = !currentState.isPlaying;
    
    if (newState) {
      // Turn ON - start current scene's audio
      try {
        if (audioElement.paused) {
          audioElement.currentTime = 0; // Start from beginning
          await audioElement.play();
        }
        gsap.to(audioElement, { volume: VOLUME_LEVEL, duration: 0.3 });
        if (iconElement) gsap.to(iconElement, { opacity: 1.0, duration: 0.3 });
        setState(true, VOLUME_LEVEL);
        console.log('🎵 Audio ON');
        return true;
      } catch (e) {
        console.warn('Audio play failed:', e);
        setState(false);
        return false;
      }
    } else {
      // Turn OFF - pause current scene's audio
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
  
  // Crossfade between two audio elements (optional advanced feature)
  const crossfade = async (fromAudio, toAudio, iconElement, duration = 1.0) => {
    if (!fromAudio || !toAudio) return false;
    
    const state = getState();
    if (!state.isPlaying) return false; // Don't crossfade if user has audio off
    
    try {
      // Start new audio at 0 volume
      toAudio.volume = 0;
      toAudio.currentTime = 0;
      await toAudio.play();
      
      // Crossfade
      gsap.to(fromAudio, { 
        volume: 0, 
        duration: duration,
        onComplete: () => fromAudio.pause()
      });
      gsap.to(toAudio, { 
        volume: VOLUME_LEVEL, 
        duration: duration 
      });
      
      console.log('🎼 Crossfade complete');
      return true;
    } catch (e) {
      console.warn('Crossfade failed:', e);
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
