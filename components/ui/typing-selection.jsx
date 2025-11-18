"use client";
import React, { useState, useEffect } from "react";
import { TypingAnimation } from "./typing-animation";

export function TypingSelection({
  text = "3d heart model test test",
  options = ["test", "maybe", "test1", "test2", "test3"],
  onSelect = () => {},
  className = "",
  showHeader = true,
}) {
  const [selected, setSelected] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  // If the parent hides the header (typing animation), immediately show options
  useEffect(() => {
    if (!showHeader) {
      setShowOptions(true);
    }
  }, [showHeader]);

  function handleSelect(i) {
    setSelected(i);
    try { onSelect(options[i], i); } catch (e) {}
  }

  return (
    <div className={className}>
      {showHeader && (
        <TypingAnimation text={text} className="mb-4" onComplete={() => setShowOptions(true)} />
      )}

      <div className="flex flex-col gap-2">
        {showOptions && options.map((opt, i) => (
          <button
            key={opt + i}
            type="button"
            onClick={() => handleSelect(i)}
            className={`w-full text-left px-4 py-2 rounded-md transition ${selected === i ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
            aria-pressed={selected === i}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TypingSelection;
