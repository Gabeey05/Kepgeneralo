import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Sparkles, X, ArrowLeft } from 'lucide-react';

type LoginView = 'login' | 'forgot';

export const Login = ({ onSwitchToSignup, onClose }: { onSwitchToSignup: () => void; onClose?: () => void }) => {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}?reset=true`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-2xl p-8 shadow-2xl border relative`}>
        {onClose && (
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95
              ${isDark ? 'text-gray-400 hover:bg-gray-700/60 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {view === 'forgot' && (
          <button
            onClick={() => { setView('login'); setError(''); setResetSent(false); }}
            className={`absolute top-4 left-4 p-1.5 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95
              ${isDark ? 'text-gray-400 hover:bg-gray-700/60 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h1 className={`text-3xl font-bold bg-gradient-to-r ${isDark ? 'from-cyan-400 to-blue-500' : 'from-cyan-600 to-blue-600'} bg-clip-text text-transparent`}>
            {t('appName')}
          </h1>
        </div>

        {view === 'login' ? (
          <>
            <h2 className={`text-xl font-semibold text-center mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('loginWithEmail')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-cyan-500`} required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('password')}</label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); }}
                    className={`text-xs font-medium transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                  >
                    Forgot password?
                  </button>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-cyan-500`} required />
              </div>
              {error && <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30 border border-red-700/50 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}><p className="text-sm">{error}</p></div>}
              <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg">{loading ? t('loading') : t('login')}</button>
            </form>
            <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('dontHaveAccount')} <button onClick={onSwitchToSignup} className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{t('signup')}</button>
            </div>
          </>
        ) : (
          <>
            <h2 className={`text-xl font-semibold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Reset password
            </h2>
            <p className={`text-sm text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter your email and we'll send you a reset link.
            </p>
            {resetSent ? (
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-emerald-900/30 border border-emerald-700/50 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                <p className="text-sm font-medium">Check your email</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>We sent a reset link to <strong>{email}</strong></p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-cyan-500`} required />
                </div>
                {error && <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30 border border-red-700/50 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}><p className="text-sm">{error}</p></div>}
                <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg">
                  {loading ? t('loading') : 'Send reset link'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
