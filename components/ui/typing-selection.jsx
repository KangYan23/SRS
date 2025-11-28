"use client";
import React, { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function TypingSelection({
  text = "",
  // options can be strings or objects: { label: 'Chest pain', severity: 'high' }
  options = [],
  onSelect = () => { },
  className = "",
  showHeader = true,
}) {
  // single selected index (only one may be selected at a time)
  const [selectedIndex, setSelectedIndex] = useState(null);
  const id = useId ? useId() : String(Math.random()).slice(2);
  const groupName = `typing-selection-${id}`;
  const showOptions = true;

  function selectOption(i) {
    // Enforce single selection: selecting an option always selects it (no uncheck)
    if (selectedIndex === i) return; // already selected
    setSelectedIndex(i);
    try { onSelect(options[i], i, true); } catch (e) { }
  }

  const renderLabel = (opt) => (typeof opt === 'string' ? opt : (opt && opt.label) || '');

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {showHeader && (
        <motion.p
          className="card-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {showOptions && options.map((opt, i) => {
            const selected = selectedIndex === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (i * 0.05), duration: 0.3 }}
                className={`premium-option-card ${selected ? 'selected' : ''}`}
                onClick={() => selectOption(i)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  id={`ts-${id}-${i}`}
                  type="radio"
                  name={groupName}
                  checked={selected}
                  onChange={() => selectOption(i)}
                  aria-label={renderLabel(opt)}
                  style={{ display: 'none' }}
                />

                <label htmlFor={`ts-${id}-${i}`} className="symptom-label" tabIndex={0} style={{ cursor: 'pointer', width: '100%' }}>
                  <div className="flex items-center gap-3">
                    <motion.span
                      className="option-dot"
                      aria-hidden="true"
                      animate={selected ? { scale: 1.2, backgroundColor: "#38bdf8" } : { scale: 1, backgroundColor: "#94a3b8" }}
                    />
                    <div className="label-text">{renderLabel(opt)}</div>
                  </div>
                </label>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default TypingSelection;
