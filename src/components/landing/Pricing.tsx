import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Section, SectionKicker, DisplayHeading } from "./section-shell";

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const starterPrice = billingCycle === "monthly" ? "29" : "23";
  const proPrice = billingCycle === "monthly" ? "99" : "79";

  const tiers = [
    {
      name: "Starter",
      price: starterPrice,
      suffix: "/mo",
      desc: "For small brands starting to explore AI visibility.",
      features: ["3 projects", "100 prompts tracked", "2 AI models", "Weekly reports", "Email support"],
      billingInfo: billingCycle === "yearly" ? "Billed annually" : "Billed monthly"
    },
    {
      name: "Pro",
      price: proPrice,
      suffix: "/mo",
      featured: true,
      desc: "For growing teams that need deeper insight and more coverage.",
      features: ["25 projects", "2,000 prompts tracked", "All 4 AI models", "Daily reports & alerts", "10 competitors", "Priority support"],
      billingInfo: billingCycle === "yearly" ? "Billed annually" : "Billed monthly"
    },
    {
      name: "Enterprise",
      price: "Let's talk",
      suffix: "",
      desc: "For large brands with advanced needs and custom integrations.",
      features: ["Unlimited projects", "Unlimited prompts", "All models + custom", "Real-time alerts", "SSO & audit logs", "Dedicated CSM"],
      billingInfo: "Custom terms"
    },
  ];

  return (
    <Section id="pricing" tone="dark" stagger className="bg-[#07070a] py-28">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <SectionKicker label="Plans" />
          <DisplayHeading className="text-white">
            Simple, transparent<br />pricing.
          </DisplayHeading>
          <p className="mt-4 text-sm sm:text-base text-gray-400">Start free. Scale as you grow. Change plans any time.</p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 flex justify-center items-center gap-3 bg-white/5 border border-white/10 p-1 rounded-full w-fit mx-auto">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Billed monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Billed yearly
              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3 items-stretch">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                t.featured
                  ? "bg-[#0f0f15] border-2 border-indigo-500 shadow-[0_24px_48px_-12px_rgba(99,102,241,0.25)] lg:-mt-4 lg:mb-4 text-white"
                  : "bg-white/[0.02] border border-white/5 text-white hover:border-indigo-500/30"
              }`}
            >
              {t.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 text-white px-3.5 py-1 text-[9px] font-bold tracking-widest uppercase shadow-sm">
                  Most Popular
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500">{t.name}</h3>
                  <span className="font-mono text-[10px] text-gray-500">0{tiers.indexOf(t) + 1}</span>
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  {t.price === "Let's talk" ? (
                    <span className="text-4xl font-semibold tracking-tight text-white">{t.price}</span>
                  ) : (
                    <>
                      <span className="text-2xl font-normal text-gray-500">$</span>
                      <span className="text-5xl font-semibold tracking-tight text-white">{t.price}</span>
                      <span className="text-sm font-medium text-gray-400">{t.suffix}</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-indigo-400/80 font-bold mt-1 uppercase tracking-wider">{t.billingInfo}</div>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">{t.desc}</p>
              </div>

              <div className="mt-8">
                <Link
                  to="/auth"
                  className={`block text-center text-sm font-semibold px-6 py-3.5 rounded-full transition-colors ${
                    t.featured
                      ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-md shadow-indigo-600/10"
                      : "bg-white text-gray-950 hover:bg-white/90"
                  }`}
                >
                  Get Started
                </Link>
                <ul className="mt-8 space-y-3.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" strokeWidth={2.5} />
                      <span className="text-gray-300 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
