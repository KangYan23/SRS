export function StartChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-6 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-white bg-black rounded-full hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl active:scale-95 min-h-[48px] touch-target"
    >
      Start
    </button>
  );
}
