import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiX,
  FiRotateCcw
} from "react-icons/fi";

const ImageZoomModal = ({ isOpen, src, alt = "Image Preview", onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, src]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, scale]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.3, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!isOpen || !src) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999999] flex flex-col items-center justify-between p-4 bg-black/92 backdrop-blur-md select-none"
        onClick={onClose}
      >
        {/* Top Floating Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl mx-auto flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-900/90 border border-gray-700 shadow-2xl z-10 text-white"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Diagram Zoom
            </span>
            <span className="text-xs font-mono font-bold text-gray-300">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black transition-colors text-sm font-bold flex items-center gap-1"
              title="Zoom In (+)"
            >
              <FiZoomIn className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Zoom In</span>
            </button>

            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black transition-colors text-sm font-bold flex items-center gap-1"
              title="Zoom Out (-)"
            >
              <FiZoomOut className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Zoom Out</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm font-bold flex items-center gap-1"
              title="Reset 100%"
            >
              <FiRotateCcw className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors text-sm font-bold flex items-center gap-1 ml-2"
              title="Close (Esc)"
            >
              <FiX className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Close</span>
            </button>
          </div>
        </motion.div>

        {/* Center: Scaled Image Viewport */}
        <div
          className="flex-1 w-full flex items-center justify-center overflow-hidden my-4 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
        >
          <motion.div
            drag
            dragConstraints={{ left: -600, right: 600, top: -600, bottom: 600 }}
            animate={{ scale: scale }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex items-center justify-center max-w-full max-h-full"
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-gray-800 pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Bottom instructions badge */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] text-gray-400 font-mono bg-black/60 px-4 py-1.5 rounded-full border border-gray-800"
        >
          💡 Tip: Click & drag to pan • Scroll mouse wheel or use <strong>+</strong> / <strong>-</strong> to zoom in & out • Press <strong>Esc</strong> to close
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ImageZoomModal;

