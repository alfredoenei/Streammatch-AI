import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ConversationThreadProps {
  messages: Message[];
  isTyping?: boolean;
  loadingStatus?: string; // v22.0
  accentColors: {
    vibrant: string;
    darkVibrant: string;
    muted: string;
  };
}

/**
 * ConversationThread v17.0 — Chat Log Experience
 * Muestra el historial de turnos con estética premium y auto-scroll.
 */
const ConversationThread: React.FC<ConversationThreadProps> = ({ 
  messages, 
  isTyping,
  loadingStatus, // v22.0
  accentColors 
}) => {
  // En v17.3 el scroll es global en el Dashboard, no necesitamos ref ni auto-scroll interno
  
  return (
    <div 
      className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => (
          <motion.div
            key={`msg-${idx}-${msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime()) ? msg.timestamp.getTime() : idx}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`relative max-w-3xl w-full flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
                msg.sender === 'user' 
                  ? 'bg-zinc-800 border-white/10 text-zinc-400' 
                  : 'bg-gradient-to-br from-indigo-600 to-purple-700 border-white/20 text-white shadow-lg'
              }`}>
                {msg.sender === 'user' ? <User size={16} /> : <Sparkles size={16} />}
              </div>

              {/* Message Bubble */}
              <div 
                className={`group relative p-5 rounded-3xl text-base border backdrop-blur-xl transition-all duration-500 ${
                  msg.sender === 'user'
                    ? 'bg-zinc-900/40 border-white/5 text-zinc-200 rounded-tr-none ml-auto'
                    : 'bg-zinc-950/60 border-white/10 text-white rounded-tl-none shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
                }`}
                style={msg.sender === 'ai' ? { 
                    boxShadow: `0 10px 40px -15px ${(accentColors?.vibrant || '#6366f1')}30`,
                    borderColor: `${(accentColors?.vibrant || '#6366f1')}20`
                } : {}}
              >
                {/* Glow Effect for AI */}
                {msg.sender === 'ai' && (
                   <div 
                     className="absolute -inset-1 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"
                     style={{ background: `linear-gradient(to right, ${accentColors?.vibrant || '#6366f1'}, ${accentColors?.muted || '#a855f7'})` }}
                   />
                )}

                <div className="prose prose-invert prose-base max-w-none leading-relaxed">
                  <ReactMarkdown 
                    components={{
                       strong: ({ children }) => <strong style={{ color: msg.sender === 'ai' ? (accentColors?.vibrant || '#6366f1') : 'white' }} className="font-black">{children}</strong>
                    }}
                  >
                    {msg.text || ''}
                  </ReactMarkdown>
                </div>
                
                <span className="block mt-3 text-[9px] font-bold uppercase tracking-widest opacity-20">
                   {msg.sender === 'user' ? 'Tú' : 'Sommelier AI'} • {msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime()) ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <div className="bg-zinc-900/40 border border-white/5 px-4 py-2 rounded-2xl rounded-tl-none flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full"
                  />
                ))}
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-indigo-400/70">
                  {loadingStatus || 'El sommelier está pensando...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ConversationThread;
