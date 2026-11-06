import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

export default function Login() {
  const { signIn, signInDemo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signIn();
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMessage(err?.message || "Failed to sign in. Please try again or use Demo Clinician access.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      signInDemo("Dr. Smith");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden">
      {/* Background ambient medical glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full px-6 py-6 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img 
            src="https://www.google.com/s2/favicons?domain=hippocrate.org&sz=128" 
            alt="Hippocrate Logo" 
            className="h-8 w-8 object-contain rounded-lg shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
              Clinical Clarity
            </span>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full">
              Clinician Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>EHR System Active</span>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-800">
          
          {/* Hospital / Stethoscope Icon */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100 dark:border-indigo-900/40">
            <span className="material-symbols-outlined text-3xl">stethoscope</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Physician Sign In
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Sign in with your hospital account to access Today's Schedule and patient charts.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">error</span>
              <p className="flex-1 font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Primary Google Login Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-sm border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? "Signing In..." : "Sign in with Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Or Quick Access
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Fast Demo Clinician Login */}
            <Button
              onClick={handleDemoSignIn}
              disabled={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className="py-4 shadow-xl shadow-indigo-500/20"
              icon={<span className="material-symbols-outlined">badge</span>}
            >
              Sign In as Dr. Smith
            </Button>
          </div>

          {/* Clinical Security Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">verified_user</span>
              HIPAA Compliant
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-indigo-500">lock</span>
              Encrypted Session
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/40 dark:border-slate-800/40">
        Clinical Clarity AI • Ambient Scribe & Schedule Management • Authorized Medical Personnel Only
      </footer>
    </div>
  );
}
