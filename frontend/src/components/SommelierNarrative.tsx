import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { Vibrant } from 'node-vibrant/browser';

interface SommelierNarrativeProps {
  content: string;
  posterUrl?: string;
}

/**
 * SommelierNarrative v16.1 — The Voice of Cinema
 * 
 * Un componente de lujo con estética Glassmorphism para presentar
 * la curaduría personalizada de la IA con estilo premium.
 */
const SommelierNarrative: React.FC<SommelierNarrativeProps> = ({ content, posterUrl }) => {
  const [colors, setColors] = useState({
    vibrant: '#6366f1', // indigo-500 default
    darkVibrant: '#3730a3',
    muted: '#3f3f46' // zinc default
  });

  useEffect(() => {
    if (!posterUrl) return;
    let isMounted = true;
    
    // Feature: Extracción de Color Adaptive
    const extractTheme = async () => {
      try {
        const palette = await Vibrant.from(posterUrl).getPalette();
        if (isMounted) {
          setColors({
            vibrant: palette.Vibrant?.hex || '#6366f1',
            darkVibrant: palette.DarkVibrant?.hex || '#3730a3',
            muted: palette.Muted?.hex || '#a855f7',
          });
        }
      } catch (err) {
        console.warn('⚠️ No se pudo extraer la paleta Vibrant del póster:', err);
      }
    };
    extractTheme();
    
    return () => { isMounted = false; };
  }, [posterUrl]);

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: 0.2 
      }}
      className="relative group mb-12"
    >
      {/* Dynamic Background Glow Overlay */}
      <div 
        className="absolute -inset-1 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${colors.darkVibrant}40, ${colors.vibrant}30, ${colors.muted}40)`
        }}
      />
      
      {/* Glassmorphic Container */}
      <div 
        className="relative overflow-hidden rounded-[2rem] border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-colors duration-1000"
        style={{ backgroundColor: `${colors.darkVibrant}1A` }} // opacity ~0.1 (10%)
      >
        
        {/* Animated Accent Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px] opacity-70 transition-colors duration-1000"
          style={{ background: `linear-gradient(to right, transparent, ${colors.vibrant}, transparent)` }}
        />
        
        <div className="p-8 lg:p-10 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sommelier Badge/Icon Section */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-lg opacity-20 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center border border-white/20 shadow-inner">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sommelier AI</span>
          </div>

          {/* Text Content Section */}
          <div className="flex-1 space-y-6 relative">
            <Quote className="absolute -top-4 -left-4 w-12 h-12 text-white/5 pointer-events-none" />
            
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown 
                components={{
                  // Custom styling for markdown elements
                  p: ({ children }) => <p className="text-zinc-200 text-lg lg:text-xl font-medium leading-relaxed tracking-tight">{children}</p>,
                  strong: ({ children }) => (
                    <strong 
                      className="font-black drop-shadow-md transition-colors duration-1000"
                      style={{ color: colors.vibrant }}
                    >
                      {children}
                    </strong>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {/* Premium Divider */}
            <div className="flex items-center gap-4">
              <div 
                className="h-[1px] flex-1 opacity-50 transition-colors duration-1000" 
                style={{ background: `linear-gradient(to right, transparent, ${colors.vibrant})` }} 
              />
              <div className="flex gap-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors duration-1000" style={{ backgroundColor: colors.vibrant }} />
                ))}
              </div>
              <div 
                className="h-[1px] flex-1 opacity-50 transition-colors duration-1000" 
                style={{ background: `linear-gradient(to right, ${colors.vibrant}, transparent)` }} 
              />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 p-4 opacity-10">
          <div className="w-24 h-24 border-r-2 border-b-2 border-white rounded-br-3xl" />
        </div>
      </div>
    </motion.div>
  );
};

export default SommelierNarrative;
