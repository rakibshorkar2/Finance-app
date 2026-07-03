import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { loginWithGoogle } from '../utils/firebaseService';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function LoginPage({ onLoginSuccess, triggerNotification }: LoginPageProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      triggerNotification(`আসসালামু আলাইকুম, ${user.displayName || 'মালিক'}। সফলভাবে লগইন হয়েছে!`, 'success');
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      // Friendly, non-clinical error handling
      let errorMessage = 'লগইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'লগইন পপআপটি বন্ধ করা হয়েছে। লগইন করতে আবার ক্লিক করুন।';
      } else if (!navigator.onLine) {
        errorMessage = 'আপনি এখন অফলাইনে আছেন! প্রথমবার লগইন করতে ইন্টারনেট কানেকশন প্রয়োজন।';
      }
      setError(errorMessage);
      triggerNotification(errorMessage, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-zinc-100 relative overflow-hidden font-sans p-4" id="login_page_container">
      {/* Dynamic abstract radial glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-indigo-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-emerald-500/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />

      {/* Grid overlay for a high-tech modern aesthetic */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.25] pointer-events-none" 
        id="login_grid_overlay"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative max-w-md w-full p-6 sm:p-8 rounded-2xl border border-zinc-800/80 bg-[#121214]/60 backdrop-blur-xl shadow-2xl overflow-hidden z-10"
        id="login_card"
      >
        {/* Top decorative gradient border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        {/* Brand / Logo Icon Section */}
        <div className="flex flex-col items-center text-center mb-8" id="login_brand_header">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 border border-indigo-400/20"
          >
            <ShieldCheck className="text-zinc-50 w-7 h-7" />
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            WealthVault
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-xs">
            আপনার আয়, ব্যয় এবং অ্যাকাউন্টগুলোর নিরাপদ ও সহজ হিসাব রাখার বিশ্বস্ত প্ল্যাটফর্ম।
          </p>
        </div>

        {/* Feature Highlights Bento Row */}
        <div className="space-y-3.5 mb-8" id="login_feature_list">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#18181b]/40 border border-zinc-800/30">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-200">নিরাপদ ডাবল-লক সুরক্ষাবলয়</h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">আপনার আর্থিক ডেটা শুধুমাত্র আপনার গুগল অ্যাকাউন্টেই শতভাগ সুরক্ষিত থাকে।</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#18181b]/40 border border-zinc-800/30">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-200">শতভাগ রিয়েল-টাইম অফলাইন সাপোর্ট</h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">ইন্টারনেট না থাকলেও নিরবচ্ছিন্ন হিসাব করতে থাকুন; অনলাইনে আসামাত্রই তা ক্লাউডে সিঙ্ক হবে।</p>
            </div>
          </div>
        </div>

        {/* Log In Action Section */}
        <div className="space-y-4" id="login_action_block">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
              id="login_error_alert"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-bold text-sm bg-white text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-white/5 active:scale-[0.98]"
            id="google_signin_btn"
          >
            {isLoggingIn ? (
              <svg className="animate-spin h-5 w-5 text-zinc-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.45 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.9c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.56c-0.9,0.6 -2.07,0.98 -3.3,1.1 -2.34,-0.05 -4.33,-1.63 -5.04,-3.83H2.9v2.64C4.38,18.98 7.97,20.9 12,20.9z" fill="#34A853" />
                  <path d="M6.96,13.43c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7s0.1,-1.16 0.28,-1.7V7.39H2.9C2.28,8.61 1.92,10.27 1.92,12s0.36,3.39 0.98,4.61l3.08,-2.38C6.15,13.91 6.5,13.68 6.96,13.43z" fill="#FBBC05" />
                  <path d="M12,6.1c1.3,0 2.47,0.45 3.39,1.33l2.54,-2.54C16.4,3.47 14.36,2.9 12,2.9c-4.03,0 -7.62,1.92 -9.1,4.49l3.08,2.38C6.67,7.74 8.66,6.15 12,6.1z" fill="#EA4335" />
                </g>
              </svg>
            )}
            <span>{isLoggingIn ? 'লগইন হচ্ছে...' : 'গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন'}</span>
          </button>
        </div>

        {/* Outer security pledge */}
        <div className="mt-8 pt-4 border-t border-zinc-800/40 text-center flex items-center justify-center gap-1.5 text-[10px] text-zinc-500" id="login_security_badge">
          <ShieldCheck size={12} className="text-emerald-500/80" />
          <span>আপনার কোনো গোপন পাসওয়ার্ড বা পিন সংরক্ষণ করা হয় না।</span>
        </div>
      </motion.div>
    </div>
  );
}
