import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

interface Props {
  onDone: () => void;
}

export const ResetPassword = ({ onDone }: Props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(onDone, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-2xl p-8 shadow-2xl border`}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h1 className={`text-3xl font-bold bg-gradient-to-r ${isDark ? 'from-cyan-400 to-blue-500' : 'from-cyan-600 to-blue-600'} bg-clip-text text-transparent`}>
            PixelMind
          </h1>
        </div>

        <h2 className={`text-xl font-semibold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Set new password
        </h2>
        <p className={`text-sm text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Choose a strong password for your account.
        </p>

        {success ? (
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-emerald-900/30 border border-emerald-700/50 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
            <p className="text-sm font-medium">Password updated successfully</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Redirecting you back...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2 pr-10 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                placeholder="Repeat password"
                required
              />
            </div>
            {error && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30 border border-red-700/50 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                <p className="text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
