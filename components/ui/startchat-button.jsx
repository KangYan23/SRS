export function StartChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-12 py-4 text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl active:scale-95"
    >
      Start
    </button>
  );
}
