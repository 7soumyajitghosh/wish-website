import React, { useState, useCallback } from 'react';
import { soundManager } from '../../audio/soundManager';

export const SoundToggle: React.FC = () => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const handleToggle = useCallback(() => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
  }, []);

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
      style={{
        background: 'rgba(13, 4, 8, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 179, 193, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
      aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
      title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
    >
      {isMuted ? (
        /* Volume Off Icon */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffb3c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        /* Volume On Icon */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffb3c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
};
