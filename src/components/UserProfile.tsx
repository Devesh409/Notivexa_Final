import { User } from "firebase/auth";
import { LogOut, User as UserIcon, ShieldCheck } from "lucide-react";

export const UserProfile = ({
  user,
  isDarkMode,
  onSignOut,
  onOpenMfa,
}: {
  user: User | null;
  isDarkMode: boolean;
  onSignOut: () => void;
  onOpenMfa?: () => void;
}) => {
  if (!user) return null;
  return (
    <div
      className={`flex items-center gap-2 rounded-full border p-1.5 ${
        isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-slate-200"
      } shadow-sm`}
    >
      {user.photoURL ? (
        <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
      ) : (
        <div className={`p-1.5 rounded-full ${isDarkMode ? "bg-[#2D2D2A]" : "bg-slate-100"}`}>
          <UserIcon size={16} />
        </div>
      )}
      <span
        className={`max-w-32 truncate text-sm font-semibold ${
          isDarkMode ? "text-[#E0E0D5]" : "text-slate-700"
        }`}
      >
        {user.displayName || user.email?.split("@")[0] || user.phoneNumber || "User"}
      </span>

      {onOpenMfa && (
        <button
          type="button"
          onClick={onOpenMfa}
          aria-label="2-Step Verification / MFA Settings"
          title="Two-Factor Authentication (MFA) Settings"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            isDarkMode
              ? "text-sky-400 hover:bg-[#383832] hover:text-sky-300"
              : "text-sky-600 hover:bg-sky-50 hover:text-sky-800"
          }`}
        >
          <ShieldCheck size={16} />
        </button>
      )}

      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        title="Sign out"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
          isDarkMode
            ? "text-[#C2C2B0] hover:bg-[#383832] hover:text-white"
            : "text-slate-500 hover:bg-rose-50 hover:text-rose-700"
        }`}
      >
        <LogOut size={15} />
      </button>
    </div>
  );
};

