export default function HeroSection() {
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
          <a
            href="/api/auth/login"
            className="inline-block bg-white text-primary-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started Free
          </a>
          <p className="mt-4 text-sm text-primary-200">
            Sign in with Google to start practicing
          </p>
        </div>
      </div>
    </section>
  );
}
