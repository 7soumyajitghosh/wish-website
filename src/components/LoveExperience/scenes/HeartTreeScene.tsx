import React, { useEffect, useRef } from 'react';
import HeartTreeAnimation from '../../HeartTreeAnimation';

interface HeartTreeSceneProps {
  onComplete: () => void;
}

export const HeartTreeScene: React.FC<HeartTreeSceneProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Fallback: advance even if the tree never reports completion (avoid dead scene).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }, 30000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  };

  return (
    <div ref={containerRef} className="heart-tree-scene">
      <HeartTreeAnimation
        autoPlay={true}
        loop={false}
        onComplete={handleComplete}
      />
    </div>
  );
};
