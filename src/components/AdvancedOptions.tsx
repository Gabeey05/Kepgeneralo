import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AdvancedOptionsProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  safetyTolerance: number;
  onSafetyToleranceChange: (value: number) => void;
  style?: string;
  onStyleChange?: (style: string) => void;
  seed?: number;
  onSeedChange?: (seed: number | undefined) => void;
  mode?: 'create' | 'edit';
  promptStrength?: number;
  onPromptStrengthChange?: (value: number) => void;
  guidanceScale?: number;
  onGuidanceScaleChange?: (value: number) => void;
  inferenceSteps?: number;
  onInferenceStepsChange?: (value: number) => void;
  negativePrompt?: string;
  onNegativePromptChange?: (value: string) => void;
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
  mode = 'create',
  promptStrength = 0.8,
  onPromptStrengthChange,
  guidanceScale = 7.5,
  onGuidanceScaleChange,
  inferenceSteps = 50,
  onInferenceStepsChange,
  negativePrompt = '',
  onNegativePromptChange,
}: AdvancedOptionsProps) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-2">
      <div className={`space-y-4 p-4 ${isDark ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white/40 border-gray-300'} border rounded-xl backdrop-blur-sm`}>
          {mode === 'create' && (
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
                {t('stylePreset')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onStyleChange?.(s.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      style === s.value
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : isDark ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-gray-700/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
                {t('aspectRatio')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => onAspectRatioChange(ratio.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      aspectRatio === ratio.value
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : isDark ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-gray-700/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'edit' && (
            <>
              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
                  {t('promptStrength')}: {promptStrength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={promptStrength}
                  onChange={(e) => onPromptStrengthChange?.(Number(e.target.value))}
                  className={`w-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-300'} rounded-lg appearance-none cursor-pointer accent-cyan-500`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
                  {t('guidanceScale')}: {guidanceScale.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={guidanceScale}
                  onChange={(e) => onGuidanceScaleChange?.(Number(e.target.value))}
                  className={`w-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-300'} rounded-lg appearance-none cursor-pointer accent-cyan-500`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
                  {t('inferenceSteps')}: {inferenceSteps}
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={inferenceSteps}
                  onChange={(e) => onInferenceStepsChange?.(Number(e.target.value))}
                  className={`w-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-300'} rounded-lg appearance-none cursor-pointer accent-cyan-500`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
                  {t('negativePrompt')}
                </label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => onNegativePromptChange?.(e.target.value)}
                  placeholder={t('negativePromptPlaceholder')}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none h-20`}
                />
              </div>
            </>
          )}

          <div>
            <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
              {t('seed')}
            </label>
            <input
              type="number"
              value={seed ?? ''}
              onChange={(e) => onSeedChange?.(e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('seedPlaceholder')}
              className={`w-full px-3 py-2 ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all`}
            />
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>{t('leaveEmptyRandom')}</p>
          </div>

          <div>
            <label className={`block text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wide`}>
              {t('safetyTolerance')}: {safetyTolerance}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={safetyTolerance}
              onChange={(e) => onSafetyToleranceChange(Number(e.target.value))}
              className={`w-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-300'} rounded-lg appearance-none cursor-pointer accent-cyan-500`}
            />
            <div className={`flex justify-between text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
              <span>{t('strict')}</span>
              <span>{t('moderate')}</span>
              <span>{t('relaxed')}</span>
            </div>
          </div>
        </div>
    </div>
  );
};
