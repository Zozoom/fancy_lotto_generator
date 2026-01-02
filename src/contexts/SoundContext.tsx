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
    winSoundRef.current = new Audio("/sounds/winner-game-sound-404167.mp3");
    loseSoundRef.current = new Audio("/sounds/fail-trumpet-02-383962.mp3");
    
    // Set volume
    if (winSoundRef.current) {
      winSoundRef.current.volume = 0.7;
    }
    if (loseSoundRef.current) {
      loseSoundRef.current.volume = 0.7;
    }
  }, []);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("soundMuted", String(newMutedState));
  };

  const playWinSound = useCallback(() => {
    if (isMuted || !winSoundRef.current) return;
    try {
      winSoundRef.current.currentTime = 0; // Reset to start
      winSoundRef.current.play().catch((e) => {
        console.error("Error playing win sound:", e);
      });
    } catch (e) {
      console.error("Error playing win sound:", e);
    }
  }, [isMuted]);

  const playLoseSound = useCallback(() => {
    if (isMuted || !loseSoundRef.current) return;
    try {
      loseSoundRef.current.currentTime = 0; // Reset to start
      loseSoundRef.current.play().catch((e) => {
        console.error("Error playing lose sound:", e);
      });
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

