import { HandWrittenTitle } from "../ui/hand-writing-text";

export default function PatientSelection({ onPatientSelect, onBack }) {
  return (
    <div 
      className="flex flex-col items-center w-full h-screen pt-8 md:pt-13 relative"
      style={{
        background: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #4180de 100%)",
      }}
    >

      <div className="flex flex-col justify-center pb-8 sm:pb-18 px-4">
        {/* <HandWrittenTitle
          title="PATIENT TYPE"
          subtitle="Please select patient age group."
        /> */}
        <div className="flex items-center md:gap-4 flex-row pt-8 sm:pt-15 gap-2">
          <button
            onClick={onBack}
            className="text-black text-lg sm:text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20 pr-2 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            &lt;
          </button>
          <h1 className="font-extrabold text-2xl sm:text-3xl md:text-4xl">PATIENT TYPE</h1>
        </div>
        <div className="flex items-center flex-col mt-2">
          <p className="text-sm sm:text-base text-center">Please select patient age group.</p>
        </div>
      </div>

      <div className="flex items-center flex-col md:gap-20 md:flex-row md:mt-12 gap-6 sm:gap-8 w-full px-4">
        {/* Adult Selection */}
        <div
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 flex-1 max-w-xs sm:max-w-sm group touch-target"
          onClick={() => onPatientSelect('adult')}
        >
          <div className="bg-gray-100/80 rounded-full w-32 h-32 sm:w-40 sm:h-40 md:w-60 md:h-60 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all">
            <img src="/photo/adult.png" alt="Adult" className="object-contain w-full h-full" loading="lazy" />
          </div>
          <p className="text-black text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider group-hover:text-blue-800 transition-colors text-center">ADULT</p>
          <p className="text-gray-400 text-sm sm:text-base md:text-xl font-medium group-hover:text-blue-800 transition-colors text-center">(18 and above)</p>
        </div>

        {/* Child Selection */}
        <div
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 flex-1 max-w-xs sm:max-w-sm group touch-target"
          onClick={() => onPatientSelect('child')}
        >
          <div className="bg-gray-100/80 rounded-full w-32 h-32 sm:w-40 sm:h-40 md:w-60 md:h-60 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all">
            <img src="/photo/child.png" alt="Pediatric" className="object-contain w-full h-full" loading="lazy" />
          </div>
          <p className="text-black text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider group-hover:text-blue-800 transition-colors text-center">PEDIATRIC</p>
          <p className="text-gray-400 text-sm sm:text-base md:text-xl font-medium group-hover:text-blue-800 transition-colors text-center">(Under 18)</p>
        </div>
      </div>
    </div>
  );
}
