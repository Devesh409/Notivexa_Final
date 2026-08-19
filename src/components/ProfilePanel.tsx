import React from "react";
import { User } from "firebase/auth";

export const ProfilePanel = ({ user, isDarkMode }: { user: User | null; isDarkMode: boolean }) => {
  if (!user) return null;
  return (
    <div className="flex justify-end mb-4">
      <div className={`flex items-center gap-3 p-2 px-4 rounded-full border ${isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-slate-200"}`}>
        <span className="text-xs font-semibold">{user.email}</span>
        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
          {user.email?.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
};
