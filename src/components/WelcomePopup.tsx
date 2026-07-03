import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, ArrowRight, X, Play, Cat } from 'lucide-react';

interface WelcomePopupProps {
  onStartChatting: () => void;
}

export default function WelcomePopup({ onStartChatting }: WelcomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem('meow_welcome_shown');
    if (!hasShown) {
      // Small delay for top class premium entrance feeling!
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('meow_welcome_shown', 'true');
    setIsOpen(false);
  };

  const handleStartMeow = () => {
    localStorage.setItem('meow_welcome_shown', 'true');
    setIsOpen(false);
    onStartChatting();
  };

  // Fun motivational quotes from Meow the cat
  const catQuotes = [
    "ক্ষুদ্র সঞ্চয়ই একদিন বড় সুখে রূপ নেয়! প্রতিটি পয়সার খেয়াল রাখুন, মিউ! 🐾",
    "বাজেট তৈরি করা মানে স্বাধীনতা হারানো নয়, বরং স্মার্টলি খরচ করার আত্মবিশ্বাস পাওয়া! পুররর... 🐟",
    "টাকা অলস ফেলে না রেখে সঠিক জায়গায় ইনভেস্ট করুন। সম্পদ বাড়ুক বেড়ালের লাফানোর মতো দ্রুত! 🐱",
    "ছোট ছোট অপ্রয়োজনীয় খরচগুলো এড়িয়ে চলুন, মাসের শেষে দেখবেন জমানো টাকার পাহাড়! মিউওও! ✨"
  ];

  const randomQuote = catQuotes[Math.floor(Math.random() * catQuotes.length)];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            {/* Main Modal Box */}
            <motion.div
              initial={{ scale: 0.85, y: 50, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                opacity: 1,
                transition: { type: "spring", damping: 20, stiffness: 180, delay: 0.1 }
              }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-gradient-to-b from-[#1c1d24] to-[#111216] border border-orange-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(249,115,22,0.15)] text-white overflow-hidden text-center"
            >
              {/* Radial Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
              >
                <X size={18} />
              </button>

              {/* Celebration / Confetti Sparks */}
              <div className="absolute top-10 left-10 text-orange-400/40 animate-bounce">✨</div>
              <div className="absolute top-20 right-12 text-amber-300/40 animate-pulse text-lg">✦</div>
              <div className="absolute bottom-20 left-12 text-indigo-400/30 animate-pulse">✨</div>

              {/* Super Animated Jumping Cute Cat */}
              <div className="relative flex justify-center mb-6">
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, -3, 3, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3, 
                    ease: "easeInOut" 
                  }}
                  className="relative w-28 h-28 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20"
                >
                  {/* Floating ears outline for premium illustration design */}
                  <div className="absolute -top-3.5 left-5 w-6 h-6 bg-orange-500 rounded-tr-lg rotate-45 transform origin-bottom-left" />
                  <div className="absolute -top-3.5 right-5 w-6 h-6 bg-amber-400 rounded-tl-lg -rotate-45 transform origin-bottom-right" />
                  
                  {/* Cat face inside the badge */}
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    {/* Glowing Eyes */}
                    <motion.ellipse 
                      cx="22" cy="28" rx="3.5" ry="5" fill="#fff"
                      animate={{ scaleY: [1, 0.1, 1] }}
                      transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
                    />
                    <motion.ellipse 
                      cx="42" cy="28" rx="3.5" ry="5" fill="#fff"
                      animate={{ scaleY: [1, 0.1, 1] }}
                      transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
                    />
                    
                    {/* Cute blushing cheeks */}
                    <circle cx="16" cy="36" r="3" fill="#f43f5e" opacity="0.6" />
                    <circle cx="48" cy="36" r="3" fill="#f43f5e" opacity="0.6" />

                    {/* Cute cat whiskers */}
                    <path d="M12 34 H4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M11 39 L4 41" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M52 34 H60" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M53 39 L60 41" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Cat smile mouth */}
                    <path d="M 28 36 Q 32 40 32 36 Q 32 40 36 36" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    {/* Little pink nose */}
                    <polygon points="30,32 34,32 32,34" fill="#fda4af" />
                  </svg>

                  {/* Absolute badge overlay */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute -inset-1 border border-dashed border-orange-500/40 rounded-full"
                  />
                </motion.div>
                
                {/* Floating Heart icon */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute -right-2 top-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md shadow-rose-500/20"
                >
                  <Heart size={14} fill="currentColor" />
                </motion.div>
              </div>

              {/* Text Area */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-400 font-extrabold uppercase font-mono tracking-wider mb-3">
                  <Sparkles size={11} className="animate-spin" /> Meow Welcome Message 🐾
                </div>
                
                <h2 className="text-xl md:text-2xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-indigo-400">
                  আসসালামু আলাইকুম ,মালিক।
                </h2>

                <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-medium px-1 mb-5">
                  মিউ! 🐾 আমি আপনার ব্যক্তিগত ফাইন্যান্স বেড়াল **Meow (মিউ)**! আপনার বাজেট সাজানো, অ্যাকাউন্ট যোগ করা এবং দৈনিক খরচ সংরক্ষণ করার ঝক্কি-ঝামেলা সহজ করতে আমি প্রস্তুত। 
                </p>

                {/* Motivational Quote Box */}
                <div className="bg-white/5 border border-zinc-800 rounded-2xl p-4 text-left relative overflow-hidden mb-6">
                  <div className="absolute top-0 right-0 p-1 bg-orange-500/10 rounded-bl-xl text-[8px] font-bold text-orange-400 uppercase font-mono tracking-wider">
                    Meow Advice
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono italic leading-relaxed pl-6 relative">
                    <span className="absolute left-0 top-0 text-xl text-orange-500 font-serif">“</span>
                    {randomQuote}
                  </p>
                </div>
              </motion.div>

              {/* Actions Button */}
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-2">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-bold rounded-xl transition-all cursor-pointer border border-zinc-700 hover:border-zinc-600 focus:outline-none"
                >
                  ড্যাশবোর্ডে যান
                </button>
                <button
                  onClick={handleStartMeow}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-xs font-extrabold rounded-xl shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer focus:outline-none text-white"
                >
                  <span>মিউ চ্যাটবট শুরু করুন</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
