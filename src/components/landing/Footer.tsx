import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative bg-[#07070a] text-gray-400 border-t border-white/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 py-16 sm:py-20">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white">
              <Logo className="w-5.5 h-5.5 text-indigo-500" />
              <span className="text-[15px] font-semibold tracking-tight">RankFlow</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-gray-400 leading-relaxed">
              Track how your brand appears across every major AI model. Purpose-built for modern marketing teams.
            </p>
            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-indigo-400/80">
              Made for the answer-engine era.
            </p>
          </div>
          {[
            { title: "Product", links: ["Features", "AI Models", "Pricing", "Changelog"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-gray-500">© 2026 RankFlow. All rights reserved.</p>
          <p className="text-xs text-gray-500 font-serif italic">Get cited. Effortlessly.</p>
        </div>
      </div>
    </footer>
  );
}
