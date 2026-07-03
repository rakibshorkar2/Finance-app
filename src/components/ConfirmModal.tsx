import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDoubleConfirm?: boolean;
  doubleConfirmMessage?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  isDoubleConfirm = false,
  doubleConfirmMessage = 'Are you absolutely sure? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [step, setStep] = useState(1);
  const [mathEquation, setMathEquation] = useState({ text: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUserAnswer('');
      setMathError(false);
    }
  }, [isOpen]);

  const generateEquation = () => {
    const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const num2 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let answer = 0;
    
    if (op === '+') {
      answer = num1 + num2;
      setMathEquation({
        text: `${num1} + ${num2} = ?`,
        answer
      });
    } else if (op === '-') {
      // Ensure positive result for easy UI
      const n1 = Math.max(num1, num2);
      const n2 = Math.min(num1, num2);
      answer = n1 - n2;
      setMathEquation({
        text: `${n1} - ${n2} = ?`,
        answer
      });
    } else {
      answer = num1 * num2;
      setMathEquation({
        text: `${num1} × ${num2} = ?`,
        answer
      });
    }
  };

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (isDoubleConfirm) {
      if (step === 1) {
        setStep(2);
      } else if (step === 2) {
        generateEquation();
        setUserAnswer('');
        setMathError(false);
        setStep(3);
      } else if (step === 3) {
        const parsedAns = parseInt(userAnswer.trim(), 10);
        if (parsedAns === mathEquation.answer) {
          onConfirm();
        } else {
          setMathError(true);
        }
      }
    } else {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal content container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative liquid-glass max-w-md w-full p-6 shadow-2xl z-10 overflow-hidden"
        >
          {/* Subtle color highlight at top */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 ${
            step === 3 ? 'bg-red-500 animate-pulse' : step === 2 ? 'bg-rose-500' : 'bg-amber-500'
          }`} />

          {/* Close Button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex gap-4 items-start mt-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              step === 3 
                ? 'bg-red-950/40 text-red-400 border border-red-900/30 animate-pulse' 
                : step === 2 
                ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' 
                : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
            }`}>
              {step === 3 ? <ShieldAlert size={20} /> : step === 2 ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
            </div>

            <div className="space-y-2 flex-1">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white font-sans flex items-center gap-2">
                {step === 3 
                  ? 'Step 3: Solve to Authorize' 
                  : step === 2 
                  ? 'Step 2: Triple Check' 
                  : title}
              </h3>
              
              {step === 3 ? (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    Please solve this simple equation to authorize complete deletion/reset. This is the final safety gate.
                  </p>
                  
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-sans">Verification Question:</span>
                    <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">{mathEquation.text}</span>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => {
                        setUserAnswer(e.target.value);
                        setMathError(false);
                      }}
                      placeholder="Solve equation"
                      className={`w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border rounded-lg focus:outline-none focus:ring-1 text-zinc-800 dark:text-white font-mono text-center ${
                        mathError 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-zinc-200 dark:border-[#27272a] focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmClick();
                        }
                      }}
                    />
                    {mathError && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                        Incorrect answer. Please solve the equation to confirm.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                  {step === 1 ? message : doubleConfirmMessage}
                </p>
              )}

              {isDoubleConfirm && (
                <div className="flex items-center gap-1.5 pt-1.5">
                  <div className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  <div className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-rose-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  <div className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-red-500 animate-pulse' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider ml-1.5">
                    Step {step} of 3
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-[#27272a]/50">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a] transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            
            <button
              id="confirm_modal_btn_submit"
              type="button"
              onClick={handleConfirmClick}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-sm cursor-pointer ${
                step === 3
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/10'
                  : step === 2 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10' 
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10'
              }`}
            >
              {step === 1 && isDoubleConfirm ? 'Proceed' : step === 2 ? 'Proceed to Step 3' : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
