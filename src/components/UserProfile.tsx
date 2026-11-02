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
  if (!user) {
    return (
      <div
        className={`flex items-center gap-1.5 sm:gap-2 rounded-full border px-2 py-1 sm:px-2.5 sm:py-1.5 min-w-0 ${
          isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-slate-200"
        } shadow-sm`}
      >
        <div className={`p-1 sm:p-1.5 rounded-full shrink-0 ${isDarkMode ? "bg-[#2D2D2A]" : "bg-slate-100"}`}>
          <UserIcon size={14} />
        </div>
        <span
          className={`max-w-[68px] sm:max-w-28 truncate text-[11px] sm:text-xs font-semibold ${
            isDarkMode ? "text-[#E0E0D5]" : "text-slate-700"
          }`}
        >
          Guest
        </span>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign in or switch account"
          title="Sign in or switch account"
          className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
            isDarkMode
              ? "text-[#C2C2B0] hover:bg-[#383832] hover:text-white"
              : "text-slate-500 hover:bg-rose-50 hover:text-rose-700"
          }`}
        >
          <LogOut size={13} />
        </button>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 rounded-full border px-2 py-1 sm:p-1.5 min-w-0 max-w-full ${
        isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white border-slate-200"
      } shadow-sm`}
    >
      {user.photoURL ? (
        <img src={user.photoURL} alt="Profile" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0" />
      ) : (
        <div className={`p-1 sm:p-1.5 rounded-full shrink-0 ${isDarkMode ? "bg-[#2D2D2A]" : "bg-slate-100"}`}>
          <UserIcon size={15} />
        </div>
      )}
      <span
        className={`max-w-[78px] xs:max-w-[96px] sm:max-w-32 truncate text-xs sm:text-sm font-semibold ${
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
          className={`hidden sm:flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            isDarkMode
              ? "text-sky-400 hover:bg-[#383832] hover:text-sky-300"
              : "text-sky-600 hover:bg-sky-50 hover:text-sky-800"
          }`}
        >
          <ShieldCheck size={15} />
        </button>
      )}

      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        title="Sign out"
        className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
          isDarkMode
            ? "text-[#C2C2B0] hover:bg-[#383832] hover:text-white"
            : "text-slate-500 hover:bg-rose-50 hover:text-rose-700"
        }`}
      >
        <LogOut size={14} />
      </button>
    </div>
  );
};

