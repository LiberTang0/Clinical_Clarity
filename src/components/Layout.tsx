import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import Button from "./Button";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const { isOnline } = useNetworkStatus();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <header className="bg-white dark:bg-slate-950 flex items-center justify-between w-full px-6 py-4 border-b-2 border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {location.pathname !== "/" && location.pathname !== "/history" && location.pathname !== "/ehr" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)} 
              icon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
            >
              BACK
            </Button>
          )}
          <div className="flex items-center gap-2">
            <img 
              src="https://www.google.com/s2/favicons?domain=hippocrate.org&sz=128" 
              alt="Hippocrate Logo" 
              className="h-6 md:h-8 w-auto object-contain rounded-sm"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div 
            title={isOnline ? "Firestore offline persistence enabled - data cached locally" : "Working offline - all changes saved locally and will sync when reconnected"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border transition-all ${
              isOnline 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" 
                : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700 shadow-sm"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>{isOnline ? "Offline Ready" : "Offline (Persisted)"}</span>
          </div>

          <span className="font-mono text-[10px] tracking-widest text-outline uppercase hidden md:inline-block">
            Status: {user ? "AUTHORIZED" : "UNAUTHORIZED"}
          </span>
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {user.displayName || "Dr. Smith"}
              </span>
            </div>
          )}
          {user ? (
            <Button 
              onClick={signOut} 
              size="sm" 
              variant="outline" 
              icon={<span className="material-symbols-outlined text-sm">account_circle</span>}
            >
              LOGOUT
            </Button>
          ) : (
            <Button onClick={signIn} size="sm" variant="outline">
              LOGIN
            </Button>
          )}
        </div>
      </header>

      <main className="flex-grow w-full pb-32">
        <Outlet />
      </main>

      {!location.pathname.startsWith("/visit") && (
        <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 sm:px-4 py-3 bg-white dark:bg-slate-950 border-t-2 border-slate-100 dark:border-slate-800 z-50 gap-2">
          <Button
            href="/"
            variant={location.pathname === "/" ? "primary" : "ghost"}
            fullWidth
            size="sm"
            className="flex-col sm:flex-row !gap-1 sm:!gap-2 py-2 px-1 sm:px-4"
          >
            <span className="material-symbols-outlined text-xl sm:text-lg" style={{ fontVariationSettings: location.pathname === "/" ? "'FILL' 1" : "'FILL' 0" }}>calendar_today</span>
            <span className="text-[10px] sm:text-sm">SCHEDULE</span>
          </Button>
          <Button
            href="/history"
            variant={location.pathname === "/history" ? "primary" : "ghost"}
            fullWidth
            size="sm"
            className="flex-col sm:flex-row !gap-1 sm:!gap-2 py-2 px-1 sm:px-4"
          >
            <span className="material-symbols-outlined text-xl sm:text-lg" style={{ fontVariationSettings: location.pathname === "/history" ? "'FILL' 1" : "'FILL' 0" }}>history</span>
            <span className="text-[10px] sm:text-sm">ENCOUNTERS</span>
          </Button>
        </nav>
      )}
    </div>
  );
}
