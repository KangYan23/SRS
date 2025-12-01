"use client";

import { useState, useEffect } from "react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { StartChatButton } from "@/components/ui/startchat-button";
import ModelViewer from "@/components/ui/model-viewer";
import TypingSelection from "@/components/ui/typing-selection";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { ECGLine } from "@/components/ui/ecg-line";
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
  const [allFetchedResults, setAllFetchedResults] = useState({ usually: [], maybe: [], rarely: [] });
  const [loadingResults, setLoadingResults] = useState(false);
  const [showNotAppropriate, setShowNotAppropriate] = useState(false);

  // Fetch Panels when Body Area is selected
  useEffect(() => {
    if (selectedPatient && activeBodyArea) {
      const fetchPanels = async () => {
        try {
          const res = await fetch(`/api/conditions?type=panels&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}`);
          const data = await res.json();
          if (data.success) {
            setPanels(data.data);
            setSelectedPanel(null);
            setConditions([]);
            setSelectedCondition(null);
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
          const apiUrl = `/api/conditions?type=conditions&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&panel=${selectedPanel}`;
          console.log('Fetching conditions from:', apiUrl);
          const res = await fetch(apiUrl);
          const data = await res.json();
          console.log('API Response:', data);
          if (data.success) {
            const formattedConditions = data.data
              .filter(c => c.condition && c.condition !== 'placeholder')  // Filter out placeholder
              .map(c => ({
                label: c.condition,
                severity: c.severity || 'normal'
              }));
            console.log('Formatted conditions:', formattedConditions);
            setConditions(formattedConditions);
            setSelectedCondition(null);
          } else {
            console.error('API returned error:', data);
          }
        } catch (error) {
          console.error("Failed to fetch conditions", error);
        }
      };
      fetchConditions();
    }
  }, [selectedPanel, selectedPatient, activeBodyArea]);

  useEffect(() => {
    if (!show3D) {
      setModelCentered(true);
      setHasMoved(false);
      setSelectedPanel(null);
      setSelectedCondition(null);
    } else {
      const timer = setTimeout(() => {
        setModelCentered(false);
        setHasMoved(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show3D]);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handlePatientSelect = (type) => {
    setSelectedPatient(type);
    setShowBodyArea(true);
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
        const processed = data.data.map(item => {
          let app = 'unknown';
          const lowerApp = item.appropriate ? item.appropriate.toLowerCase() : '';

          if (lowerApp.includes('not appropriate')) app = 'rarely';
          else if (lowerApp.includes('usually appropriate')) app = 'usually';
          else if (lowerApp.includes('may')) app = 'maybe';
          else if (lowerApp.includes('rarely')) app = 'rarely';

          return { ...item, appropriate: app };
        });

        const usually = processed.filter(i => i.appropriate === 'usually').slice(0, 4);
        const maybe = processed.filter(i => i.appropriate === 'maybe').slice(0, 4);
        const rarely = processed.filter(i => i.appropriate === 'rarely' || i.appropriate === 'unknown').slice(0, 4);

        setAllFetchedResults({ usually, maybe, rarely });
        setResults([...usually, ...maybe]);
        setShowNotAppropriate(false);
        setShowResults(true);
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
    setShowNotAppropriate(false);
  };

  const handleToggleNotAppropriate = () => {
    if (showNotAppropriate) {
      setResults([...allFetchedResults.usually, ...allFetchedResults.maybe]);
    } else {
      setResults([...allFetchedResults.usually, ...allFetchedResults.maybe, ...allFetchedResults.rarely]);
    }
    setShowNotAppropriate(!showNotAppropriate);
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
    <div className="min-h-screen w-full relative overflow-hidden font-sans text-black">
      {!isStarted ? (
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
              <StartChatButton onClick={handleStart} />
            </div>
          </div>
          <div className="flex-1 h-full flex items-center justify-center relative">
            <img
              src="/photo/transparenbody.png"
              alt="Medical Illustration"
              className="object-contain max-h-[90vh] w-auto"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white h-screen w-screen flex items-center justify-center overflow-hidden relative">
          <div className="relative w-full max-w-[1400px] h-full flex flex-col items-center justify-center">
            {showResults ? (
              <div className="absolute inset-0 flex flex-col p-8 animate-[fadeIn_0.5s_ease-in-out] text-black">
                <button
                  onClick={handleBackFromResults}
                  className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                >
                  &lt; Back
                </button>

                <div className="flex flex-col items-center w-full h-full mt-4">
                  <h2 className="text-5xl font-handwritten mb-12 tracking-wider">RESULTS</h2>

                  <div className="w-full flex flex-row gap-12 h-full px-12">
                    <div className="flex-1 flex flex-col relative border-l-2 border-b-2 border-black/50 p-4">
                      <div className="absolute -left-32 top-0 text-sm -rotate-90 origin-right">appropriate lvl</div>
                      <div className="flex flex-col gap-6 w-full mt-auto mb-8 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                        {results.map((item, index) => (
                          <div key={index} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-8 rounded-r-md transition-all duration-1000 ease-out ${item.appropriate === 'usually' ? 'bg-[#90EE90]' :
                                  item.appropriate === 'maybe' ? 'bg-[#FFFFE0]' :
                                    'bg-[#FFB6C1]'
                                  }`}
                                style={{ width: `${Math.max((item.score / 10) * 100, 1)}%` }}
                              ></div>
                              <span className="text-sm font-medium text-black/80 ml-2">{item.radiationString || item.score}</span>
                            </div>
                            <span className="text-sm text-black/90">{item.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between w-full text-sm font-handwritten mt-2 px-2">
                        <span>0</span>
                        <span>2</span>
                        <span>4</span>
                        <span>6</span>
                        <span>8</span>
                        <span>10</span>
                        <span className="text-xs self-end mb-1">radiation lvl</span>
                      </div>
                    </div>

                    <div className="w-1/3 flex flex-col gap-8 justify-center items-end">
                      <div className="flex flex-col gap-4 mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-[#90EE90] rounded-sm"></div>
                          <span className="text-xl font-handwritten">usually ap</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-[#FFFFE0] rounded-sm"></div>
                          <span className="text-xl font-handwritten">maybe ap</span>
                        </div>
                      </div>

                      <button
                        onClick={handleToggleNotAppropriate}
                        className={`px-6 py-3 border-2 ${showNotAppropriate ? '' : ''} border-black text-black rounded-full hover:bg-red-500/10 transition-colors font-handwritten text-xl`}
                      >
                        {showNotAppropriate ? 'hide not ap choices' : 'show not ap choices'}
                      </button>

                      <button
                        onClick={handleStartAgain}
                        className="px-6 py-3 border-2 border-black text-black rounded-full hover:bg-red-500/10 transition-colors font-handwritten text-xl"
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
              !showBodyArea ? (
                <>
                  <div className={`absolute inset-0 flex flex-col items-center justify-center bg-white transition-opacity duration-1000 ${selectedPatient ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="mb-16 h-32 w-full flex justify-center -mt-10">
                      <HandWrittenTitle
                        title="PATIENT TYPE"
                        subtitle=""
                      />
                    </div>

                    <div className="flex justify-center items-center gap-20">
                      <div
                        className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-[400px]"
                        onClick={() => handlePatientSelect('adult')}
                      >
                        <div className="bg-gray-100/80 rounded-full w-72 h-72 flex items-center justify-center mb-2 shadow-lg">
                          <img src="/photo/adult.png" alt="Adult" className="h-64 object-contain" />
                        </div>
                        <p className="text-black text-4xl font-bold tracking-wider">ADULT</p>
                        <p className="text-gray-400 text-xl font-medium mt-[-1.5rem]">(18+)</p>
                      </div>

                      <div
                        className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-[400px]"
                        onClick={() => handlePatientSelect('child')}
                      >
                        <div className="bg-gray-100/80 rounded-full w-72 h-72 flex items-center justify-center mb-2 shadow-lg">
                          <img src="/photo/child.png" alt="Child" className="h-56 object-contain mt-4" />
                        </div>
                        <p className="text-black text-4xl font-bold tracking-wider">CHILDREN</p>
                        <p className="text-gray-400 text-xl font-medium mt-[-1.5rem]">(Under 18)</p>
                      </div>
                    </div>

                    <div className="w-full -mt-10 mb-2 z-0 pointer-events-none">
                      <ECGLine className="opacity-60" />
                    </div>

                    <p className="text-gray-500 text-2xl font-medium relative z-10 -mt-12">Please select patient age group.</p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col animate-[fadeIn_0.5s_ease-in-out] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                  {!show3D && (
                    <div className="flex flex-col w-full h-full relative">
                      {/* Header */}
                      <div className="w-full flex justify-center mt-4 mb-2 h-32 shrink-0 z-10">
                        <HandWrittenTitle title="CHOOSE BODY AREA" subtitle="" />
                      </div>

                      {/* Main Content */}
                      <div className="flex flex-1 w-full max-w-[1400px] mx-auto px-12 gap-16 items-center justify-center h-full pb-8 z-10">

                        {/* Left: Body Image Card */}
                        <div className="w-[50%] h-full flex items-center justify-center relative -mt-10 overflow-hidden">
                          <button
                            onClick={handleBack}
                            className="absolute top-8 left-8 text-black text-3xl font-bold hover:scale-110 transition-transform z-20 bg-white/50 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm shadow-sm"
                            aria-label="Back"
                          >
                            &lt;
                          </button>

                          <img
                            src={selectedPatient === 'adult' ? "/photo/humanbody.png" : "/photo/humanbodychild.png"}
                            alt="Body Reference"
                            className="h-[120%] w-full object-contain scale-[1.35] relative z-0"
                          />
                        </div>

                        {/* Right: Grid Selection */}
                        <div className="w-[50%] h-full flex items-center justify-center pl-4">
                          <div className="grid grid-cols-5 gap-3 w-full">
                            {[
                              { name: 'Abdomen', action: 'abdomen' },
                              { name: 'Abdomen-Pelvis', action: 'abdomen-pelvis' },
                              { name: 'Breast', action: 'breast', model: '/3d-model/human_female_breast_anatomy.glb' },
                              { name: 'Cardiac', action: 'cardiac', model: '/3d-model/stylizedhumanheart.glb', image: '/photo/cardiac.jpg', subtitle: '(Heart)' },
                              { name: 'Cardiac-Chest', action: 'cardiac-chest' },
                              { name: 'Cardiac-Chest-Pelvis', action: 'cardiac-chest-pelvis' },
                              { name: 'Chest', action: 'chest' },
                              { name: 'Chest-Abdomen', action: 'chest-abdomen' },
                              { name: 'Chest-Abdomen-Pelvis', action: 'chest-abdomen-pelvis' },
                              { name: 'Extremities', action: 'extremities' },
                              { name: 'Head', action: 'head' },
                              { name: 'Head-Neck', action: 'head-neck' },
                              { name: 'Head-Neck-Chest-Abdomen', action: 'head-neck-chest-abdomen' },
                              { name: 'Head-Spine', action: 'head-spine' },
                              { name: 'Lower Extremity', action: 'lower extremity' },
                              { name: 'Maxface', action: 'maxface' },
                              { name: 'Neck', action: 'neck' },
                              { name: 'Neck-Chest', action: 'neck-chest' },
                              { name: 'Neck-Chest-Abdomen-Pelvis', action: 'neck-chest-abdomen-pelvis' },
                              { name: 'Pelvis', action: 'pelvis' },
                              { name: 'Spine', action: 'spine' },
                              { name: 'Spine-Pelvis', action: 'spine-pelvis' },
                              { name: 'Unspecified', action: 'unspecified' },
                              { name: 'Upper Extremity', action: 'upper extremity' }
                            ].map((item, index) => (
                              <div
                                key={index}
                                className={`aspect-square bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group hover:shadow-md hover:scale-105 hover:border-blue-400 hover:bg-blue-50/30 p-1 relative overflow-hidden ${item.action ? '' : 'opacity-100'}`}
                                onClick={(e) => {
                                  if (item.action) {
                                    e.stopPropagation();
                                    // Set model if provided, otherwise null
                                    setSelectedModelSrc(item.model || null);
                                    setActiveBodyArea(item.action);
                                    setShow3D(true);
                                  }
                                }}
                              >
                                {/* Clinical Accent - Static for all */}
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />

                                {item.image ? (
                                  <>
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform mix-blend-multiply" />
                                    <div className="flex flex-col items-center leading-tight z-10">
                                      <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">{item.name}</span>
                                      {item.subtitle && <span className="font-medium text-[10px] text-slate-500">{item.subtitle}</span>}
                                    </div>
                                  </>
                                ) : (
                                  <span className="font-bold text-sm text-slate-700 text-center uppercase break-words px-1 tracking-tight group-hover:text-slate-900">{item.name}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                          style={{ overflow: 'visible', transform: 'translateX(-6%)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.32 }}
                        >
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShow3D(false);
                              setActiveBodyArea(null);
                              setSelectedPanel(null);
                              setSelectedCondition(null);
                              setPanels([]);
                              setConditions([]);
                            }}
                            aria-label="Back to Body Area Selection"
                            className="absolute top-4 left-4 z-50 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 bg-white/90 rounded-full px-4 py-2 shadow-md"
                          >
                            &lt; Back
                          </button>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); setShow3D(false); }}
                            aria-label="Close 3D"
                            className="absolute top-4 right-4 z-50 bg-white/90 rounded-full px-3 py-1 shadow-md hover:scale-105 transition-transform"
                          >
                            ✕
                          </button>

                          <motion.div
                            className="w-full h-full flex items-center justify-center p-4"
                            initial={{ x: 0, scale: 1.35 }}
                            animate={modelCentered ? { x: 0, scale: 1.35 } : { x: '-30%', scale: 0.95 }}
                            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                          >
                            <div className="heart-wrapper" style={{ width: '86%', height: '86%' }}>
                              {selectedModelSrc ? (
                                <ModelViewer
                                  src={selectedModelSrc}
                                  alt="3D Model"
                                  cameraControls={true}
                                  onUserInteract={(info) => {
                                    if (info && info.type === 'pointerup' && !hasMoved) {
                                      setIsMoving(true);
                                      setModelCentered(false);
                                      setHasMoved(true);
                                      setTimeout(() => setIsMoving(false), 900);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {/* Placeholder or empty state when no model is available */}
                                  <div className="text-gray-400 font-medium text-lg bg-white/50 px-6 py-4 rounded-xl backdrop-blur-sm border border-white/60 shadow-sm">
                                    Select options from the panel
                                  </div>
                                  {/* Auto-trigger move to side effect if no model to interact with? 
                                      Actually, if there is no model, the user can't "interact" to trigger the move.
                                      We should probably auto-trigger the move or show the panel immediately.
                                  */}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                        {hasMoved && (
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 w-96 z-50 flex flex-col gap-4"
                            style={{ right: '1rem', boxShadow: 'none' }}
                          >
                            <TypingSelection
                              className="premium-glass-panel"
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
                                className="premium-glass-panel mt-4"
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
          </div >
        </div >
      )}
    </div >
  );
};

export default ChatbotUI;
