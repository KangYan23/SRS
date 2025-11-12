import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
// import Image from "next/image"; // Not used, fallback to <img>

const PLACEHOLDERS = [
  "Welcome to Smart Referral System",
  "Select the body part",
  "Ask about AI features",
  "Design a landing page",
];

const containerVariants = {
  collapsed: {
    height: 68,
    boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
  expanded: {
    height: 700,
    boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
};

function AIChatInput() {
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showCardiac, setShowCardiac] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const wrapperRef = useRef(null);

  // Placeholder animation logic (optional, can be improved)
  useEffect(() => {
    if (!isActive && !inputValue) {
      const interval = setInterval(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isActive, inputValue]);


  // Show a visible message when the heart is pressed
  const [heartMsg, setHeartMsg] = useState("");
  const handleActivate = () => setIsActive(true);

  function handleHeartClick(e) {
    e.stopPropagation();
    setShowCardiac(true);
    setHeartMsg("❤️ Cardiac view activated!");
    setTimeout(() => setHeartMsg(""), 2000);
  }

  // Placeholder animation variants
  const placeholderContainerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  };
  const letterVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.1 } },
  };

  return (
    <div
      className="w-full min-h-screen flex justify-center items-start text-black"
  style={{ marginTop: '120px' }}>
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl relative"
        variants={containerVariants}
        animate={isActive || inputValue ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 32, background: "#fff" }}
        onClick={handleActivate}>
        {/* Body Figure Image - Shows when expanded */}
        <AnimatePresence>
          {(isActive || inputValue) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[10000] p-4"
            >
              <div className="relative w-full h-full flex items-center justify-center z-[10000]">
                {/* Cross-fade images */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: showCardiac ? 0 : 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                  style={{ zIndex: 1 }}
                >
                  <img
                    src="/photo/bodyfigure.jpg"
                    alt="Body Figure"
                    width={400}
                    height={500}
                    className="object-contain max-h-[600px]"
                    style={{ pointerEvents: 'none' }}
                  />
                </motion.div>
                {/* Heart button overlaying the heart area on the body figure, always clickable, last child in .relative */}
                {(isActive || inputValue) && !showCardiac && (
                  <button
                    type="button"
                    aria-label="Show Cardiac"
                    title="Click to view cardiac image"
                    onClick={handleHeartClick}
                    className="absolute flex items-center justify-center border-2 border-white shadow-lg transition-transform duration-150 hover:scale-110 hover:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    style={{
                      left: '52%',
                      top: '38%',
                      width: 48,
                      height: 48,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      background: 'rgba(225, 29, 72, 0.18)', // transparent rose
                      border: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 0 8px 2px #fff2, 0 2px 8px 0 #e11d4822',
                      cursor: 'pointer',
                      zIndex: 9999,
                      pointerEvents: 'auto',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 'bold', fontSize: 28, lineHeight: 1, textShadow: '0 2px 8px #0002' }}>♥</span>
                  </button>
                )}

      {/* Heart message toast */}
      {heartMsg && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-[10000] text-lg animate-fade-in">
          {heartMsg}
        </div>
      )}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showCardiac ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                  style={{ zIndex: 2 }}
                >
                  <img
                    src="/photo/cardiac.jpg"
                    alt="Cardiac"
                    width={400}
                    height={500}
                    className="object-contain max-h-[600px] pointer-events-none"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-stretch w-full h-full relative z-10">
          {/* Input Row */}
          <div
            className="flex items-center gap-2 p-3 rounded-full bg-white max-w-3xl w-full">
            <button
              className="p-3 rounded-full hover:bg-gray-100 transition"
              title="Attach file"
              type="button"
              tabIndex={-1}>
              <Paperclip size={20} />
            </button>
 
            {/* Text Input & Placeholder */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal"
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate} />
              <div
                className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit">
                      {PLACEHOLDERS[placeholderIndex]
                        .split("")
                        .map((char, i) => (
                          <motion.span key={i} variants={letterVariants} style={{ display: "inline-block" }}>
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
 
            <button
              className="p-3 rounded-full hover:bg-gray-100 transition"
              title="Voice input"
              type="button"
              tabIndex={-1}>
              <Mic size={20} />
            </button>
            <button
              className="flex items-center gap-1 bg-black hover:bg-zinc-700 text-white p-3 rounded-full font-medium justify-center"
              title="Send"
              type="button"
              tabIndex={-1}>
              <Send size={18} />
            </button>
          </div>
 
          {/* Expanded Controls */}
          <motion.div
            className="w-full flex justify-start px-4 items-center text-sm"
            variants={{
              hidden: {
                opacity: 0,
                y: 20,
                pointerEvents: "none",
                transition: { duration: 0.25 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: "auto",
                transition: { duration: 0.35, delay: 0.08 },
              },
            }}
            initial="hidden"
            animate={isActive || inputValue ? "visible" : "hidden"}
            style={{ marginTop: 8 }}>
            <div className="flex gap-3 items-center">
              {/* Think Toggle */}
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all font-medium group ${
                  thinkActive
                    ? "bg-blue-600/10 outline outline-blue-600/60 text-blue-950"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                title="Think"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}>
                <Lightbulb className="group-hover:fill-yellow-300 transition-all" size={18} />
                Think
              </button>
 
              {/* Deep Search Toggle */}
              <motion.button
                className={`flex items-center px-4 gap-1 py-2 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start  ${
                  deepSearchActive
                    ? "bg-blue-600/10 outline outline-blue-600/60 text-blue-950"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                title="Deep Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                initial={false}
                animate={{
                  width: deepSearchActive ? 125 : 36,
                  paddingLeft: deepSearchActive ? 8 : 9,
                }}>
                <div className="flex-1">
                  <Globe size={18} />
                </div>
                <motion.span
                  className="pb-[2px]"
                  initial={false}
                  animate={{
                    opacity: deepSearchActive ? 1 : 0,
                  }}>
                  Deep Search
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export { AIChatInput };