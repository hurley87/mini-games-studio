'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MenuScene } from './MenuScene';
import { GameScene } from './GameScene';

export function BallisticGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current || undefined,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#0a0a0a',
      scene: [MenuScene, GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: true,
        antialias: false
      }
    };

    gameRef.current = new Phaser.Game(config);

    // Handle resize
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="game-container">
      <div ref={containerRef} id="phaser-game" />
      <div className="crt-overlay" />
      <div className="vignette" />
    </div>
  );
}

