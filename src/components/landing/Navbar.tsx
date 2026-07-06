import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

export function Navbar() {
  const [currentTone, setCurrentTone] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sectionTones: Record<string, "dark" | "light"> = {
      "hero": "dark",
      "trusted-by": "light",
      "case-studies": "dark",
      "features": "light",
      "transformation": "dark",
      "how-it-works": "light",
      "models": "dark",
      "dashboard": "light",
      "pricing": "dark",
      "geo-experiments": "light",
      "testimonials": "dark",
      "faq": "light",
      "cta-band": "dark"
    };

    const handleScroll = () => {
      const navbarHeight = 70;
      const sections = [
        "hero",
        "trusted-by",
        "case-studies",
        "features",
        "transformation",
        "how-it-works",
        "models",
        "dashboard",
        "pricing",
        "geo-experiments",
        "testimonials",
        "faq",
        "cta-band"
      ];
      
      let detectedSection = "hero";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the top of this section is above the center of the navbar,
          // and the bottom of this section is below the center of the navbar.
          if (rect.top <= navbarHeight && rect.bottom >= navbarHeight) {
            detectedSection = id;
            break;
          }
        }
      }

      const tone = sectionTones[detectedSection] || "dark";
      setCurrentTone(tone);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();
    
    const timer = setTimeout(handleScroll, 150);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const isNavbarDark = currentTone === "light"; // White section -> Black/Dark navbar

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavbarDark
          ? "bg-[#07070a]/85 backdrop-blur-md border-b border-white/5 shadow-lg py-3"
          : "bg-white/90 backdrop-blur-md border-b border-gray-200/40 shadow-sm py-3.5"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          to="/"
          className={`flex items-center gap-2 transition-colors ${
            isNavbarDark ? "text-white" : "text-gray-900"
          }`}
        >
          <Logo className={`w-5 h-5 sm:w-6 sm:h-6 ${isNavbarDark ? "text-indigo-400" : "text-indigo-600"}`} />
          <span className="text-[15px] font-semibold tracking-tight">RankFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className={`inline-flex items-center gap-1 text-[13px] font-semibold transition-colors ${
              isNavbarDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Toolkit <ChevronDown className="w-3.5 h-3.5" />
          </a>
          <a
            href="#pricing"
            className={`text-[13px] font-semibold transition-colors ${
              isNavbarDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Plans
          </a>
          <a
            href="#faq"
            className={`text-[13px] font-semibold transition-colors ${
              isNavbarDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            News
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className={`text-[13px] font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
              isNavbarDark
                ? "bg-white text-gray-950 hover:bg-white/90 shadow-md shadow-white/5"
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
            }`}
          >
            Get Started
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`md:hidden w-9.5 h-9.5 grid place-items-center rounded-full transition-colors ${
              isNavbarDark
                ? "text-white hover:bg-white/10"
                : "text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`md:hidden absolute left-4 right-4 top-full mt-2 rounded-2xl ring-1 px-5 py-4 flex flex-col gap-1.5 animate-fade-up shadow-xl ${
          isNavbarDark 
            ? "bg-[#07070a]/95 text-white ring-white/10" 
            : "bg-white/95 text-gray-900 ring-gray-200/50"
        }`}>
          {[
            { label: "Toolkit", href: "#features" },
            { label: "Plans", href: "#pricing" },
            { label: "News", href: "#faq" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`block text-[14px] font-semibold border-b last:border-b-0 py-3 ${
                isNavbarDark 
                  ? "text-gray-300 hover:text-white border-white/5" 
                  : "text-gray-700 hover:text-gray-900 border-gray-100"
              }`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
