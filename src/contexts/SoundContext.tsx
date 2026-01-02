"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playWinSound: () => void;
  playLoseSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem("soundMuted");
    if (savedMuteState !== null) {
      setIsMuted(savedMuteState === "true");
    }

    // Preload audio files
    const winAudio = new Audio("/sounds/winner-game-sound-404167.mp3");
    const loseAudio = new Audio("/sounds/fail-trumpet-02-383962.mp3");
    
    // Set volume and preload
    winAudio.volume = 0.7;
    loseAudio.volume = 0.7;
    
    // Preload the audio
    winAudio.preload = "auto";
    loseAudio.preload = "auto";
    
    // Load the audio files
    winAudio.load();
    loseAudio.load();
    
    winSoundRef.current = winAudio;
    loseSoundRef.current = loseAudio;
    
    // Cleanup on unmount
    return () => {
      winAudio.pause();
      winAudio.src = "";
      loseAudio.pause();
      loseAudio.src = "";
    };
  }, []);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("soundMuted", String(newMutedState));
  };

  const playWinSound = useCallback(() => {
    if (isMuted || !winSoundRef.current) {
      console.log("Win sound skipped - muted:", isMuted, "ref exists:", !!winSoundRef.current);
      return;
    }
    try {
      const audio = winSoundRef.current;
      audio.currentTime = 0; // Reset to start
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Win sound playing");
          })
          .catch((e) => {
            console.error("Error playing win sound:", e);
            // Try to reload and play again
            audio.load();
            audio.play().catch((err) => console.error("Retry failed:", err));
          });
      }
    } catch (e) {
      console.error("Error playing win sound:", e);
    }
  }, [isMuted]);

  const playLoseSound = useCallback(() => {
    if (isMuted) {
      console.log("Lose sound skipped - muted:", isMuted);
      return;
    }
    
    // Create new audio instance if ref is null or not ready
    let audio = loseSoundRef.current;
    if (!audio || audio.readyState === 0) {
      audio = new Audio("/sounds/fail-trumpet-02-383962.mp3");
      audio.volume = 0.7;
      audio.preload = "auto";
      loseSoundRef.current = audio;
    }
    
    try {
      audio.currentTime = 0; // Reset to start
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Lose sound playing successfully");
          })
          .catch((e) => {
            console.error("Error playing lose sound:", e);
            // Try to reload and play again
            audio.load();
            audio.play().catch((err) => {
              console.error("Retry failed:", err);
              // Last resort: create a completely new audio element
              const newAudio = new Audio("/sounds/fail-trumpet-02-383962.mp3");
              newAudio.volume = 0.7;
              newAudio.play().catch((finalErr) => console.error("Final attempt failed:", finalErr));
            });
          });
      }
    } catch (e) {
      console.error("Error playing lose sound:", e);
    }
  }, [isMuted]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playWinSound, playLoseSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}

