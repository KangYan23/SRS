import { useState, useEffect } from "react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { StartChatButton } from "@/components/ui/startchat-button";

const ChatbotUI = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBodyArea, setShowBodyArea] = useState(false);

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
          <div className="relative w-[1200px] h-[630px] bg-gray-300 bg-opacity-80 rounded-3xl shadow-2xl transition-all duration-500 ease-in-out flex flex-col items-center justify-center pt-8">
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
                <div className="flex items-center gap-3 p-6">
                  <button onClick={handleBack} className="text-black text-3xl font-bold hover:scale-110 transition-transform">
                    &lt;
                  </button>
                  <p className="text-black text-2xl font-semibold">
                    {selectedPatient === 'adult' ? 'Adult' : 'Child'}
                  </p>
                </div>
                {/* scene 3 */} 
                <div className="flex items-start justify-center -mt-6">
                  <p className="text-black text-5xl font-semibold">Choose the body area.</p>
                </div>
                <div className="relative flex items-center justify-center flex-1 w-full">
                  <img 
                    src={selectedPatient === 'adult' ? "/photo/ad cardiac.jpg" : "/photo/child cardiac.jpg"} 
                    alt={selectedPatient === 'adult' ? "Adult Cardiac" : "Child Cardiac"} 
                    className="h-117 object-contain" 
                  />
                  <button className="absolute right-90 -mt-45 px-4 py-2 bg-gray-300 border-2 border-gray-700 text-black font-semibold text-sm rounded-full hover:bg-gray-400 transition-colors">
                    Cardiac
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </BackgroundPaths>
    
  );
};

export default ChatbotUI;
