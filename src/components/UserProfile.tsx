import { User } from "firebase/auth";
import { User as UserIcon } from "lucide-react";

export const UserProfile = ({ user, isDarkMode }: { user: User | null, isDarkMode: boolean }) => {
  if (!user) return null;
  return (
    <div className={`flex items-center gap-2 p-2 rounded-full border ${isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-slate-200"} shadow-sm`}>
      {user.photoURL ? (
        <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
      ) : (
        <div className={`p-1.5 rounded-full ${isDarkMode ? "bg-[#2D2D2A]" : "bg-slate-100"}`}>
          <UserIcon size={16} />
        </div>
      )}
      <span className={`text-sm font-semibold pr-2 ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-700"}`}>
        {user.displayName || "User"}
      </span>
    </div>
  );
};
