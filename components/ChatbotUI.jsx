import { useState, useEffect } from "react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { StartChatButton } from "@/components/ui/startchat-button";
import ModelViewer from "@/components/ui/model-viewer";
import TypingSelection from "@/components/ui/typing-selection";
import { motion, AnimatePresence } from "framer-motion";

const ChatbotUI = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBodyArea, setShowBodyArea] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [modelCentered, setModelCentered] = useState(true);
  const [hasMoved, setHasMoved] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  useEffect(() => {
    // Reset to centered state and movement flag whenever the modal closes.
    if (!show3D) {
      setModelCentered(true);
      setHasMoved(false);
    }
  }, [show3D]);
  // overlay placement can be tuned per-patient so the small cardiac icon sits over the heart
  const overlayPosition = selectedPatient === 'adult'
    ? { left: '52%', top: '38%', transform: 'translate(-50%, -50%)' }
    : { left: '50%', top: '44%', transform: 'translate(-50%, -50%)' };

  const handleStart = () => {
    setIsStarted(true);
  };

  const handlePatientSelect = (type) => {
    setSelectedPatient(type);
    // After 1.5 seconds, transition to body area selection
    setTimeout(() => {
      setShowBodyArea(true);
    }, 1500);
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setShowBodyArea(false);
    setShow3D(false);
  };

  return (
    <BackgroundPaths>
      {!isStarted ? (
        <div className="h-screen flex flex-col items-center justify-start pt-50 overflow-hidden">
          <GooeyText
            texts={["Hi", "Welcome", "to",  "Smart", "Referral", "System"]}
            morphTime={1}
            cooldownTime={0.25}
            className="font-bold text-4xl mb-25"
          />
          <div className="flex flex-col items-center gap-20">
            <p className="font-semibold text-5xl tracking-wide text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">How's your patient today?</p>
            <StartChatButton onClick={handleStart} />
          </div>
        </div>
      ) : (
        <div className="h-screen w-screen flex items-center justify-between gap-20 px-40 pr-20 overflow-hidden">
          <div className="flex items-center h-full">
            <GooeyText
              texts={["Hi", "Welcome", "to",  "Smart", "Referral", "System"]}
              morphTime={1}
              cooldownTime={0.25}
              className="font-bold text-4xl [writing-mode:vertical-lr] rotate-180"
            />
          </div>
          {/* scene 2 */}
          <div className="relative w-[1200px] h-[630px] dark-hero-background rounded-3xl transition-all duration-500 ease-in-out flex flex-col items-center justify-center pt-8">
            {!showBodyArea ? (
              <>
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ${selectedPatient ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  <p className="text-black text-5xl font-semibold pt-15">Who's your patient today?</p>
                  <div className="flex justify-center items-top w-full gap-50 mt-13 flex-1">
                    <div className="flex flex-col items-center cursor-pointer" onClick={() => handlePatientSelect('adult')}>
                      <img src="/photo/adult.png" alt="Adult" className="h-86 object-contain bg-transparent hover:scale-105 transition-transform" />
                      <p className="text-black text-3xl font-semibold mt-4">Adult</p>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer" onClick={() => handlePatientSelect('child')}>
                      <img src="/photo/child.png" alt="Child" className="h-70 object-contain bg-transparent mt-17 hover:scale-105 transition-transform" />
                      <p className="text-black text-3xl font-semibold mt-4">Child</p>
                    </div>
                  </div>
                </div>
                
                {selectedPatient && (
                  <div className="absolute inset-0 flex items-center justify-center animate-[slideToCenter_0.5s_ease-out_forwards]">
                    {/* Back button on the preview so user can undo selection immediately */}
                    <button
                      onClick={handleBack}
                      aria-label="Back"
                      className="absolute left-6 top-6 text-black bg-white/80 hover:bg-white px-3 py-1 rounded-full shadow-md z-30 transition-transform hover:scale-105"
                    >
                      &lt;
                    </button>
                    <div className="flex flex-col items-center scale-125">
                      <img 
                        src={selectedPatient === 'adult' ? "/photo/adult.png" : "/photo/child.png"} 
                        alt={selectedPatient === 'adult' ? "Adult" : "Child"} 
                        className="h-86 object-contain bg-transparent"
                      />
                      <p className="text-black text-4xl font-semibold mt-4">
                        {selectedPatient === 'adult' ? 'Adult' : 'Child'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col animate-[fadeIn_0.5s_ease-in-out]">
                {/* scene 3 - hide the underlying content when 3D modal is open */}
                {!show3D && (
                  <>
                    <div className="flex items-center gap-3 p-6">
                      <button onClick={handleBack} className="text-black text-3xl font-bold hover:scale-110 transition-transform">
                        &lt;
                      </button>
                      <p className="text-black text-2xl font-semibold">
                        {selectedPatient === 'adult' ? 'Adult' : 'Child'}
                      </p>
                    </div>
                    <div className="flex items-start justify-center -mt-6">
                      <p className="text-black text-5xl font-semibold">Choose the body area.</p>
                    </div>
                    <div className="relative flex items-center justify-center flex-1 w-full">
                      {/* Cardiac image (acts as a visual) */}
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={selectedPatient === 'adult' ? "/photo/ad cardiac.jpg" : "/photo/child cardiac.jpg"}
                          alt={selectedPatient === 'adult' ? "Adult Cardiac" : "Child Cardiac"}
                          className="h-117 object-contain"
                          aria-hidden={true}
                        />

                        {/* small cardiac icon overlay acts as the single control */}
                        <img
                          src="/photo/cardiac.jpg"
                          alt="Open 3D cardiac model"
                          className="absolute w-16 h-16 object-contain cursor-pointer z-30"
                          style={overlayPosition}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); setShow3D(true); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShow3D(true); } }}
                          aria-label="Open 3D cardiac model"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3D model overlay (animated) - rendered independently so it's not shown with the underlying content */}
                <AnimatePresence>
                  {show3D && (
                    <motion.div
                      key="cardiac-3d"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="absolute inset-0 z-40 flex items-center justify-center bg-transparent"
                    >
                      <motion.div
                        className="relative w-3/5 h-4/5 bg-transparent flex items-center justify-center rounded-lg shadow-none"
                        // allow children to overflow (frame should not be clipped) and
                        // nudge the whole overlay slightly left for visual alignment
                        style={{ overflow: 'visible', transform: 'translateX(-6%)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.32 }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setShow3D(false); }}
                          aria-label="Close 3D"
                          className="absolute top-4 right-4 z-50 bg-white/90 rounded-full px-3 py-1 shadow-md hover:scale-105 transition-transform"
                        >
                          ✕
                        </button>

                        {/* Animated model container: starts centered & enlarged, stays 2s, then moves left and scales down */}
                        <motion.div
                          className="w-full h-full flex items-center justify-center p-4"
                          initial={{ x: 0, scale: 1.35 }}
                          animate={modelCentered ? { x: 0, scale: 1.35 } : { x: '-30%', scale: 0.95 }}
                          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                          
                        >
                            <div className="heart-wrapper" style={{ width: '86%', height: '86%' }}>
                              <ModelViewer
                                src="/3d-model/stylizedhumanheart.glb"
                                alt="3D Cardiac Model"
                                cameraControls={true}
                                onUserInteract={(info) => {
                                  // Do not call preventDefault here so the webcomponent
                                  // still receives pointer drag events and can rotate.
                                  if (info && info.type === 'pointerup' && !hasMoved) {
                                    setIsMoving(true);
                                    setModelCentered(false);
                                    setHasMoved(true);
                                    setTimeout(() => setIsMoving(false), 900);
                                  }
                                }}
                              />
                            </div>
                        </motion.div>
                      </motion.div>
                      {/* Right-side selection panel (appears after model has moved) */}
                      {hasMoved && (
                        // move the panel closer (left) but keep a safe gap from the frame
                        <div
                          className="absolute top-1/2 transform -translate-y-1/2 w-96 z-50"
                          // position the panel with a comfortable 1rem gap from the frame
                          style={{ right: '1rem', boxShadow: '0 10px 30px rgba(2,6,23,0.12)' }}
                        >
                          <TypingSelection
                            className="typing-panel-dark"
                            text={"How would you describe the patient's symptoms?"}
                            options={[
                              { label: "Chest pain", severity: 'high' },
                              { label: "Shortness of breath", severity: 'medium' },
                              { label: "Palpitations", severity: 'medium' },
                              { label: "Other", severity: 'low' }
                            ]}
                            showHeader={false}
                            onSelect={(opt, i, checked) => { try { console.log('Selection chosen', opt, i, checked); } catch(_) {} }}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </BackgroundPaths>
    
  );
};

export default ChatbotUI;
