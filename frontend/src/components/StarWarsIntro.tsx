'use client';

import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import st from 'framer-motion';
import { MdOutlineReplay } from 'react-icons/md';
interface StarWarsIntroProps {
  story?: string[];
  className?: string;
}

const StarWarsIntro: React.FC<StarWarsIntroProps> = ({
  story = [
    'We’re Mike and Chris. Two regular people who got tired of watching families scramble for help when things go sideways.',
    'We come from humble backgrounds, and we built Help Nearby with a simple belief: people deserve clear next steps when life gets chaotic.',
    'We met while traveling through Europe, stayed close, and kept talking about the same problem—resources exist, but they’re hard to find when you’re stressed, displaced, or trying to help someone you love.',
    'So we’re building a hub that makes it easier to locate real help fast—disaster updates, food, housing, and cash assistance—without the noise.',
    'We’re not trying to be heroes. We just want to build the thing we’d want for our own family and friends. The journey continues............',
  ],
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // For consistent hydration, always render the animated version
  // but make sure we don't show the animation during SSR
  const shouldAnimate = hasMounted ? isPlaying : false;

  // Inline styles for all the CSS properties
  const starWarsContainerStyle: React.CSSProperties = {
    position: 'relative',
    height: '400px',
    overflow: 'hidden',
    background: '#000',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'center',
    perspective: '420px',
  };

  const fadeTopStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '140px',
    pointerEvents: 'none',
    background:
      'linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
    zIndex: 5,
  };

  const fadeBottomStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '140px',
    pointerEvents: 'none',
    background: 'linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
    zIndex: 5,
  };

  const starsStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundRepeat: 'repeat',
    backgroundPosition: '0 0',
    opacity: 0.55,
    zIndex: 1,
    backgroundImage:
      'radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.9) 50%, transparent 51%), ' +
      'radial-gradient(1px 1px at 140px 80px, rgba(255,255,255,0.7) 50%, transparent 51%), ' +
      'radial-gradient(1px 1px at 280px 210px, rgba(255,255,255,0.6) 50%, transparent 51%), ' +
      'radial-gradient(2px 2px at 460px 120px, rgba(255,255,255,0.85) 50%, transparent 51%), ' +
      'radial-gradient(1px 1px at 620px 260px, rgba(255,255,255,0.6) 50%, transparent 51%)',
    animation: 'starDrift 40s linear infinite',
  };

  const stars2Style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundRepeat: 'repeat',
    backgroundPosition: '0 0',
    opacity: 0.35,
    zIndex: 1,
    filter: 'blur(0.2px)',
    backgroundImage:
      'radial-gradient(1px 1px at 60px 160px, rgba(255,255,255,0.8) 50%, transparent 51%), ' +
      'radial-gradient(2px 2px at 220px 320px, rgba(255,255,255,0.7) 50%, transparent 51%), ' +
      'radial-gradient(1px 1px at 520px 40px, rgba(255,255,255,0.55) 50%, transparent 51%), ' +
      'radial-gradient(1px 1px at 760px 220px, rgba(255,255,255,0.6) 50%, transparent 51%)',
    animation: 'starDrift 65s linear infinite',
  };

  const stars3Style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundRepeat: 'repeat',
    backgroundPosition: '0 0',
    opacity: 0.22,
    zIndex: 1,
    filter: 'blur(0.6px)',
    backgroundImage:
      'radial-gradient(2px 2px at 90px 60px, rgba(255,255,255,0.65) 50%, transparent 51%), ' +
      'radial-gradient(1px 1px at 360px 160px, rgba(255,255,255,0.55) 50%, transparent 51%), ' +
      'radial-gradient(1px 1px at 680px 90px, rgba(255,255,255,0.45) 50%, transparent 51%)',
    animation: 'starDrift 90s linear infinite',
  };

  const playPauseButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'background 0.2s ease',
    backdropFilter: 'blur(4px)',
  };

  const crawlContentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    width: 'min(900px, 92vw)',
    transformOrigin: '50% 100%',
    textAlign: 'justify',
    color: '#f9c700',
    letterSpacing: '0.08em',
    lineHeight: 1.55,
    fontWeight: 600,
    fontSize: '22px',
    padding: '0 10px',
    top: '-1800px',
    transform: 'rotateX(25deg) translateZ(-900px)',
    animation: 'crawl 60s linear infinite',
    animationPlayState: shouldAnimate ? 'running' : 'paused',
  };

  const crawlContentReducedStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    width: 'min(900px, 92vw)',
    transformOrigin: '50% 100%',
    textAlign: 'justify',
    color: '#f9c700',
    letterSpacing: '0.08em',
    lineHeight: 1.55,
    fontWeight: 600,
    fontSize: '22px',
    padding: '0 10px',
    top: '24px',
    transform: 'none',
    animation: 'none',
    paddingTop: '18px',
  };

  const crawlTitleStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '18px',
  };

  const episodeStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    opacity: 0.9,
    letterSpacing: '0.14em',
  };

  const crawlHeadingStyle: React.CSSProperties = {
    margin: '6px 0 0',
    fontSize: '30px',
    letterSpacing: '0.12em',
  };

  const crawlParagraphStyle: React.CSSProperties = {
    margin: '18px 0',
  };

  // Add CSS animations as inline styles
  const styleSheet = `
    @keyframes starDrift {
      from { transform: translateY(0); }
      to { transform: translateY(220px); }
    }
    
    @keyframes crawl {
      0% {
        top: 400px;
        transform: rotateX(25deg) translateZ(-900px);
      }
      100% {
        top: -1800px;
        transform: rotateX(25deg) translateZ(0);
      }
    }
  `;

  return (
    <div className={`crawl-animation ${className}`} style={{ width: '100%' }}>
      <style>{styleSheet}</style>
      <section className="crawl-wrap" aria-label="Our story (animated crawl)">
        <div style={starWarsContainerStyle}>
          <div style={fadeTopStyle} aria-hidden="true" />
          <div style={fadeBottomStyle} aria-hidden="true" />

          {/* Starfield */}
          <div style={starsStyle} aria-hidden="true" />
          <div style={stars2Style} aria-hidden="true" />
          <div style={stars3Style} aria-hidden="true" />

          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <button
              style={playPauseButtonStyle}
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            >
              {isPlaying ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ color: '#fff' }}
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ color: '#fff' }}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              style={{ ...playPauseButtonStyle, top: '70px' }}
              onClick={() => {
                setIsPlaying(false);
                setTimeout(() => setIsPlaying(true), 0);
              }}
              aria-label="Restart animation"
            >
              <MdOutlineReplay size={32} color="#fff" />
            </button>
          </div>

          {/* Crawl - Improved for Star Wars effect */}
          <div className="crawl-content-static" style={crawlContentStyle}>
            <div style={crawlTitleStyle}>
              <p style={episodeStyle}>Episode I</p>
              <h2 style={crawlHeadingStyle}>HELP NEARBY</h2>
            </div>

            {story.map((p, idx) => (
              <p key={idx} style={crawlParagraphStyle}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StarWarsIntro;
