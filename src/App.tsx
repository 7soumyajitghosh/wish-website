import React from 'react';
import { HeartTreeAnimation } from './components/HeartTreeAnimation';

export const App: React.FC = () => {
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const pParam = queryParams?.get('p');
  const initialP = pParam !== null && pParam !== undefined ? parseFloat(pParam) : 0;
  const autoPlay = queryParams?.get('play') === 'false' ? false : true;

  return (
    <main className="w-screen h-screen overflow-hidden">
      <HeartTreeAnimation
        autoPlay={autoPlay}
        loop={true}
        initialProgress={isNaN(initialP) ? 0 : initialP}
      />
    </main>
  );
};

export default App;
