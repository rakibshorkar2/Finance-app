import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  X, 
  Smile, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { Account, Expense, IncomeSource, DeductionSettings } from '../types';

interface MeowChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  salarySources: IncomeSource[];
  setSalarySources: React.Dispatch<React.SetStateAction<IncomeSource[]>>;
  deductions: DeductionSettings;
  setDeductions: React.Dispatch<React.SetStateAction<DeductionSettings>>;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'success' | 'error' | 'pending';
  actionsExecuted?: string[];
}

// Custom sleeping cat illustration for WealthVault header
export function LayingCat({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute -top-[19px] left-[32px] select-none z-30 cursor-pointer group"
      animate={{ y: [0, -1.2, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      title="মিউ ঘুমাচ্ছে! চ্যাট করতে ট্যাপ করুন 🐱"
    >
      <div className="relative">
        {/* Cute sleeping balloon bubble above the cat */}
        <motion.div 
          className="absolute -top-3.5 left-6 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase font-mono shadow-sm pointer-events-none"
          animate={{ scale: [0.8, 1, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          zZ
        </motion.div>
        
        <svg width="42" height="32" viewBox="0 0 42 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Animated cat tail */}
          <motion.path
            d="M 33 16 C 36 16, 39 11, 37 7"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ originX: "33px", originY: "16px" }}
            animate={{ rotate: [0, -15, 12, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 }}
          />
          {/* Breathing cat body */}
          <motion.ellipse
            cx="21"
            cy="17"
            rx="12"
            ry="9.5"
            fill="#f97316"
            animate={{ ry: [9.5, 10.2, 9.5] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          />
          {/* Cat head */}
          <circle cx="11" cy="12" r="8" fill="#f97316" />
          {/* Cat Ears */}
          <polygon points="5,7 8,11 4,12" fill="#ea580c" />
          <polygon points="13,5 14,10 10,11" fill="#ea580c" />
          {/* Eyes (Sleeping Arcs) */}
          <path d="M 7 13 Q 8.5 14.5 10 13" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 12 13 Q 13.5 14.5 15 13" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          {/* Tiny pink nose */}
          <circle cx="11" cy="15" r="1" fill="#fda4af" />
          {/* Cat paws */}
          <ellipse cx="15" cy="23" rx="3.5" ry="2" fill="#ea580c" />
          <ellipse cx="23" cy="23" rx="3.5" ry="2" fill="#ea580c" />
        </svg>
      </div>
    </motion.div>
  );
}

export default function MeowChatbot({
  isOpen,
  onClose,
  accounts,
  setAccounts,
  expenses,
  setExpenses,
  salarySources,
  setSalarySources,
  deductions,
  setDeductions,
  triggerNotification
}: MeowChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isMeowHungry, setIsMeowHungry] = useState(false);
  const [showFeedingEffects, setShowFeedingEffects] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFeedMeow = (foodType: 'fish' | 'milk' | 'cookies') => {
    setIsMeowHungry(false);
    setShowFeedingEffects(foodType);
    setTimeout(() => setShowFeedingEffects(null), 3500);

    const foodNames = {
      fish: 'মাছ 🐟',
      milk: 'দুধ 🥛',
      cookies: 'কুকিজ 🍪'
    };

    const foodEmoji = {
      fish: '🐟',
      milk: '🥛',
      cookies: '🍪'
    };

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `মিউকে চমৎকার ${foodNames[foodType]} খাওয়ালাম! ${foodEmoji[foodType]}😻`,
        timestamp: new Date()
      }
    ]);

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const replies = [
        `থ্যাংক ইউ মালিক! মিউউউ! ${foodEmoji[foodType]} অনেক সুস্বাদু ছিল! পেট ভরে গেল 😻🐾 এবার বলুন আপনার বাজেটের আর কী কী কাজ করে দিতে হবে?`,
        `পুরররর... পেট ভরে গেল মালিক! ${foodEmoji[foodType]} খেয়ে আমার শরীরে অনেক শক্তি এসেছে! 🦁 আপনার আর্থিক হিসাব কষতে আমি পুরো প্রস্তুত! মিউ!`,
        `মিউউউউ! অনেক ধন্যবাদ মালিক! ${foodEmoji[foodType]} খেয়ে মনটা ভালো হয়ে গেল! 💖 আপনি সত্যি সেরা মালিক!`
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: new Date()
        }
      ]);
      triggerNotification(`🐱 Meow ate the delicious ${foodType}! 😻`, 'success');
    }, 1200);
  };

  // Helper to match account case-insensitively or return ID
  const resolveAccountId = (accountNameOrId: string | undefined): string | undefined => {
    if (!accountNameOrId) return undefined;
    const clean = accountNameOrId.trim().toLowerCase();
    const match = accounts.find(acc => acc.id.toLowerCase() === clean || acc.name.toLowerCase().includes(clean));
    return match ? match.id : undefined;
  };

  // Populate first welcoming message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `আসসালামু আলাইকুম ,মালিক। 🐾 আমার নাম **Meow (মিউ)**! আমি ওয়েলথভল্ট (WealthVault)-এর সাহায্যকারী বেড়াল। 

