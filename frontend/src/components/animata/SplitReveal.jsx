import React, { useState, useEffect, useRef } from 'react';

/**
 * SplitReveal Component (Adapted from Animata Preloader Split Reveal)
 * Full-screen preloader and page transition that displays loading progress,
 * locks background interaction, and parts open from the center horizontal seam.
 */
export default function SplitReveal({
  active,
  onComplete,
  title = "INITIALIZING DETERMINISTIC AUDIT CORE",
  subtitle = "Zero-Cloud Air-Gapped Network Verification Engine &middot; SIH26155",
  duration = 750, // ms duration for the shutter split animation
}) {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'fade-ui' | 'reveal' | 'done'
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      setPhase('done');
      setProgress(0);
      return;
    }

    setPhase('loading');
    setProgress(0);

    const startTime = Date.now();
    const loadDuration = 400; // Snappy progress load
    let finished = false;

    const completeAll = () => {
      if (finished) return;
      finished = true;
      setPhase('done');
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    };

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / loadDuration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);

        // Step 1: Hold briefly at 100%, then fade out center HUD
        setTimeout(() => {
          setPhase('fade-ui');

          // Step 2: Trigger the horizontal center split
          setTimeout(() => {
            setPhase('reveal');

            // Step 3: Complete transition and notify caller
            setTimeout(() => {
              completeAll();
            }, duration);
          }, 140);
        }, 80);
      }
    }, 20);

    // Hard fallback safety watchdog: ensure shutter never hangs on screen
    const safetyTimer = setTimeout(() => {
      completeAll();
    }, 1400);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [active, duration]);

  if (!active || phase === 'done') return null;

  return (
    <div
      data-split-reveal-overlay=""
      data-phase={phase}
      className={`fixed inset-0 z-[99999] pointer-events-none select-none overscroll-none overflow-hidden ${
        phase === 'loading' ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{
        '--split-reveal-duration': `${duration}ms`,
        '--split-reveal-progress-fade': '220ms',
      }}
    >
      {/* Top Half Shutter (Animates Upwards) */}
      <div
        data-split-reveal-shutter="top"
        className="absolute inset-x-0 top-0 h-1/2 bg-[#020204] border-b border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.95)] will-change-transform flex flex-col justify-end"
      >
        {/* Luminous Razor Seam Glow */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
      </div>

      {/* Bottom Half Shutter (Animates Downwards) */}
      <div
        data-split-reveal-shutter="bottom"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[#020204] border-t border-white/[0.1] shadow-[0_-20px_50px_rgba(0,0,0,0.95)] will-change-transform flex flex-col justify-start"
      >
        {/* Luminous Razor Seam Glow */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
      </div>

      {/* Center Progress HUD (Centered over the split seam) */}
      <div
        data-split-reveal-progress=""
        className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl">
          
          {/* Main Status & Percentage */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-emerald-400 font-mono font-light text-4xl tabular-nums tracking-widest">
              {String(progress).padStart(2, '0')}<span className="text-zinc-700">%</span>
            </span>
            <span className="text-[10px] tracking-[0.4em] uppercase text-emerald-400/80 font-semibold">
              {title}
            </span>
          </div>

          {/* Dynamic Console Text */}
          <div className="font-mono flex flex-col items-center gap-2">
            <span className="text-[12px] text-zinc-300 tracking-widest uppercase">
              {progress < 25 ? ">_ BOOTSTRAPPING SECURE KERNEL..." : 
               progress < 50 ? ">_ VERIFYING NODE REGISTRY..." : 
               progress < 75 ? ">_ ESTABLISHING AUDIT SESSION..." : 
               ">_ WORKSTATION READY."}
            </span>
            <p
              className="text-[10px] text-zinc-600 tracking-widest uppercase mt-4"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
