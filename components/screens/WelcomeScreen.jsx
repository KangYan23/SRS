import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GooeyText } from "../ui/gooey-text-morphing";
import { StartChatButton } from "../ui/startchat-button";

export default function WelcomeScreen({ onStart }) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // mobile breakpoint
    };

    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop view
  const renderDesktop = () => (
    <div className="bg-[#fafafa] h-screen w-full flex items-center justify-between px-20">
      <div className="flex flex-col items-start gap-6 z-10 max-w-4xl">
        <div className="flex flex-col items-start w-full -space-y-6 mb-2">
          <motion.div
            animate={{
              scale: [1, 1.1, 1.1, 1.1, 1, 1],
              opacity: [0.8, 1, 1, 1, 0.8, 0.8]
            }}
            transition={{
              duration: 9,
              times: [0, 0.11, 0.22, 0.78, 0.89, 1],
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="origin-left"
          >
            <GooeyText
              texts={["WELCOME", "WELCOME", "WELCOME"]}
              morphTime={3}
              cooldownTime={1}
              blurAmount={10}
              alignment="left"
              className="font-bold h-36 w-full"
              textClassName="text-7xl md:text-8xl text-black tracking-tighter"
            />
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1, 1.1, 1.1, 1.1, 1],
              opacity: [0.8, 0.8, 1, 1, 1, 0.8]
            }}
            transition={{
              duration: 9,
              times: [0, 0.11, 0.22, 0.78, 0.89, 1],
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="origin-left"
          >
            <GooeyText
              texts={["CLINICIAN", "CLINICIAN", "CLINICIAN"]}
              morphTime={3}
              cooldownTime={1}
              blurAmount={10}
              alignment="left"
              className="font-bold h-36 w-full"
              textClassName="text-7xl md:text-8xl text-black tracking-tighter"
            />
          </motion.div>
        </div>
        <div className="flex flex-col items-center w-full gap-8">
          <p className="font-semibold text-4xl tracking-wide text-black text-center leading-tight">
            How's your patient today?
          </p>
          <StartChatButton onClick={onStart} />
        </div>
      </div>
      <div className="flex-1 h-full flex items-center justify-center relative">
        <img
          src="/photo/transparenbody.png"
          alt="Medical Illustration"
          className="object-contain max-h-[90vh] w-auto"
          loading="lazy"
        />
      </div>
    </div>
  );

  // Mobile view - optimized for all screen sizes
  const renderMobile = () => (
    <div 
      className="bg-white h-screen w-full flex flex-col items-center justify-between px-4 py-6 safe-area overflow-hidden"
      style={{
        background: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #4180de 100%)",
      }}
    >
      {/* Text on top - responsive sizing */}
      <div className="flex flex-col items-center w-full gap-0 pt-2">
        <motion.div className="w-full" animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 9, repeat: Infinity }}>
          <GooeyText
            texts={["WELCOME"]}
            morphTime={3}
            cooldownTime={1}
            blurAmount={10}
            alignment="center"
            className="font-bold h-16 sm:h-20 w-full overflow-visible"
            textClassName="text-3xl sm:text-4xl md:text-5xl text-black tracking-tighter text-center"
          />
        </motion.div>
        <motion.div className="w-full" animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 9, repeat: Infinity }}>
          <GooeyText
            texts={["CLINICIAN"]}
            morphTime={3}
            cooldownTime={1}
            blurAmount={10}
            alignment="center"
            className="font-bold h-16 sm:h-20 w-full overflow-visible"
            textClassName="text-3xl sm:text-4xl md:text-5xl text-black tracking-tighter text-center"
          />
        </motion.div>
      </div>

      {/* Image in middle - responsive sizing */}
      <div className="flex justify-center flex-1 w-full max-w-xs">
        <img
          src="/photo/transparenbody.png"
          alt="Medical Illustration"
          className="object-contain w-full h-auto max-h-[30vh] sm:max-h-[35vh]"
          loading="lazy"
        />
      </div>

      {/* Paragraph + button at bottom */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full pb-4">
        <p className="font-semibold text-base sm:text-lg md:text-2xl text-black text-center leading-tight px-2">
          How's your patient today?
        </p>
        <div className="w-full max-w-xs px-2">
          <StartChatButton onClick={onStart} />
        </div>
      </div>
    </div>
  );

  // Conditional rendering
  return isMobile ? renderMobile() : renderDesktop();
}
