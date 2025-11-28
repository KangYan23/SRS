export function StartChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-12 py-4 text-2xl font-bold text-white bg-black rounded-full hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl active:scale-95"
    >
      Start
    </button>
  );
}
