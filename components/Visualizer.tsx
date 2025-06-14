
import React, { useRef, useEffect } from 'react';
import { VisualizerRenderParams, Mood } from '../types'; // Updated import path

interface VisualizerProps {
  audioData: Uint8Array;
  params: VisualizerRenderParams; // Use VisualizerRenderParams
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioData, params, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; speedX: number; speedY: number; radius: number; color: string }[]>([]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-initialize particles on resize for proper distribution
      particlesRef.current = [];
      const numParticles = params.vibe > 70 ? 150 : params.vibe > 40 ? 100 : 50;
       for (let i = 0; i < numParticles; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speedX: (Math.random() - 0.5) * (1 + params.vibe / 50),
          speedY: (Math.random() - 0.5) * (1 + params.vibe / 50),
          radius: Math.random() * 2 + 1,
          color: 'rgba(255, 255, 255, 0.5)',
        });
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (particlesRef.current.length === 0 && canvas.width > 0 && canvas.height > 0) { // Ensure canvas has dimensions
        const numParticles = params.vibe > 70 ? 150 : params.vibe > 40 ? 100 : 50;
        for (let i = 0; i < numParticles; i++) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speedX: (Math.random() - 0.5) * (1 + params.vibe / 50),
            speedY: (Math.random() - 0.5) * (1 + params.vibe / 50),
            radius: Math.random() * 2 + 1,
            color: 'rgba(255, 255, 255, 0.5)',
          });
        }
      }


    let animationFrameId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(13, 2, 33, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying || !audioData || audioData.length === 0) {
        ctx.fillStyle = params.mood === Mood.COOL ? 'rgba(74, 144, 226, 0.3)' : params.mood === Mood.WARM ? 'rgba(255, 140, 0, 0.3)' : 'rgba(45, 226, 230, 0.3)';
        // Static standby visual can be minimal or just rely on the background clear
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const bufferLength = audioData.length;
      const barWidth = Math.max(1, (canvas.width / bufferLength) * 2.5);
      let barHeight;
      let x = 0;

      let primaryColor: string, secondaryColor: string, particleColor: string;
      switch (params.mood) {
        case Mood.COOL:
          primaryColor = '#4A90E2';
          secondaryColor = '#50E3C2'; // Lighter Cool Teal
          particleColor = 'rgba(74, 144, 226, 0.7)';
          break;
        case Mood.WARM:
          primaryColor = '#F5A623'; // Warm Orange
          secondaryColor = '#FFD700';
          particleColor = 'rgba(245, 166, 35, 0.7)';
          break;
        default:
          primaryColor = '#2DE2E6';
          secondaryColor = '#F706CF';
          particleColor = 'rgba(45, 226, 230, 0.7)'; // Use primary for full spectrum particles
      }

      particlesRef.current.forEach(p => {
        const overallVolume = audioData.reduce((sum, val) => sum + val, 0) / bufferLength;
        const pulseFactor = 1 + (overallVolume / 255) * (params.punch / 100);

        p.x += p.speedX * (1 + params.vibe / 100);
        p.y += p.speedY * (1 + params.vibe / 100);

        if (p.x > canvas.width + p.radius) p.x = -p.radius;
        else if (p.x < -p.radius) p.x = canvas.width + p.radius;
        if (p.y > canvas.height + p.radius) p.y = -p.radius;
        else if (p.y < -p.radius) p.y = canvas.height + p.radius;

        if(params.vibe > 30) { // Reduced threshold for connections
            particlesRef.current.forEach(otherP => {
                if (p === otherP) return;
                const dist = Math.hypot(p.x - otherP.x, p.y - otherP.y);
                const connectDistance = 100 + (params.vibe - 30) * 0.5; // Vibe increases connection distance
                if (dist < connectDistance ) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(220, 220, 220, ${0.05 + 0.15 * (params.vibe/100)})`; // More subtle lines
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(otherP.x, otherP.y);
                    ctx.stroke();
                }
            });
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius * pulseFactor), 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
      });


      const sum = audioData.reduce((a, b) => a + b, 0);
      const avg = sum / bufferLength || 0;
      const heartbeatIntensity = Math.max(0, (avg - 32) / 223); // Adjusted normalization for more sensitivity
      const baseGlowRadius = canvas.width / 5;
      const glowRadius = baseGlowRadius + heartbeatIntensity * baseGlowRadius * (params.punch / 50);

      // Ensure primaryColor is a hex string before slicing for RGBA conversion
      const glowColorHex = primaryColor.startsWith('#') ? primaryColor : '#2DE2E6'; // Default if not hex
      const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, glowRadius / 3, canvas.width / 2, canvas.height / 2, glowRadius);
      gradient.addColorStop(0, `rgba(${parseInt(glowColorHex.slice(1,3),16)}, ${parseInt(glowColorHex.slice(3,5),16)}, ${parseInt(glowColorHex.slice(5,7),16)}, ${0.05 + heartbeatIntensity * 0.15})`);
      gradient.addColorStop(1, 'rgba(13, 2, 33, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);


      const centerFrequency = Math.floor(bufferLength * (params.punch / 100));
      const frequencySpread = bufferLength * (1 - params.vibe / 250);

      for (let i = 0; i < bufferLength; i++) {
        let dataValue = audioData[i];
        const distFromPunchCenter = Math.abs(i - centerFrequency);
        const punchFactor = Math.max(0, 1 - distFromPunchCenter / (frequencySpread / 1.5));

        dataValue = dataValue * (1 + punchFactor * (params.punch / 40));
        dataValue = Math.min(255, dataValue);

        barHeight = (dataValue / 255) * (canvas.height / 1.8); // Slightly reduce max bar height

        let barColor = primaryColor;
        if (params.mood === Mood.FULL_SPECTRUM) {
             const hue = (i / bufferLength * 300 + Date.now()/100) % 360; // Dynamic hue shift
             barColor = `hsl(${hue}, 100%, ${60 + (dataValue/255)*20}%)`; // Lightness based on data
        } else if (params.mood === Mood.COOL) {
            barColor = i % 3 === 0 ? primaryColor : (i%3 === 1 ? secondaryColor : '#63D1F4'); // Third cool color
        } else {
            barColor = i % 3 === 0 ? primaryColor : (i%3 === 1 ? secondaryColor : '#FFB347'); // Third warm color
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
            ctx.lineTo(x + barWidth/2 + (Math.random() -0.5) * 10 * vibeEffect, yPos + (Math.random() -0.5) * 30 * vibeEffect);
            ctx.stroke();

            // Add some "sparks" for high vibe
            if (Math.random() < 0.1 * vibeEffect) {
                ctx.fillStyle = secondaryColor;
                ctx.beginPath();
                ctx.arc(x + barWidth/2 + (Math.random() -0.5) * 10, yPos + (Math.random() -0.5) * 20, Math.random()*2, 0, Math.PI*2);
                ctx.fill();
            }
        }
        x += barWidth + 1;
      }

      const overallVolume = audioData.reduce((sum, val) => sum + val, 0) / bufferLength;
      const vuHeight = (overallVolume / 255) * (canvas.height * 0.7); // Reduced height
      const vuWidth = 15; // Thinner VU
      const vuX = canvas.width - vuWidth - 15;
      const vuY = canvas.height * 0.15 + (canvas.height * 0.7 - vuHeight) ; // Align top

      ctx.fillStyle = 'rgba(30, 30, 40, 0.6)';
      ctx.fillRect(vuX, canvas.height * 0.15, vuWidth, canvas.height * 0.7);

      const vuGradient = ctx.createLinearGradient(vuX, vuY + vuHeight, vuX, vuY);
      vuGradient.addColorStop(0, '#5cb85c'); // Green
      vuGradient.addColorStop(0.6, '#f0ad4e'); // Yellow/Orange
      vuGradient.addColorStop(1, '#d9534f'); // Red
      ctx.fillStyle = vuGradient;
      ctx.fillRect(vuX, vuY, vuWidth, vuHeight);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [audioData, params, isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};