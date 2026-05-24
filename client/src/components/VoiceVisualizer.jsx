import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function VoiceVisualizer({ state = 'idle' }) {
  // state can be 'idle', 'listening', 'speaking', 'processing', 'connecting', 'error'
  const container = useRef();
  const orb = useRef();
  const ring1 = useRef();
  const ring2 = useRef();

  useGSAP(() => {
    // Reset animations
    gsap.killTweensOf([orb.current, ring1.current, ring2.current]);

    if (state === 'listening') {
      // Blue pulsing orb
      gsap.to(orb.current, { scale: 1.1, backgroundColor: '#3B82F6', duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to(ring1.current, { scale: 1.8, opacity: 0, duration: 1.5, repeat: -1, ease: 'power1.out' });
      gsap.to(ring2.current, { scale: 2.2, opacity: 0, duration: 1.5, repeat: -1, delay: 0.4, ease: 'power1.out' });
    } else if (state === 'speaking') {
      // Green rapid vibrating orb
      gsap.to(orb.current, { scale: 1.2, backgroundColor: '#10B981', duration: 0.15, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to(ring1.current, { scale: 1.5, opacity: 0, duration: 0.6, repeat: -1, ease: 'power2.out' });
      gsap.to(ring2.current, { scale: 1.9, opacity: 0, duration: 0.6, repeat: -1, delay: 0.2, ease: 'power2.out' });
    } else if (state === 'processing') {
      // Purple breathing orb
      gsap.to(orb.current, { scale: 1.05, backgroundColor: '#8B5CF6', duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to([ring1.current, ring2.current], { scale: 1.2, opacity: 0.3, duration: 0.5 });
    } else if (state === 'connecting') {
      // Amber fast pulse
      gsap.to(orb.current, { scale: 0.9, backgroundColor: '#F59E0B', duration: 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to([ring1.current, ring2.current], { scale: 1.1, opacity: 0.1, duration: 0.3 });
    } else if (state === 'error') {
      // Red steady
      gsap.to(orb.current, { scale: 1, backgroundColor: '#EF4444', duration: 0.3 });
      gsap.to([ring1.current, ring2.current], { scale: 1, opacity: 0, duration: 0.3 });
    } else {
      // idle - Slate
      gsap.to(orb.current, { scale: 1, backgroundColor: '#64748B', duration: 0.5 });
      gsap.to([ring1.current, ring2.current], { scale: 1, opacity: 0, duration: 0.5 });
    }
  }, { scope: container, dependencies: [state] });

  return (
    <div ref={container} className="relative flex items-center justify-center w-40 h-40 mx-auto my-8">
      <div ref={ring2} className="absolute w-20 h-20 rounded-full border-[3px] border-white/20 opacity-0" />
      <div ref={ring1} className="absolute w-20 h-20 rounded-full border-[3px] border-white/40 opacity-0" />
      <div 
        ref={orb} 
        className="relative w-20 h-20 rounded-full bg-slate-500 shadow-xl z-10 flex items-center justify-center transition-shadow duration-500"
        style={{
          boxShadow: state === 'listening' ? '0 0 40px rgba(59,130,246,0.6)' : 
                     state === 'speaking' ? '0 0 50px rgba(16,185,129,0.8)' : 
                     state === 'processing' ? '0 0 30px rgba(139,92,246,0.6)' : 
                     state === 'error' ? '0 0 30px rgba(239,68,68,0.6)' : '0 0 20px rgba(0,0,0,0.2)'
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent mix-blend-overlay"></div>
      </div>
    </div>
  );
}
