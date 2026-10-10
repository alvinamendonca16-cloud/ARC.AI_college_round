import { useEffect, useRef, useState } from 'react';
import heroBackground from '../assets/patchwork-hero-bg.jpg';
import cloudFlightLeft from '../assets/cloud-flight-source-left.png';
import cloudFlightRight from '../assets/cloud-flight-source-right.png';

const cloudSprites = [cloudFlightLeft, cloudFlightRight];

const cloudCount = 20;
const cloudFlight = Array.from({ length: cloudCount }, (_, index) => ({
  id: index,
  angle: -Math.PI / 2 + (index / cloudCount) * Math.PI * 2,
  start: 0.12 + (index % 10) * 0.038 + Math.floor(index / 10) * 0.11,
  duration: 0.3 + (index % 4) * 0.025,
  size: 29 + ((index * 13) % 36),
  sprite: index % cloudSprites.length,
  rotation: ((index * 17) % 24) - 12,
}));

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function LandingPage({ children, onOpenWorkspace, onNavigate }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sceneRef = useRef(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    let frameId = 0;
    const updateScrollProgress = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const scrollDistance = Math.max(scene.offsetHeight - window.innerHeight, 1);
        const progress = clamp(-scene.getBoundingClientRect().top / scrollDistance, 0, 1);
        setScrollProgress(progress);

        if (progress >= 0.82 && !triggeredRef.current) {
          triggeredRef.current = true;
          onOpenWorkspace?.('https://sonora.patchwork.local/', true);
        } else if (progress <= 0.18 && triggeredRef.current) {
          triggeredRef.current = false;
          onNavigate?.('landing');
        }
      });
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, [onOpenWorkspace, onNavigate]);

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const motionProgress = reducedMotion ? 0 : scrollProgress;
  const imageOpacity = 1 - clamp(scrollProgress / 0.16, 0, 1);
  const cloudEnvironmentOpacity = clamp((scrollProgress - 0.07) / 0.16, 0, 1)
    * (1 - clamp((scrollProgress - 0.88) / 0.12, 0, 1));
  const appReveal = clamp((scrollProgress - 0.82) / 0.18, 0, 1);

  return (
    <div className="landing-shell landing-immersive" ref={sceneRef}>
      <div className="landing-immersive__scene">
        <div
          className="landing-immersive__cloudfield"
          aria-hidden="true"
        >
          <div className="landing-immersive__cloudworld">
            {cloudFlight.map((cloud) => {
              const phase = clamp((motionProgress - cloud.start) / cloud.duration, 0, 1);
              const travel = phase ** 1.15;
              const radiusX = 74 + cloud.size * 0.65;
              const radiusY = 66 + cloud.size * 0.52;
              const x = Math.cos(cloud.angle) * radiusX * travel;
              const y = Math.sin(cloud.angle) * radiusY * travel;
              const z = -500 + phase * 1600;
              const scale = 0.38 + phase * 0.78;
              const opacity = clamp(phase * 5, 0, 1) * clamp((1 - phase) * 5, 0, 1);

              return (
                <div
                  className="cloud-flight__cloud"
                  key={cloud.id}
                  style={{
                    width: `clamp(250px, ${cloud.size * 1.25}vw, 850px)`,
                    opacity: reducedMotion ? 0 : opacity * cloudEnvironmentOpacity,
                    transform: `translate3d(${x}vw, ${y}vh, ${z}px) translate(-50%, -50%) scale(${scale}) rotate(${cloud.rotation}deg)`,
                  }}
                >
                  <img src={cloudSprites[cloud.sprite]} alt="" draggable="false" />
                </div>
              );
            })}
          </div>
        </div>

        <img
          className="landing-immersive__image"
          src={heroBackground}
          alt=""
          style={{ opacity: imageOpacity }}
          fetchPriority="high"
        />
      </div>

      {children && (
        <div
          className="landing-immersive__app"
          style={{
            opacity: appReveal,
            pointerEvents: appReveal > 0.96 ? 'auto' : 'none',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
