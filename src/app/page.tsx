'use client';

import dynamic from 'next/dynamic';

const BallisticGame = dynamic(
  () => import('@/components/game/BallisticGame').then((mod) => mod.BallisticGame),
  { 
    ssr: false,
    loading: () => (
      <div className="game-container">
        <div className="flex items-center justify-center h-screen w-screen bg-[#0a0a0a]">
          <div className="text-center">
            <h1 
              className="text-4xl mb-4 animate-pulse"
              style={{ 
                fontFamily: '"Press Start 2P", cursive',
                color: '#00ffff',
                textShadow: '0 0 10px #00ffff'
              }}
            >
              BALLISTIC
            </h1>
            <p 
              className="text-sm"
              style={{ 
                fontFamily: '"Press Start 2P", cursive',
                color: '#ff00ff'
              }}
            >
              LOADING...
            </p>
          </div>
        </div>
        <div className="crt-overlay" />
        <div className="vignette" />
      </div>
    )
  }
);

export default function Home() {
  return <BallisticGame />;
}
