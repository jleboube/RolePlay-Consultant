import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";

export default function LandingPage() {
  return (
    <div className="flex-1">
      <HeroSection />
      <FeaturesSection />

      {/* Testimonials / Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Consulting Professionals
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Practicing with the AI CTO helped me anticipate technical objections I never considered.",
                author: "Senior Consultant",
              },
              {
                quote:
                  "The voice interaction makes it feel like a real meeting. Great for building confidence.",
                author: "Sales Engineer",
              },
              {
                quote:
                  "The feedback after each session gives me concrete areas to improve.",
                author: "Account Manager",
              },
            ].map((item) => (
              <div
                key={item.author}
                className="bg-white p-6 rounded-xl border border-gray-200"
              >
                <p className="text-gray-700 italic mb-4">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  &mdash; {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