আমি আপনার আয়, ব্যয় এবং অ্যাকাউন্টগুলো খুব সহজেই গুছিয়ে দিতে পারি! নিচে দেওয়া উদাহরণগুলোর মতো কিছু লিখে পাঠান, আমি নিজে থেকেই সব অ্যাড করে দেবো:
* *"Bkash নামে একটা অ্যাকাউন্ট যোগ করো, ব্যালেন্স ১৫,০০০ টাকা"*
* *"আজকে ২৫০ টাকার বিরিয়ানি খেলাম"*
* *"আমার ৩০,০০০ টাকার পার্ট-টাইম চাকরিটা যুক্ত করো"*
* *"আমি ২০০ টাকা রিকশায় এবং ৮০ টাকা চা খাওয়ার ব্যয় করলাম"*

বলুন মিউ, আজ আপনাকে কিভাবে সাহায্য করতে পারি? পুররর... 🐱`,
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: `মিউ! চ্যাট হিস্ট্রি মুছে ফেলা হয়েছে। নতুন করে কী সাহায্য করতে পারি বলুন? পুররর... 🐾`,
        timestamp: new Date()
      }
    ]);
  };

  const executeAction = (name: string, args: any): { success: boolean; log: string } => {
    try {
      if (name === 'add_account') {
        const { name: accName, balance, color, isDPS, dpsMonthlyInst, dpsTargetAmt } = args;
        if (!accName || balance === undefined) {
          return { success: false, log: "অ্যাকাউন্টের নাম বা ব্যালেন্স পাওয়া যায়নি।" };
        }
        const accId = `account-${Date.now()}`;
        const newAccount = {
          id: accId,
          name: accName,
          balance: Number(balance),
          color: color || ['indigo', 'pink', 'amber', 'emerald', 'rose', 'sky', 'violet'][Math.floor(Math.random() * 7)],
          isDPS: !!isDPS,
          dpsMonthlyInst: dpsMonthlyInst !== undefined ? Number(dpsMonthlyInst) : undefined,
          dpsTargetAmt: dpsTargetAmt !== undefined ? Number(dpsTargetAmt) : undefined
        };
        setAccounts(prev => [...prev, newAccount]);
        triggerNotification(`🐱 Meow added Account: "${accName}"`, 'success');
        return { success: true, log: `অ্যাকাউন্ট যোগ করা হয়েছে: ${accName} (${balance} TK)` };
      }

      if (name === 'add_expense') {
        const { description, amount, category, frequency, date, accountId } = args;
        if (!description || amount === undefined || !category) {
          return { success: false, log: "ব্যয়ের বর্ণনা, পরিমাণ বা ক্যাটাগরি অনুপস্থিত।" };
        }
        
        const resolvedAccId = resolveAccountId(accountId);
        const expId = `expense-${Date.now()}`;
        const newExpense: Expense = {
          id: expId,
          description,
          amount: Number(amount),
          category: category as any,
          frequency: (frequency || 'once') as any,
          date: date || new Date().toISOString().split('T')[0],
          accountId: resolvedAccId
        };
        setExpenses(prev => [...prev, newExpense]);

        // Deduct from linked account balance if present
        if (resolvedAccId) {
          setAccounts(prev => prev.map(acc => {
            if (acc.id === resolvedAccId) {
              return { ...acc, balance: acc.balance - Number(amount) };
            }
            return acc;
          }));
        }

        triggerNotification(`🐱 Meow logged expense: "${description}"`, 'success');
        return { success: true, log: `ব্যয় যুক্ত করা হয়েছে: ${description} (${amount} TK)` };
      }

      if (name === 'add_multiple_expenses') {
        const { expenses: list } = args;
        if (!Array.isArray(list) || list.length === 0) {
          return { success: false, log: "কোন ব্যয়ের তালিকা পাওয়া যায়নি।" };
        }

        const added: string[] = [];
        const baseTime = Date.now();

        const newExpenses: Expense[] = list.map((exp: any, idx: number) => {
          const resolvedAccId = resolveAccountId(exp.accountId);
          added.push(`${exp.description} (${exp.amount} TK)`);

          // Deduct from balance
          if (resolvedAccId) {
            setAccounts(prev => prev.map(acc => {
              if (acc.id === resolvedAccId) {
                return { ...acc, balance: acc.balance - Number(exp.amount) };
              }
              return acc;
            }));
          }

          return {
            id: `expense-${baseTime}-${idx}`,
            description: exp.description,
            amount: Number(exp.amount),
            category: exp.category as any,
            frequency: (exp.frequency || 'once') as any,
            date: exp.date || new Date().toISOString().split('T')[0],
            accountId: resolvedAccId
          };
        });

        setExpenses(prev => [...prev, ...newExpenses]);
        triggerNotification(`🐱 Meow logged ${list.length} expenses!`, 'success');
        return { success: true, log: `একাধিক ব্যয় যোগ করা হয়েছে:\n` + added.join('\n') };
      }

      if (name === 'add_income_source') {
        const { name: incName, amount, frequency, hoursPerWeek, accountId } = args;
        if (!incName || amount === undefined) {
          return { success: false, log: "আয়ের নাম বা পরিমাণ পাওয়া যায়নি।" };
        }

        const resolvedAccId = resolveAccountId(accountId);
        const incId = `income-${Date.now()}`;
        const newSource: IncomeSource = {
          id: incId,
          name: incName,
          amount: Number(amount),
          frequency: (frequency || 'monthly') as any,
          hoursPerWeek: hoursPerWeek !== undefined ? Number(hoursPerWeek) : undefined,
          accountId: resolvedAccId
        };
        setSalarySources(prev => [...prev, newSource]);

        // Deposit to linked account if present
        if (resolvedAccId) {
          setAccounts(prev => prev.map(acc => {
            if (acc.id === resolvedAccId) {
              return { ...acc, balance: acc.balance + Number(amount) };
            }
            return acc;
          }));
        }

        triggerNotification(`🐱 Meow added Income: "${incName}"`, 'success');
        return { success: true, log: `আয় যোগ করা হয়েছে: ${incName} (${amount} TK)` };
      }

      if (name === 'update_deductions') {
        const { taxRate, pensionRate, insuranceMonthly, otherMonthly } = args;
        const newDeductions: DeductionSettings = {
          taxRate: taxRate !== undefined ? Number(taxRate) : deductions.taxRate,
          pensionRate: pensionRate !== undefined ? Number(pensionRate) : deductions.pensionRate,
          insuranceMonthly: insuranceMonthly !== undefined ? Number(insuranceMonthly) : deductions.insuranceMonthly,
          otherMonthly: otherMonthly !== undefined ? Number(otherMonthly) : deductions.otherMonthly
        };
        setDeductions(newDeductions);
        triggerNotification(`🐱 Meow updated deductions settings!`, 'success');
        return { success: true, log: `ট্যাক্স ও ডিডাকশন সেটিংস আপডেট করা হয়েছে!` };
      }

      if (name === 'delete_expense') {
        const { id, description } = args;
        let expenseToDelete: Expense | undefined;
        if (id) {
          expenseToDelete = expenses.find(e => e.id === id);
        } else if (description) {
          const kw = description.trim().toLowerCase();
          expenseToDelete = expenses.find(e => e.description.toLowerCase().includes(kw));
        }

        if (!expenseToDelete) {
          return { success: false, log: `কোন ব্যয় খুঁজে পাওয়া যায়নি ${id || description ? `যার বিবরণ বা আইডি: "${id || description}"` : ''}।` };
        }

        setExpenses(prev => prev.filter(e => e.id !== expenseToDelete!.id));
        triggerNotification(`🐱 Meow removed expense: "${expenseToDelete.description}"`, 'info');
        return { success: true, log: `ব্যয় ডিলিট করা হয়েছে: ${expenseToDelete.description} (${expenseToDelete.amount} TK)` };
      }

      if (name === 'delete_account') {
        const { id, name: accName } = args;
        let accountToDelete: Account | undefined;
        if (id) {
          accountToDelete = accounts.find(a => a.id === id);
        } else if (accName) {
          const kw = accName.trim().toLowerCase();
          accountToDelete = accounts.find(a => a.name.toLowerCase().includes(kw) || a.id.toLowerCase() === kw);
        }

        if (!accountToDelete) {
          return { success: false, log: `কোন অ্যাকাউন্ট খুঁজে পাওয়া যায়নি ${id || accName ? `যার নাম বা আইডি: "${id || accName}"` : ''}।` };
        }

        setAccounts(prev => prev.filter(a => a.id !== accountToDelete!.id));
        triggerNotification(`🐱 Meow removed account: "${accountToDelete.name}"`, 'info');
        return { success: true, log: `অ্যাকাউন্ট ডিলিট করা হয়েছে: ${accountToDelete.name}` };
      }

      if (name === 'delete_income_source') {
        const { id, name: incName } = args;
        let sourceToDelete: IncomeSource | undefined;
        if (id) {
          sourceToDelete = salarySources.find(s => s.id === id);
        } else if (incName) {
          const kw = incName.trim().toLowerCase();
          sourceToDelete = salarySources.find(s => s.name.toLowerCase().includes(kw) || s.id.toLowerCase() === kw);
        }

        if (!sourceToDelete) {
          return { success: false, log: `কোন আয়ের উৎস খুঁজে পাওয়া যায়নি ${id || incName ? `যার নাম বা আইডি: "${id || incName}"` : ''}।` };
        }

        setSalarySources(prev => prev.filter(s => s.id !== sourceToDelete!.id));
        triggerNotification(`🐱 Meow removed income: "${sourceToDelete.name}"`, 'info');
        return { success: true, log: `আয়ের উৎস ডিলিট করা হয়েছে: ${sourceToDelete.name}` };
      }

      if (name === 'update_account_balance') {
        const { id, name: accName, balance } = args;
        if (balance === undefined) {
          return { success: false, log: "ব্যালেন্স উল্লেখ করা হয়নি।" };
        }

        let accountToUpdate: Account | undefined;
        if (id) {
          accountToUpdate = accounts.find(a => a.id === id);
        } else if (accName) {
          const kw = accName.trim().toLowerCase();
          accountToUpdate = accounts.find(a => a.name.toLowerCase().includes(kw) || a.id.toLowerCase() === kw);
        }

        if (!accountToUpdate) {
          return { success: false, log: `কোন অ্যাকাউন্ট খুঁজে পাওয়া যায়নি ${id || accName ? `যার নাম বা আইডি: "${id || accName}"` : ''}।` };
        }

        const oldBal = accountToUpdate.balance;
        setAccounts(prev => prev.map(a => {
          if (a.id === accountToUpdate!.id) {
            return { ...a, balance: Number(balance) };
          }
          return a;
        }));

        triggerNotification(`🐱 Meow updated balance for "${accountToUpdate.name}"`, 'success');
        return { success: true, log: `অ্যাকাউন্ট ব্যালেন্স আপডেট করা হয়েছে: ${accountToUpdate.name} (${oldBal} TK -> ${balance} TK)` };
      }

      return { success: false, log: `অজানা অ্যাকশন: ${name}` };
    } catch (err: any) {
      console.error(err);
      return { success: false, log: `ত্রুটি ঘটেছে: ${err.message || err}` };
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) setInputText('');

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    if (!navigator.onLine) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `মালিক, আপনি এখন অফলাইনে আছেন! 😿🐾\nআমি আপনার মেসেজ প্রসেস করতে পারছি না। ইন্টারনেট কানেকশন ফিরে আসলে আবার চেষ্টা করুন, আমি আপনার সব কথা শুনে হিসাব কষে দেবো! পুরররর... 🐾`,
            timestamp: new Date()
          }
        ]);
        setIsLoading(false);
      }, 800);
      return;
    }

    const nextCount = userMessageCount + 1;
    setUserMessageCount(nextCount);

    try {
      // Map history
      const historyPayload = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Current app state passed to Meow so it has perfect context
      const appState = {
        accounts: accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance, isDPS: a.isDPS })),
        expenses: expenses.slice(-15).map(e => ({ description: e.description, amount: e.amount, category: e.category, date: e.date, accountId: e.accountId })),
        salarySources: salarySources.map(s => ({ name: s.name, amount: s.amount, frequency: s.frequency })),
        deductions
      };

      const response = await fetch('/api/meow/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          appState
        })
      });

      if (!response.ok) {
        throw new Error("সার্ভার রেসপন্স করতে ব্যর্থ হয়েছে।");
      }

      const data = await response.json();
      
      const executedLogs: string[] = [];
      let executionStatus: 'success' | 'error' | undefined = undefined;

      if (Array.isArray(data.functionCalls) && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          const result = executeAction(call.name, call.args);
          executedLogs.push(result.log);
          if (result.success) {
            executionStatus = 'success';
          } else {
            executionStatus = 'error';
          }
        }
      }

      let aiResponseText = data.text || "মিউ! আমি কাজটি করার চেষ্টা করেছি।";
      
      // Append executed action logs to the text for clear user transparency
      if (executedLogs.length > 0) {
        aiResponseText += `\n\n**🐾 [অ্যাকশন লগ]:**\n${executedLogs.map(l => `✅ ${l}`).join('\n')}`;
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date(),
        status: executionStatus,
        actionsExecuted: executedLogs.length > 0 ? executedLogs : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Trigger Meow getting hungry after 2 messages, or every 3 messages thereafter
      if (nextCount === 2 || (nextCount > 2 && nextCount % 3 === 0)) {
        setTimeout(() => {
          setIsMeowHungry(true);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `মালিক খিদা লাগছে কিছু খাইতে দেন 😿🐾`,
              timestamp: new Date()
            }
          ]);
        }, 1500);
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `মিউ... দুঃখিত! ইন্টারনেট কানেকশন বা সার্ভারে সাময়িক সমস্যা হচ্ছে। দয়া করে আবার চেষ্টা করুন। পুররর... 😿\n*(Error: ${err.message || err})*`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const examplePills = [
    { text: "১৫০ টাকা রিকশা ভাড়া আর ৫০ টাকা চা যুক্ত করো", icon: "💸" },
    { text: "Brac Bank অ্যাকাউন্ট যোগ করো, ব্যালেন্স ৫০০০০ টাকা", icon: "🏦" },
    { text: "আজকে ১০০০ টাকা সুপারশপ শপিং খেলাম", icon: "🛒" },
    { text: "আমার ব্যাংক অ্যাকাউন্ট থেকে ১২০ টাকা কেটে নাও", icon: "💳" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur on tablet/mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Floating Cat Chat Panel */}
          <motion.div
            id="meow_chatbot_panel"
            initial={{ opacity: 0, x: 150, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 150, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-28 right-3 md:right-8 z-50 w-[calc(100vw-24px)] max-w-[360px] h-[480px] md:h-[500px] bg-white dark:bg-[#14151a] border border-zinc-200 dark:border-[#2a2c3a] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans"
          >
            {/* Header with cute Cat Theme design */}
            <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 p-3 shrink-0 text-white flex items-center justify-between">
              
              {/* Cat Ear Accents (Absolute position above header) */}
              <div className="absolute -top-3 left-6 w-6 h-6 bg-orange-500 rounded-tr-xl border-t border-r border-orange-400 rotate-45 transform origin-bottom-left" />
              <div className="absolute -top-3 left-16 w-6 h-6 bg-orange-500 rounded-tl-xl border-t border-l border-orange-400 -rotate-45 transform origin-bottom-right" />

              <div className="flex items-center gap-2.5">
                {/* Cute blinking cat avatar */}
                <div className="relative w-9 h-9 bg-white/10 dark:bg-black/20 border border-white/20 rounded-full flex items-center justify-center shrink-0">
                  <motion.span 
                    className="text-xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    🐱
                  </motion.span>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-orange-500 rounded-full" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-tight flex items-center gap-1">
                    Meow Assistant <Sparkles size={11} className="text-amber-200 animate-pulse" />
                  </h3>
                  <p className="text-[9px] text-orange-100 font-medium">মিউ সব কাজ করে দেবে! • Active</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="p-1 hover:bg-white/10 rounded-lg text-orange-100 hover:text-white transition-all cursor-pointer"
                  title="চ্যাট হিস্ট্রি মুছুন"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-[10px] font-extrabold text-white rounded-full transition-all cursor-pointer border border-white/10 shrink-0 focus:outline-none"
                  title="বন্ধ করুন"
                >
                  <X size={12} />
                  <span>বন্ধ করুন</span>
                </button>
              </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-[#0f1013] scrollbar-thin">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5">
                      🐱
                    </div>
                  )}

                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-[#181920] text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Simple custom markdown renderer helper for bold text */}
                      <div className="whitespace-pre-wrap">
                        {msg.content.split('\n').map((line, lIdx) => {
                          // Handle list items
                          if (line.trim().startsWith('*')) {
                            return (
                              <div key={lIdx} className="flex gap-1.5 pl-1.5 my-0.5">
                                <span className="text-orange-500">•</span>
                                <span>{parseBoldText(line.trim().substring(1).trim())}</span>
                              </div>
                            );
                          }
                          return <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>{parseBoldText(line)}</p>;
                        })}
                      </div>
                    </div>

                    {/* Action Execution Pill indicator */}
                    {msg.status && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold self-start ${
                        msg.status === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                      }`}>
                        {msg.status === 'success' ? (
                          <>
                            <CheckCircle2 size={10} />
                            <span>লেজার বুক আপডেট হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={10} />
                            <span>হিস্ট্রি রাইটিং ব্যর্থ হয়েছে</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <span className="text-[9px] text-zinc-400 self-end px-1 mt-0.5">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Chatbot loading state - Cats chasing yarn */}
              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    🐱
                  </div>
                  <div className="bg-white dark:bg-[#181920] border border-zinc-100 dark:border-zinc-800/80 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <div className="flex space-x-1.5">
                      <motion.div className="w-2 h-2 bg-orange-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-2 h-2 bg-amber-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                      <motion.div className="w-2 h-2 bg-indigo-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">Meow ভাবছে ও হিসেব কষছে...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick recommendation pills */}
            {messages.length < 3 && !isLoading && (
              <div className="px-4 py-2 bg-zinc-100 dark:bg-[#0c0d10] border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold mb-1.5 flex items-center gap-1">
                  💡 চেষ্টা করে দেখুন (Tap to try):
                </p>
                <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {examplePills.map((pill, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(pill.text)}
                      className="flex items-center justify-between text-left px-2.5 py-1.5 bg-white dark:bg-[#14151a] hover:bg-orange-500/5 dark:hover:bg-orange-500/5 hover:border-orange-500/20 text-[10.5px] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/60 rounded-xl transition-all cursor-pointer group"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{pill.icon}</span>
                        <span className="truncate">{pill.text}</span>
                      </span>
                      <ArrowRight size={11} className="text-zinc-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cute Feeding Bar when Meow is hungry */}
            {isMeowHungry && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-t border-orange-200 dark:border-orange-500/20 shrink-0 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    😿 মিউ ক্ষুধার্ত! খাবার দিন (Feed Meow):
                  </p>
                  <span className="text-[9px] text-zinc-400 font-bold">সীমাহীন খাবার 🥫</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedMeow('fish')}
                    className="flex-1 py-1.5 bg-white dark:bg-[#1c1d26] hover:bg-orange-100 dark:hover:bg-orange-950/40 border border-orange-300 dark:border-orange-500/30 rounded-xl text-xs font-extrabold text-orange-600 dark:text-orange-300 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <span>🐟 মাছ</span>
                  </button>
                  <button
                    onClick={() => handleFeedMeow('milk')}
                    className="flex-1 py-1.5 bg-white dark:bg-[#1c1d26] hover:bg-orange-100 dark:hover:bg-orange-950/40 border border-orange-300 dark:border-orange-500/30 rounded-xl text-xs font-extrabold text-amber-600 dark:text-amber-300 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <span>🥛 দুধ</span>
                  </button>
                  <button
                    onClick={() => handleFeedMeow('cookies')}
                    className="flex-1 py-1.5 bg-white dark:bg-[#1c1d26] hover:bg-orange-100 dark:hover:bg-orange-950/40 border border-orange-300 dark:border-orange-500/30 rounded-xl text-xs font-extrabold text-indigo-600 dark:text-indigo-300 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <span>🍪 কুকি</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Input Footer */}
            <div className="p-3 bg-white dark:bg-[#14151a] border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                disabled={isLoading}
                placeholder="এখানে বলুন (যেমন: ২০০ টাকা চা খেলাম...)"
                className="flex-1 bg-zinc-100 dark:bg-[#181920] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-zinc-50 rounded-full px-4 py-2.5 focus:outline-none focus:bg-white dark:focus:bg-[#1f202b] focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-zinc-400"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md shadow-orange-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none"
                title="বার্তা পাঠান"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </div>

            {/* Floating food emojis overlay */}
            {showFeedingEffects && (
              <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden bg-black/5 dark:bg-black/20">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 1, 
                      scale: 0.4,
                      x: (Math.random() - 0.5) * 80, 
                      y: 120 
                    }}
                    animate={{ 
                      opacity: [1, 1, 0], 
                      scale: [0.4, 1.6, 1.2],
                      x: (Math.random() - 0.5) * 260, 
                      y: -240,
                      rotate: Math.random() * 360
                    }}
                    transition={{ 
                      duration: 1.8 + Math.random() * 0.8, 
                      ease: "easeOut" 
                    }}
                    className="absolute text-3xl"
                  >
                    {showFeedingEffects === 'fish' ? '🐟' : showFeedingEffects === 'milk' ? '🥛' : '🍪'}
                  </motion.div>
                ))}
                {/* Hearts shower */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`heart-${i}`}
                    initial={{ 
                      opacity: 1, 
                      scale: 0.5,
                      x: (Math.random() - 0.5) * 120, 
                      y: 60 
                    }}
                    animate={{ 
                      opacity: [1, 0], 
                      scale: [0.5, 1.3, 0.9],
                      x: (Math.random() - 0.5) * 180, 
                      y: -180,
                    }}
                    transition={{ 
                      duration: 2.2, 
                      ease: "easeOut",
                      delay: 0.2 + Math.random() * 0.3
                    }}
                    className="absolute text-2xl"
                  >
                    💖
                  </motion.div>
                ))}
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Small helper to render basic markdown bold syntax **text** in HTML
function parseBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-extrabold text-orange-600 dark:text-orange-400">{part}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
