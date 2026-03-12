import { useState, useEffect } from "react";

export default function HeroSection() {
  const [providers, setProviders] = useState<{ google: boolean; microsoft: boolean }>({ google: true, microsoft: false });

  useEffect(() => {
    fetch("/api/auth/providers", { credentials: "include" })
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 animate-fade-in">
            Practice Your Pitch with{" "}
            <span className="text-primary-200">AI Executives</span>
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-8 leading-relaxed">
            Sharpen your consulting skills by role-playing with AI-powered
            executives. Practice negotiations, handle objections, and build
            confidence before your next big meeting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/api/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </a>

            {providers.microsoft && (
              <a
                href="/api/auth/login/microsoft"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                Sign in with Microsoft
              </a>
            )}
          </div>

          <p className="mt-4 text-sm text-primary-200">
            Sign in to start practicing
          </p>
        </div>
      </div>
    </section>
  );
}
