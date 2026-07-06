import { useScrollReveal } from "@/hooks/useScrollReveal";

const logos = [
  {
    name: "Linear",
    svg: (
      <svg viewBox="0 0 100 24" className="h-5 fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" className="text-gray-400" />
        <text x="32" y="17" className="font-sans font-bold text-[15px] tracking-tight text-gray-500">Linear</text>
      </svg>
    ),
  },
  {
    name: "Notion",
    svg: (
      <svg viewBox="0 0 100 24" className="h-5 fill-current">
        <rect x="2" y="3" width="18" height="18" rx="3" className="stroke-2 stroke-gray-400 fill-none" />
        <path d="M7 7h3l3 5 3-5h3v10h-2.5V9.5L13.5 14h-1L9.5 9.5V17H7V7z" className="fill-gray-400" />
        <text x="32" y="17" className="font-sans font-bold text-[15px] tracking-tight text-gray-500">Notion</text>
      </svg>
    ),
  },
  {
    name: "Stripe",
    svg: (
      <svg viewBox="0 0 80 24" className="h-5 fill-gray-400 hover:fill-gray-900 transition-colors">
        <path d="M80 12.5c0-4.5-3-6.5-7-6.5-4 0-7 2.5-7 6.5s3 6.5 7 6.5c4 0 7-2 7-6.5zm-11.2 0c0-2.5 1.5-3.5 4.2-3.5s4.2 1 4.2 3.5-1.5 3.5-4.2 3.5-4.2-1-4.2-3.5zm-7.3 6V6.5h-2.5v1.2c-.8-1-2-1.5-3.8-1.5-3.5 0-6 2.5-6 6.5s2.5 6.5 6 6.5c1.8 0 3-.5 3.8-1.5v1.2H61.5zm-9.3-6c0-2.5 1.5-3.5 3.5-3.5s3.5 1 3.5 3.5-1.5 3.5-3.5 3.5-3.5-1-3.5-3.5zm-8.2 6V9h-1.5V6.5H41V4c0-2 1.5-3.5 4-3.5 1 0 1.8.2 2.2.5v2.2a3 3 0 00-1.2-.2c-1.2 0-2 .6-2 1.8v1.7h3.2V9H44v9.5zm-11 0V.5h-2.8v18zm-8 0v-8c0-1.8-1-2.5-2.5-2.5s-2.8.8-2.8 2.5v8H23v-8c0-1.8-1-2.5-2.5-2.5S17.7 10 17.7 11.7v6.3h-2.8v-12h2.5v1c.8-1 2-1.3 3.5-1.3 1.8 0 3.2.7 3.8 2.2.8-1.5 2.2-2.2 4.2-2.2 2.8 0 4.5 1.7 4.5 4.5v7.8zm-22.3-6C2.2 10.3 3 9.8 4.7 9.4c1.8-.4 3-.8 3-1.8 0-.8-.8-1.2-1.8-1.2-1.5 0-3 .5-4.5 1.2V5.2c1.5-.7 3.3-1 4.8-1 3.2 0 4.8 1.5 4.8 4 0 2.8-2 3.5-4.5 4-2 .4-2.5.8-2.5 1.5 0 .8.8 1.2 2.2 1.2 1.8 0 3.8-.7 5.2-1.5v2.4c-1.5.8-3.5 1.2-5.5 1.2C3 19 1.2 17.2 1.2 14.5z" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    svg: (
      <svg viewBox="0 0 100 24" className="h-4.5 fill-current">
        <path d="M12 2L24 22H0L12 2Z" className="text-gray-400" />
        <text x="36" y="17" className="font-sans font-bold text-[15px] tracking-tight text-gray-500">Vercel</text>
      </svg>
    ),
  },
  {
    name: "Figma",
    svg: (
      <svg viewBox="0 0 100 24" className="h-5 fill-current">
        <path d="M6 2h4v4H6zm0 4h4v4H6zm0 4h4v4H6zm4-8h4v4h-4zm0 4h4v4h-4zm0 4a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" className="text-gray-400" />
        <text x="28" y="17" className="font-sans font-bold text-[15px] tracking-tight text-gray-500">Figma</text>
      </svg>
    ),
  },
  {
    name: "Framer",
    svg: (
      <svg viewBox="0 0 100 24" className="h-4.5 fill-current">
        <path d="M4 2h14v6H4zm0 6h14l-7 7v7z" className="text-gray-400" />
        <text x="32" y="17" className="font-sans font-bold text-[15px] tracking-tight text-gray-500">Framer</text>
      </svg>
    ),
  },
];

export function TrustedBy() {
  const { ref, isIntersecting } = useScrollReveal(0.05);

  return (
    <section
      id="trusted-by"
      ref={ref as any}
      className={`relative bg-white pt-24 pb-12 overflow-hidden transition-all duration-700 reveal-on-scroll ${
        isIntersecting ? "revealed" : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.25em] font-semibold text-gray-400">
          <span className="h-px w-6 bg-gray-200" />
          <span>Trusted by fast-growing brands</span>
          <span className="h-px w-6 bg-gray-200" />
        </div>

        <div className="mt-10 w-full overflow-hidden relative">
          {/* Gradient masks for smooth fade edges */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-20 py-2">
            {/* First sequence */}
            {logos.map((logo, idx) => (
              <div
                key={`${logo.name}-${idx}`}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                {logo.svg}
              </div>
            ))}
            {/* Duplicate sequence for infinite scrolling loop */}
            {logos.map((logo, idx) => (
              <div
                key={`${logo.name}-dup-${idx}`}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                {logo.svg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
