import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface AdvancedOptionsProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  safetyTolerance: number;
  onSafetyToleranceChange: (value: number) => void;
  style?: string;
  onStyleChange?: (style: string) => void;
  seed?: number;
  onSeedChange?: (seed: number | undefined) => void;
}

const ASPECT_RATIOS = [
  { label: 'Square', value: '1:1' },
  { label: 'Landscape', value: '16:9' },
  { label: 'Portrait', value: '9:16' },
  { label: 'Classic', value: '3:2' },
];

const STYLES = [
  { label: 'Cinematic', value: 'cinematic', keyword: ', dramatic lighting, cinematic composition, movie still, 8k' },
  { label: 'Anime', value: 'anime', keyword: ', anime style, vibrant colors, detailed illustration, cel shading' },
  { label: '3D Model', value: '3d', keyword: ', 3D rendered, professional 3D model, studio lighting, detailed' },
  { label: 'Digital Art', value: 'digital', keyword: ', digital art, artistic style, hand painted, vibrant' },
  { label: 'Photographic', value: 'photo', keyword: ', professional photography, realistic, high quality, detailed' },
];

export const AdvancedOptions = ({
  aspectRatio,
  onAspectRatioChange,
  safetyTolerance,
  onSafetyToleranceChange,
  style,
  onStyleChange,
  seed,
  onSeedChange,
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
              Style Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onStyleChange?.(s.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    style === s.value
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-gray-700/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

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
              Seed (Optional)
            </label>
            <input
              type="number"
              value={seed ?? ''}
              onChange={(e) => onSeedChange?.(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Enter a number for reproducible results"
              className="w-full px-3 py-2 bg-gray-950/80 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">Leave empty for random results</p>
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
