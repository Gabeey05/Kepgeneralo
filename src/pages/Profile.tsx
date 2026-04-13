import { useState, useEffect, useRef } from 'react';
import { Camera, CreditCard as Edit2, Check, X, Grid3x3 as Grid3X3, Heart, BarChart2, Calendar, Loader2, Trash2, Globe, Lock, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';
import { ActivityHeatmap } from '../components/profile/ActivityHeatmap';
import { StatsCards } from '../components/profile/StatsCards';
import { MyImagesTab } from '../components/profile/MyImagesTab';
import { LikedImagesTab } from '../components/profile/LikedImagesTab';

interface Profile {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
}

type Tab = 'images' | 'liked' | 'stats' | 'activity';

export const Profile = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [usernameVal, setUsernameVal] = useState('');
  const [bioVal, setBioVal] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('images');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, bio, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setUsernameVal(data.username || '');
        setBioVal(data.bio || '');
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const saveUsername = async () => {
    if (!user || !usernameVal.trim()) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: usernameVal.trim() });
    if (error) {
      showToast(error.message.includes('unique') ? 'Username already taken' : 'Failed to save username', 'error');
    } else {
      setProfile((p) => p ? { ...p, username: usernameVal.trim() } : p);
      setEditingUsername(false);
      showToast('Username updated!', 'success');
    }
    setSavingProfile(false);
  };

  const saveBio = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, bio: bioVal });
    if (error) {
      showToast('Failed to save bio', 'error');
    } else {
      setProfile((p) => p ? { ...p, bio: bioVal } : p);
      setEditingBio(false);
      showToast('Bio updated!', 'success');
    }
    setSavingProfile(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: avatarUrl });
      if (updateError) throw updateError;
      setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : p);
      showToast('Avatar updated!', 'success');
    } catch {
      showToast('Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const userInitial = (profile?.username || user.email || 'U').charAt(0).toUpperCase();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'images', label: 'My Images', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'liked', label: 'Liked', icon: <Heart className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="container mx-auto px-4 py-10 max-w-5xl">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          </div>
        ) : (
          <>
            <div className={`rounded-2xl border p-8 mb-6 animate-fadeIn ${isDark ? 'bg-gray-800/60 border-gray-700/50 backdrop-blur-xl' : 'bg-white/80 border-gray-200 backdrop-blur-xl shadow-sm'}`}>
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-24 h-24 rounded-2xl overflow-hidden cursor-pointer group relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        {userInitial}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-2xl">
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {editingUsername ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={usernameVal}
                          onChange={(e) => setUsernameVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                          autoFocus
                          maxLength={30}
                          className={`text-xl font-bold px-3 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500/40 w-48
                            ${isDark ? 'bg-gray-900/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        <button onClick={saveUsername} disabled={savingProfile} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingUsername(false); setUsernameVal(profile?.username || ''); }} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {profile?.username || user.email?.split('@')[0]}
                        </h2>
                        <button onClick={() => setEditingUsername(true)} className={`p-1.5 rounded-lg transition-colors opacity-60 hover:opacity-100 ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>

                  {editingBio ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={bioVal}
                        onChange={(e) => setBioVal(e.target.value)}
                        autoFocus
                        maxLength={160}
                        rows={2}
                        placeholder="Write a short bio..."
                        className={`px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/40
                          ${isDark ? 'bg-gray-900/80 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                      <div className="flex gap-2">
                        <button onClick={saveBio} disabled={savingProfile} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          Save
                        </button>
                        <button onClick={() => { setEditingBio(false); setBioVal(profile?.bio || ''); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-start gap-2 cursor-pointer group`}
                      onClick={() => setEditingBio(true)}
                    >
                      <p className={`text-sm leading-relaxed ${profile?.bio ? (isDark ? 'text-gray-300' : 'text-gray-700') : (isDark ? 'text-gray-600 italic' : 'text-gray-400 italic')}`}>
                        {profile?.bio || 'Add a short bio...'}
                      </p>
                      <Edit2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`flex gap-1 p-1 rounded-xl border mb-6 ${isDark ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100 border-gray-200'}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === tab.id
                      ? (isDark ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-white text-cyan-700 shadow-sm')
                      : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')
                    }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="animate-fadeIn">
              {activeTab === 'images' && <MyImagesTab userId={user.id} />}
              {activeTab === 'liked' && <LikedImagesTab userId={user.id} />}
              {activeTab === 'stats' && <StatsCards userId={user.id} />}
              {activeTab === 'activity' && <ActivityHeatmap userId={user.id} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
