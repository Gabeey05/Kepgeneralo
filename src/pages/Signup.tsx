import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sparkles } from 'lucide-react';

export const Signup = ({ onSwitchToLogin }: { onSwitchToLogin: () => void }) => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signupError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-2xl p-8 shadow-2xl border`}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h1 className={`text-3xl font-bold bg-gradient-to-r ${isDark ? 'from-cyan-400 to-blue-500' : 'from-cyan-600 to-blue-600'} bg-clip-text text-transparent`}>{t('appName')}</h1>
        </div>
        <h2 className={`text-xl font-semibold text-center mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('signupWithEmail')}</h2>
        {success && <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-700/50 text-green-200' : 'bg-green-50 border border-green-200 text-green-700'}`}><p className="text-sm">{t('signupSuccess')}</p></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`} required />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`} required />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('confirmPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`} required />
          </div>
          {error && <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30 border border-red-700/50 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}><p className="text-sm">{error}</p></div>}
          <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg">{loading ? t('loading') : t('signup')}</button>
        </form>
        <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('alreadyHaveAccount')} <button onClick={onSwitchToLogin} className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{t('login')}</button>
        </div>
      </div>
    </div>
  );
};
