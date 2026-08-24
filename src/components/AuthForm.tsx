import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export const AuthForm = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      {error && (
        <div className={`p-3 rounded-xl text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {error}
        </div>
      )}
      <div className="flex flex-col text-left">
        <label className={`text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 outline-none ${
            isDarkMode 
              ? 'bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]' 
              : 'bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900'
          }`}
          required
        />
      </div>
      <div className="flex flex-col text-left">
        <label className={`text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 outline-none ${
            isDarkMode 
              ? 'bg-[#1C1C19] border-[#4A4A3F] focus:border-sky-500 focus:ring-sky-500/20 text-[#F5F5F0]' 
              : 'bg-slate-50 border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900'
          }`}
          required
        />
      </div>
      <button 
        type="submit" 
        className="w-full mt-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all shadow-md shadow-sky-500/20 active:scale-[0.98]"
      >
        {isLogin ? "Sign In with Email" : "Create Account"}
      </button>
      <button 
        type="button" 
        onClick={() => setIsLogin(!isLogin)} 
        className={`w-full text-sm font-medium transition-colors ${isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'}`}
      >
        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
};
