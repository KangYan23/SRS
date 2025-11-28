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
  const [selectedModelSrc, setSelectedModelSrc] = useState("/3d-model/stylizedhumanheart.glb");
  const [activeBodyArea, setActiveBodyArea] = useState(null);
  const [modelCentered, setModelCentered] = useState(true);
  const [hasMoved, setHasMoved] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [panels, setPanels] = useState([]);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [showScenarioSelection, setShowScenarioSelection] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [allProcedures, setAllProcedures] = useState([]);
  const [showNotAppropriate, setShowNotAppropriate] = useState(false);

  // Fetch Panels when Body Area is selected
  useEffect(() => {
    if (selectedPatient && activeBodyArea) {
      const fetchPanels = async () => {
        try {
          // Use type=panels to fetch unique panels
          const res = await fetch(`/api/conditions?type=panels&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}`);
          const data = await res.json();
          if (data.success) {
            setPanels(data.data);
            setSelectedPanel(null); // Reset panel selection
            setConditions([]); // Reset conditions
            setSelectedCondition(null); // Reset condition selection
          }
        } catch (error) {
          console.error("Failed to fetch panels", error);
        }
      };
      fetchPanels();
    }
  }, [selectedPatient, activeBodyArea]);

  // Fetch Conditions when Panel is selected
  useEffect(() => {
    if (selectedPanel) {
      const fetchConditions = async () => {
        try {
          // Use type=conditions and pass the selected panel
          const res = await fetch(`/api/conditions?type=conditions&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&panel=${selectedPanel}`);
          const data = await res.json();
          if (data.success) {
            // Map the response to the format expected by TypingSelection { label, severity }
            // The API returns { condition: "...", severity: "..." }
            const formattedConditions = data.data.map(c => ({
              label: c.condition,
              severity: c.severity || 'normal' // Default to normal if severity is missing
            }));
            setConditions(formattedConditions);
            setSelectedCondition(null); // Reset condition when panel changes
          }
        } catch (error) {
          console.error("Failed to fetch conditions", error);
        }
      };
      fetchConditions();
    }
  }, [selectedPanel, selectedPatient, activeBodyArea]);

  useEffect(() => {
    // Reset to centered state and movement flag whenever the modal closes.
    if (!show3D) {
      setModelCentered(true);
      setHasMoved(false);
      setSelectedPanel(null);
      setSelectedCondition(null);
    } else {
      // Auto-move the model to the left after a short delay to reveal the panel selection
      const timer = setTimeout(() => {
        setModelCentered(false);
        setHasMoved(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show3D]);

  // overlay placement can be tuned per-patient so the small cardiac icon sits over the heart
  const overlayPosition = selectedPatient === 'adult'
    ? { left: '52%', top: '38%', transform: 'translate(-50%, -50%)' }
    : { left: '50%', top: '44%', transform: 'translate(-50%, -50%)' };

  // place the breast control to the right side of the image area so it doesn't overlap
  const overlayPositionBreast = selectedPatient === 'adult'
    ? { right: '12%', top: '48%', transform: 'translateY(-50%)' }
    : { right: '10%', top: '50%', transform: 'translateY(-50%)' };

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
    setSelectedPanel(null);
    setSelectedCondition(null);
  };

  const handleNext = async () => {
    if (selectedCondition) {
      try {
        const res = await fetch(`/api/conditions?type=scenarios&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&panel=${selectedPanel}&condition=${encodeURIComponent(selectedCondition)}`);
        const data = await res.json();
        if (data.success) {
          setScenarios(data.data);
          setShowScenarioSelection(true);
        }
      } catch (error) {
        console.error("Failed to fetch scenarios", error);
      }
    }
  };
  const handleScenarioSelect = async (scenario) => {
    setSelectedScenario(scenario);
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/conditions?type=results&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&scenarioId=${encodeURIComponent(scenario.scenario_id)}`);
      const data = await res.json();
      if (data.success) {
        // Filter and process results
        // Map DB values to UI categories
        const processed = data.data.map(item => {
          let app = 'unknown';
          const lowerApp = item.appropriate ? item.appropriate.toLowerCase() : '';
          if (lowerApp.includes('usually appropriate')) app = 'usually';
          else if (lowerApp.includes('may')) app = 'maybe';
          else if (lowerApp.includes('not appropriate')) app = 'not';

          return { ...item, appropriate: app };
        });

        // Store all procedures
        setAllProcedures(processed);

        const usually = processed.filter(i => i.appropriate === 'usually').slice(0, 4);
        const maybe = processed.filter(i => i.appropriate === 'maybe').slice(0, 4);

        // Combine them for the chart
        setResults([...usually, ...maybe]);
        setShowResults(true);
        setShowNotAppropriate(false);
      }
    } catch (error) {
      console.error("Failed to fetch results", error);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleBackFromScenario = () => {
    setShowScenarioSelection(false);
    setScenarios([]);
  };

  const handleBackFromResults = () => {
    setShowResults(false);
    setSelectedScenario(null);
    setResults([]);
    setAllProcedures([]);
    setShowNotAppropriate(false);
  };

  const handleToggleNotAppropriate = () => {
    if (!showNotAppropriate) {
      // Add "Usually not appropriate" procedures to existing results
      const usually = allProcedures.filter(i => i.appropriate === 'usually').slice(0, 4);
      const maybe = allProcedures.filter(i => i.appropriate === 'maybe').slice(0, 4);
      const notAppropriate = allProcedures.filter(i => i.appropriate === 'not').slice(0, 4);
      setResults([...usually, ...maybe, ...notAppropriate]);
      setShowNotAppropriate(true);
    } else {
      // Remove "Usually not appropriate" procedures, show only appropriate ones
      const usually = allProcedures.filter(i => i.appropriate === 'usually').slice(0, 4);
      const maybe = allProcedures.filter(i => i.appropriate === 'maybe').slice(0, 4);
      setResults([...usually, ...maybe]);
      setShowNotAppropriate(false);
    }
  };

  const handleStartAgain = () => {
    setIsStarted(false);
    setSelectedPatient(null);
    setShowBodyArea(false);
    setShow3D(false);
    setActiveBodyArea(null);
    setPanels([]);
    setSelectedPanel(null);
    setConditions([]);
    setSelectedCondition(null);
    setScenarios([]);
    setShowScenarioSelection(false);
    setShowResults(false);
    setSelectedScenario(null);
  };

  return (
    <BackgroundPaths>
      {!isStarted ? (
        <div className="h-screen flex flex-col items-center justify-start pt-50 overflow-hidden">
          <GooeyText
            texts={["Hi", "Welcome", "to", "Smart", "Referral", "System"]}
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
              texts={["Hi", "Welcome", "to", "Smart", "Referral", "System"]}
              morphTime={1}
              cooldownTime={0.25}
              className="font-bold text-4xl [writing-mode:vertical-lr] rotate-180"
            />
          </div>

          {/* Main Content Area */}
          <div className="relative w-[1200px] h-[630px] dark-hero-background rounded-3xl transition-all duration-500 ease-in-out flex flex-col items-center justify-center pt-8">

            {/* Results View */}
            {showResults ? (
              <div className="absolute inset-0 flex flex-col p-8 animate-[fadeIn_0.5s_ease-in-out] bg-black/90 rounded-3xl text-white">
                <button
                  onClick={handleBackFromResults}
                  className="absolute left-8 top-8 text-white text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                >
                  &lt; Back
                </button>

                <div className="flex flex-col items-center w-full h-full mt-4">
                  <h2 className="text-5xl font-handwritten mb-12 tracking-wider">RESULTS</h2>

                  <div className="w-full flex flex-row gap-12 h-full px-12">
                    {/* Chart Area */}
                    <div className="flex-1 flex flex-col relative border-l-2 border-b-2 border-white/50 p-4">
                      {/* Y-axis label */}
                      <div className="absolute -left-32 top-0 text-sm -rotate-90 origin-right">appropriate lvl</div>

                      {/* Bars */}
                      <div className="flex flex-col gap-6 w-full mt-auto mb-8 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                        {results.map((item, index) => {
                          // Calculate width with minimum of 3% for visibility
                          const widthPercent = Math.max(3, (item.score / 10) * 100);

                          return (
                            <div key={index} className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-8 rounded-r-md transition-all duration-1000 ease-out ${item.appropriate === 'usually' ? 'bg-[#90EE90]' :
                                      item.appropriate === 'maybe' ? 'bg-[#FFFFE0]' :
                                        'bg-[#FF6B6B]'
                                    }`}
                                  style={{ width: `${widthPercent}%` }}
                                ></div>
                                <span className="text-xs text-white/70">...</span>
                              </div>
                              <span className="text-sm text-white/90">{item.name}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-axis */}
                      <div className="flex justify-between w-full text-lg font-handwritten mt-2 px-2">
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span className="text-xs self-end mb-1">radiation lvl</span>
                      </div>
                    </div>

                    {/* Legend and Buttons */}
                    <div className="w-1/3 flex flex-col gap-8 justify-center items-end">
                      <div className="flex flex-col gap-4 mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-[#90EE90] rounded-sm"></div>
                          <span className="text-xl font-handwritten">USUALLY AP</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-[#FFFFE0] rounded-sm"></div>
                          <span className="text-xl font-handwritten">MAYBE AP</span>
                        </div>
                        {showNotAppropriate && (
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-[#FF6B6B] rounded-sm"></div>
                            <span className="text-xl font-handwritten">NOT AP</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleToggleNotAppropriate}
                        className="px-6 py-3 border-2 border-red-500/80 text-white rounded-full hover:bg-red-500/20 transition-colors font-handwritten text-xl"
                      >
                        {showNotAppropriate ? 'show ap choices' : 'show not ap choices'}
                      </button>

                      <button
                        onClick={handleStartAgain}
                        className="px-6 py-3 border-2 border-red-500/80 text-white rounded-full hover:bg-red-500/20 transition-colors font-handwritten text-xl"
                      >
                        start again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : showScenarioSelection ? (
              <div className="absolute inset-0 flex flex-col p-8 animate-[fadeIn_0.5s_ease-in-out]">
                <button
                  onClick={handleBackFromScenario}
                  className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                >
                  &lt; Back
                </button>

                <div className="flex flex-col items-center w-full h-full mt-4">
                  <h2 className="text-4xl font-bold text-black mb-8">Choose your scenario</h2>

                  <div className="flex w-full gap-8 h-full">
                    {/* Left side: Visual (Circle/Model placeholder as per sketch) */}
                    <div className="w-1/3 flex items-center justify-center">
                      <div className="w-64 h-64 rounded-full bg-gray-200/50 border-2 border-white/50 flex items-center justify-center overflow-hidden relative">
                        <ModelViewer
                          src={selectedModelSrc}
                          alt="3D Cardiac Model"
                          cameraControls={true}
                          disableZoom={true}
                        />
                      </div>
                    </div>

                    {/* Right side: Scenario Table */}
                    <div className="w-2/3 overflow-y-auto pr-4 custom-scrollbar">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-black/10">
                            <th className="text-left p-4 text-xl font-semibold text-black/70 w-24">no.</th>
                            <th className="text-left p-4 text-xl font-semibold text-black/70">scenario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scenarios.map((scenario, index) => (
                            <tr
                              key={scenario._id || index}
                              className="border-b border-black/5 hover:bg-white/40 transition-colors cursor-pointer"
                              onClick={() => handleScenarioSelect(scenario)}
                            >
                              <td className="p-4 text-lg font-medium text-black/80">{scenario.scenario_id}</td>
                              <td className="p-4 text-lg text-black/80">{scenario.scenario_description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Existing Views (Patient Selection or Body/Panel/Condition)
              !showBodyArea ? (
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
                            onClick={(e) => { e.stopPropagation(); setSelectedModelSrc('/3d-model/stylizedhumanheart.glb'); setActiveBodyArea('cardiac'); setShow3D(true); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedModelSrc('/3d-model/stylizedhumanheart.glb'); setActiveBodyArea('cardiac'); setShow3D(true); } }}
                            aria-label="Open 3D cardiac model"
                          />

                          {/* Breast control: opens the female breast anatomy model */}
                          <button
                            className="absolute w-20 h-10 flex items-center justify-center rounded-md bg-white/95 shadow-md cursor-pointer z-30"
                            style={overlayPositionBreast}
                            onClick={(e) => { e.stopPropagation(); setSelectedModelSrc('/3d-model/human_female_breast_anatomy.glb'); setActiveBodyArea('breast'); setShow3D(true); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedModelSrc('/3d-model/human_female_breast_anatomy.glb'); setActiveBodyArea('breast'); setShow3D(true); } }}
                            aria-label="Open 3D breast anatomy model"
                          >
                            <span className="text-sm font-semibold text-slate-800">Breast</span>
                          </button>
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
                                src={selectedModelSrc}
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
                            className="absolute top-1/2 transform -translate-y-1/2 w-96 z-50 flex flex-col gap-4"
                            // position the panel with a comfortable 1rem gap from the frame
                            style={{ right: '1rem', boxShadow: 'none' }}
                          >
                            <TypingSelection
                              className="typing-panel-dark"
                              text={"Choose the panel"}
                              options={panels.map(p => ({ label: p }))}
                              showHeader={true}
                              onSelect={(opt) => {
                                const val = typeof opt === 'string' ? opt : opt.label;
                                setSelectedPanel(val);
                              }}
                            />

                            {selectedPanel && (
                              <TypingSelection
                                className="typing-panel-dark mt-4"
                                text={"Choose the condition"}
                                options={conditions}
                                showHeader={true}
                                onSelect={(opt) => {
                                  const val = typeof opt === 'string' ? opt : opt.label;
                                  setSelectedCondition(val);
                                }}
                              />
                            )}

                            {selectedCondition && (
                              <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                                onClick={handleNext}
                              >
                                Next
                              </motion.button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </BackgroundPaths>
  );
};

export default ChatbotUI;
