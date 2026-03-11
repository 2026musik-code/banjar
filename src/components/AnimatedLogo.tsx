import React from 'react';
import { motion } from 'motion/react';

export default function AnimatedLogo() {
  return (
    <div className="relative flex items-center justify-center w-10 h-10 mr-3 shrink-0">
      {/* Outer rotating shape */}
      <motion.div
        className="absolute w-8 h-8 bg-accent/20 rounded-tl-2xl rounded-br-2xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner rotating shape */}
      <motion.div
        className="absolute w-8 h-8 border-2 border-accent rounded-tr-2xl rounded-bl-2xl"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      {/* Center pulsing dot */}
      <motion.div
        className="absolute w-3 h-3 bg-accent rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
