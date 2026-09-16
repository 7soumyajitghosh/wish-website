import React, { useRef } from 'react';
import HeartTreeAnimation from '../../HeartTreeAnimation';

interface HeartTreeSceneProps {
  onComplete: () => void;
}

export const HeartTreeScene: React.FC<HeartTreeSceneProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="heart-tree-scene">
      <HeartTreeAnimation
        autoPlay={true}
        loop={false}
        onComplete={onComplete}
      />
    </div>
  );
};
