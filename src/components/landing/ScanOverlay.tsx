import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Globe, Search, ShieldCheck, Zap } from "lucide-react";

interface ScanOverlayProps {
  url: string;
  onComplete: () => void;
}

export function ScanOverlay({ url, onComplete }: ScanOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Globe, text: "Crawling website structure..." },
    { icon: ShieldCheck, text: "Evaluating Robots.txt & Sitemap..." },
    { icon: Search, text: "Analyzing schema tags..." },
    { icon: Zap, text: "Calculating AI visibility score..." }
  ];

  useEffect(() => {
    // Progress through steps every 1.2s
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 mb-4">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white">Analyzing {url}</h3>
          <p className="text-sm text-gray-400 mt-2">Running technical SEO & AEO scan</p>
        </div>

        <div className="space-y-4 mt-8">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const StepIcon = step.icon;

            return (
              <div 
                key={index}
                className={`flex items-center gap-3 transition-opacity duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : (
                    <StepIcon className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <span className={`text-sm ${isActive ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
