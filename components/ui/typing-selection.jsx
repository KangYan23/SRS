"use client";
import React, { useState, useId } from "react";

export function TypingSelection({
  text = "",
  // options can be strings or objects: { label: 'Chest pain', severity: 'high' }
  options = [],
  onSelect = () => {},
  className = "",
  showHeader = true,
}) {
  // single selected index (only one may be selected at a time)
  const [selectedIndex, setSelectedIndex] = useState(null);
  const id = useId ? useId() : String(Math.random()).slice(2);
  const groupName = `typing-selection-${id}`;
  const showOptions = !showHeader;

  function selectOption(i) {
    // Enforce single selection: selecting an option always selects it (no uncheck)
    if (selectedIndex === i) return; // already selected
    setSelectedIndex(i);
    try { onSelect(options[i], i, true); } catch (e) {}
  }

  const renderLabel = (opt) => (typeof opt === 'string' ? opt : (opt && opt.label) || '');
  const severityOf = (opt) => (opt && opt.severity) || 'normal';

  return (
    <div className={`${className} glass-card`}>
      {showHeader && (
        <p className="card-title">{text}</p>
      )}

      <div className="flex flex-col gap-3">
        {showOptions && options.map((opt, i) => {
          const selected = selectedIndex === i;
          const severity = severityOf(opt);
          const neonClass = selected && severity === 'high' ? 'neon-selected-red' : (selected ? 'neon-selected-blue' : '');
          return (
            <div key={i} className={`symptom-card ${neonClass} ${selected ? 'selected' : ''}`}>
              <input
                id={`ts-${id}-${i}`}
                type="radio"
                name={groupName}
                checked={selected}
                onChange={() => selectOption(i)}
                aria-label={renderLabel(opt)}
                style={{ display: 'none' }}
              />

              <label htmlFor={`ts-${id}-${i}`} className="symptom-label" tabIndex={0}>
                <div className="flex items-center gap-3">
                  <span className="option-dot" aria-hidden="true" />
                  <div className="label-text">{renderLabel(opt)}</div>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TypingSelection;
