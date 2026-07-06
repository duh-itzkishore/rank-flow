import { Section, SectionKicker } from "./section-shell";

const featured = {
  quote: "We finally understand how AI models talk about our brand. RankFlow is the missing layer between SEO and the answer engines — I can't imagine shipping content without it.",
  author: "Sarah Chen",
  role: "Head of Growth, Linear",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
};

const others = [
  {
    quote: "The competitor tracking alone saved us from a positioning disaster. Genuine 10x tool.",
    author: "Marcus Reed",
    role: "CMO, Framerly",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
  },
  {
    quote: "Setup took 10 minutes and we had actionable insight the same day. The dashboard is gorgeous.",
    author: "Priya Patel",
    role: "Founder, Notionly",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80"
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials" tone="dark" stagger className="bg-[#07070a] py-20 sm:py-28 border-y border-white/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <SectionKicker label="Loved by teams" />
        </div>

        {/* Featured editorial quote */}
        <figure className="mx-auto max-w-4xl text-center mb-20">
          <span
            aria-hidden
            className="block text-8xl leading-none text-indigo-400/20 font-normal select-none"
            style={{ fontFamily: "Georgia, serif" }}
          >
            “
          </span>
          <blockquote className="-mt-8 text-xl sm:text-2xl lg:text-3xl font-semibold leading-[1.3] tracking-tight text-white">
            {featured.quote}
          </blockquote>
          <figcaption className="mt-8 inline-flex items-center gap-3">
            <img
              src={featured.avatar}
              alt={featured.author}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-500/30"
            />
            <div className="text-left">
              <span className="block text-sm font-semibold text-white">{featured.author}</span>
              <span className="block text-xs text-gray-400">{featured.role}</span>
            </div>
          </figcaption>
        </figure>

        {/* Grid cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {others.map((t) => (
            <blockquote
              key={t.author}
              className="rounded-3xl bg-white/[0.01] border border-white/5 p-8 hover:border-indigo-500/25 hover:bg-white/[0.03] transition-all duration-300"
            >
              <div className="flex gap-1 text-amber-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="text-sm">★</span>
                ))}
              </div>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-300">"{t.quote}"</p>
              <footer className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                />
                <div>
                  <div className="text-sm font-semibold text-white">{t.author}</div>
                  <div className="text-xs text-gray-400 font-medium">{t.role}</div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </Section>
  );
}
