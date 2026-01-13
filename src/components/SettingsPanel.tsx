import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Moon, Sun, LogOut, Settings } from 'lucide-react';

export const SettingsPanel = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { signOut, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';

  const handleSignOut = () => {
    (async () => {
      try {
        await signOut();
        setIsOpen(false);
      } catch (error) {
        console.error('Sign out failed:', error);
      }
    })();
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-full shadow-lg`}>
        <button onClick={() => setIsOpen(!isOpen)} className={`p-3 rounded-full transition-all hover:scale-110 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <Settings className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        </button>
      </div>
      {isOpen && (
        <div className={`absolute bottom-16 left-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-4 w-48 space-y-4`}>
          <div>
            <label className={`text-xs font-semibold mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase`}>{t('theme')}</label>
            <div className="flex gap-2">
              <button onClick={() => { if (theme === 'light') toggleTheme(); }} className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1 ${theme === 'dark' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
                <Moon className="w-4 h-4" /><span className="text-xs">{t('darkMode')}</span>
              </button>
              <button onClick={() => { if (theme === 'dark') toggleTheme(); }} className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1 ${theme === 'light' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
                <Sun className="w-4 h-4" /><span className="text-xs">{t('lightMode')}</span>
              </button>
            </div>
          </div>
          <div>
            <label className={`text-xs font-semibold mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase`}>{t('language')}</label>
            <div className="flex gap-2">
              <button onClick={() => setLanguage('en')} className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium ${language === 'en' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>EN</button>
              <button onClick={() => setLanguage('hu')} className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium ${language === 'hu' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>HU</button>
            </div>
          </div>
          {user && (
            <button onClick={handleSignOut} className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'} text-sm font-medium`}>
              <LogOut className="w-4 h-4" />{t('logout')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
