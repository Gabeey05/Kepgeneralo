import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface AdvancedOptionsProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  safetyTolerance: number;
  onSafetyToleranceChange: (value: number) => void;
}

const ASPECT_RATIOS = [
  { label: 'Square', value: '1:1' },
  { label: 'Landscape', value: '16:9' },
  { label: 'Portrait', value: '9:16' },
  { label: 'Classic', value: '3:2' },
];

export const AdvancedOptions = ({
  aspectRatio,
  onAspectRatioChange,
  safetyTolerance,
  onSafetyToleranceChange,
}: AdvancedOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/60 border border-gray-600 rounded-xl hover:bg-gray-900/80 transition-colors"
      >
        <span className="text-sm font-medium text-gray-300">
          Advanced Options
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="space-y-4 p-4 bg-gray-900/40 border border-gray-700/50 rounded-xl backdrop-blur-sm animate-slideDown">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => onAspectRatioChange(ratio.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspectRatio === ratio.value
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-gray-700/50'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Safety Tolerance: {safetyTolerance}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={safetyTolerance}
              onChange={(e) => onSafetyToleranceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Strict</span>
              <span>Moderate</span>
              <span>Relaxed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
