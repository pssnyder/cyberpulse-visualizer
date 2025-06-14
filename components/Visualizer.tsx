
import React, { useRef, useEffect } from 'react';
import { VisualizerRenderParams, Mood } from '../types'; 

interface VisualizerProps {
  audioData: Uint8Array;
  params: VisualizerRenderParams; 
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioData, params, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; speedX: number; speedY: number; radius: number; color: string }[]>([]);
  const lastVibeRef = useRef<number>(params.vibe);
  const lastMoodRef = useRef<Mood>(params.mood);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const initializeParticles = () => {
        particlesRef.current = [];
        if (!isPlaying || params.vibe <= 10) return; 

        const numParticles = params.vibe > 70 ? 150 : params.vibe > 40 ? 100 : 50;
        let pColor = 'rgba(255, 255, 255, 0.5)';
        if (params.mood === Mood.COOL) pColor = 'rgba(74, 144, 226, 0.7)';
        else if (params.mood === Mood.WARM) pColor = 'rgba(245, 166, 35, 0.7)';
        else pColor = 'rgba(45, 226, 230, 0.7)';

        for (let i = 0; i < numParticles; i++) {
            particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speedX: (Math.random() - 0.5) * (1 + params.vibe / 50),
            speedY: (Math.random() - 0.5) * (1 + params.vibe / 50),
            radius: Math.random() * 2 + 1,
            color: pColor,
            });
        }
        lastVibeRef.current = params.vibe;
        lastMoodRef.current = params.mood;
    };
    
    initializeParticles();


    let animationFrameId: number;

    const render = () => {
      if (!canvas || !ctx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (!isPlaying) {
        ctx.fillStyle = 'rgba(13, 2, 33, 1)'; // Solid dark clear for true standby
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (particlesRef.current.length > 0) {
            particlesRef.current = []; 
        }
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // If isPlaying is true, proceed with normal rendering.
      ctx.fillStyle = 'rgba(13, 2, 33, 0.12)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bufferLength = audioData.length;
      if (!audioData || bufferLength === 0) {
        // Still draw standby glow if audioData is somehow null/empty but isPlaying is true
        const time = Date.now() / 800; 
        const standbyGlowRadius = canvas.width * (0.015 + Math.sin(time * Math.PI) * 0.005);
        const standbyGlowOpacity = 0.1 + Math.sin(time * Math.PI * 0.75) * 0.05;
        const standbyGlowGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, standbyGlowRadius);
        standbyGlowGradient.addColorStop(0, `rgba(45, 226, 230, ${standbyGlowOpacity})`);
        standbyGlowGradient.addColorStop(1, `rgba(45, 226, 230, 0)`);
        ctx.fillStyle = standbyGlowGradient;
        ctx.fillRect(0,0,canvas.width, canvas.height);

        animationFrameId = requestAnimationFrame(render);
        return;
      }
      
      if (params.vibe !== lastVibeRef.current || params.mood !== lastMoodRef.current) {
        if (params.vibe <=10 && particlesRef.current.length > 0) {
            particlesRef.current = []; 
        } else if (params.vibe > 10) {
            initializeParticles(); 
        }
        lastVibeRef.current = params.vibe;
        lastMoodRef.current = params.mood;
      }


      let primaryColor: string, secondaryColor: string;
      switch (params.mood) {
        case Mood.COOL:
          primaryColor = '#4A90E2'; 
          secondaryColor = '#50E3C2'; 
          break;
        case Mood.WARM:
          primaryColor = '#F5A623'; 
          secondaryColor = '#FFD700'; 
          break;
        default: 
          primaryColor = '#2DE2E6'; 
          secondaryColor = '#F706CF'; 
      }

      if (params.vibe > 10 && particlesRef.current.length > 0) {
        particlesRef.current.forEach(p => {
            const overallVolume = audioData.reduce((sum, val) => sum + val, 0) / bufferLength;
            const pulseFactor = 1 + (overallVolume / 255) * (params.punch / 100);

            p.x += p.speedX * (1 + params.vibe / 100);
            p.y += p.speedY * (1 + params.vibe / 100);

            if (p.x > canvas.width + p.radius) p.x = -p.radius;
            else if (p.x < -p.radius) p.x = canvas.width + p.radius;
            if (p.y > canvas.height + p.radius) p.y = -p.radius;
            else if (p.y < -p.radius) p.y = canvas.height + p.radius;

            if(params.vibe > 30) {
                particlesRef.current.forEach(otherP => {
                    if (p === otherP) return;
                    const dist = Math.hypot(p.x - otherP.x, p.y - otherP.y);
                    const connectDistance = 70 + (params.vibe - 30) * 0.8; 
                    if (dist < connectDistance ) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(220, 220, 220, ${0.02 + 0.1 * (params.vibe/100)})`; 
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(otherP.x, otherP.y);
                        ctx.stroke();
                    }
                });
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, p.radius * pulseFactor), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
      }

      const isAudioEffectivelySilent = audioData.every(d => d < 5); 

      const bassFrequencyCount = Math.max(1, Math.floor(bufferLength * 0.25)); 
      let bassSum = 0;
      for (let i = 0; i < bassFrequencyCount; i++) {
          bassSum += audioData[i];
      }
      const bassAverage = bassFrequencyCount > 0 ? bassSum / bassFrequencyCount : 0;
      const bassIntensity = Math.pow(Math.min(1, bassAverage / 150), 2); 

      const overallVolumeForGlow = audioData.reduce((sum, val) => sum + val, 0) / bufferLength;
      
      let dynamicMinGlowRadius = canvas.width * 0.01; 
      let baseOpacity = 0.05;

      if (isAudioEffectivelySilent) {
        const time = Date.now() / 800; // Slower breath
        dynamicMinGlowRadius = canvas.width * (0.015 + Math.sin(time * Math.PI) * 0.005); 
        baseOpacity = 0.08 + Math.sin(time * Math.PI * 0.75) * 0.03; // Pulsating opacity
      } else {
        dynamicMinGlowRadius = canvas.width * 0.02; 
      }

      const bassPulseEffect = bassIntensity * (canvas.width * 0.20) * (1 + params.punch / 30); 
      const overallVolumeEffectOnGlow = (overallVolumeForGlow / 255) * (canvas.width * 0.05);
      
      const glowRadius = dynamicMinGlowRadius + bassPulseEffect + overallVolumeEffectOnGlow;
      const effectiveGlowOpacity = Math.min(0.7, baseOpacity + (bassIntensity * 0.65) + (overallVolumeForGlow / 255 * 0.1));
      
      if (glowRadius > canvas.width * 0.005 && effectiveGlowOpacity > 0.01) { 
        const glowColorHex = primaryColor.startsWith('#') ? primaryColor : '#2DE2E6';
        const r = parseInt(glowColorHex.slice(1,3),16);
        const g = parseInt(glowColorHex.slice(3,5),16);
        const b = parseInt(glowColorHex.slice(5,7),16);
        
        const glowGradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.max(0, glowRadius * 0.2), canvas.width / 2, canvas.height / 2, Math.max(0, glowRadius));
        glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${effectiveGlowOpacity})`);
        glowGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${effectiveGlowOpacity * 0.3})`);
        glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`); 
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height); 
      }

      const barWidth = Math.max(1, (canvas.width / bufferLength) * 2.5);
      let barHeight;
      let x = 0;

      const centerFrequencyIndex = Math.floor(bufferLength * (params.punch / 200)); 
      const frequencySpreadFactor = 1 - params.vibe / 250; 

      for (let i = 0; i < bufferLength; i++) {
        let dataValue = audioData[i];
        
        const distFromPunchCenter = Math.abs(i - centerFrequencyIndex);
        const punchFocusWidth = bufferLength * 0.25 * frequencySpreadFactor; 
        const punchMagnitude = 1 + (params.punch / 30); 
        const punchFactor = Math.max(0, 1 - distFromPunchCenter / punchFocusWidth) * punchMagnitude;

        dataValue = dataValue * (1 + punchFactor);
        dataValue = Math.min(255, dataValue);

        barHeight = (dataValue / 255) * (canvas.height / 1.2); 
        barHeight = Math.max(0, barHeight); 

        if (barHeight < 0.5) { 
            x += barWidth + 1;
            continue;
        }

        let barColor = primaryColor;
        if (params.mood === Mood.FULL_SPECTRUM) {
             const hue = (i / bufferLength * 360 + Date.now()/100) % 360; 
             barColor = `hsl(${hue}, 100%, ${60 + (dataValue/255)*20}%)`; 
        } else if (params.mood === Mood.COOL) {
            barColor = i % 3 === 0 ? primaryColor : (i%3 === 1 ? secondaryColor : '#63D1F4'); 
        } else { 
            barColor = i % 3 === 0 ? primaryColor : (i%3 === 1 ? secondaryColor : '#FFB347'); 
        }
        ctx.fillStyle = barColor;

        const vibeEffect = params.vibe / 100;
        if (vibeEffect < 0.3) { 
             ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        } else if (vibeEffect < 0.7) { 
            ctx.beginPath();
            ctx.moveTo(x, canvas.height);
            ctx.lineTo(x, canvas.height - barHeight * (0.8 + Math.random()*0.1*vibeEffect));
            ctx.lineTo(x + barWidth / 2, canvas.height - barHeight * (1 + (Math.random()-0.5)*0.3*vibeEffect));
            ctx.lineTo(x + barWidth, canvas.height - barHeight * (0.9 + Math.random()*0.1*vibeEffect));
            ctx.lineTo(x + barWidth, canvas.height);
            ctx.closePath();
            ctx.fill();
        } else { 
            ctx.strokeStyle = barColor;
            ctx.lineWidth = Math.max(1, barWidth / 3 + Math.random() * (barWidth/3) * vibeEffect );
            ctx.beginPath();
            const startY = canvas.height - Math.random() * barHeight * 0.2 * vibeEffect;
            ctx.moveTo(x + barWidth/2, startY);
            let yPos = canvas.height - barHeight;
            ctx.lineTo(x + barWidth/2 + (Math.random() -0.5) * 15 * vibeEffect, yPos + (Math.random() -0.5) * 40 * vibeEffect);
            ctx.stroke();

            if (Math.random() < 0.15 * vibeEffect && barHeight > canvas.height * 0.1) {
                ctx.fillStyle = secondaryColor;
                ctx.beginPath();
                ctx.arc(x + barWidth/2 + (Math.random() -0.5) * 15, yPos + (Math.random() -0.5) * 30, Math.random()*2.5, 0, Math.PI*2);
                ctx.fill();
            }
        }
        x += barWidth + 1; 
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [audioData, params, isPlaying, canvasRef]); // isPlaying is a key dependency here

  return <canvas ref={canvasRef} className="w-full h-full" />;
};
