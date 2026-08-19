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
    <form onSubmit={handleSubmit} className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-slate-200"} shadow-sm w-full max-w-sm`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
        {isLogin ? "Login" : "Register"}
      </h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-4 border rounded-md"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-4 border rounded-md"
        required
      />
      <button type="submit" className="w-full p-2 bg-sky-600 text-white rounded-md mb-4">
        {isLogin ? "Login" : "Register"}
      </button>
      <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-sm text-sky-600 underline">
        {isLogin ? "Need an account? Register" : "Have an account? Login"}
      </button>
    </form>
  );
};
