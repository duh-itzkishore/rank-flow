import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section, SectionKicker, DisplayHeading } from "./section-shell";

const faqs = [
  { q: "How does RankFlow work?", a: "We run your prompts across ChatGPT, Gemini, Claude, and Perplexity on a schedule and analyze every response for brand mentions, sentiment, and ranking position." },
  { q: "Which AI models do you support?", a: "ChatGPT (GPT-4o, o1, o3-mini), Gemini 2.0 Pro/Flash, Claude 3.5 Sonnet and 3 Opus, and Perplexity Sonar Pro/Reasoning. We add new models as they launch." },
  { q: "What is GEO (Generative Engine Optimization)?", a: "GEO is the process of optimizing web content so that it is easily found, summarized, and cited by AI search assistants when answering user queries. It is the modern evolution of traditional SEO." },
  { q: "How can we improve our brand's AI Visibility Score?", a: "RankFlow analyzes responses to find content gaps. You can improve your visibility score by structuring content clearly, answering user questions directly, using structured markdown schemas, and ensuring your documentation is indexed by search crawlers." },
  { q: "How does AI optimization differ from traditional SEO?", a: "SEO focuses on ranking pages by search queries and links. AI optimization focuses on synthesis. AI engines synthesize answers from multiple sources, meaning you need to provide clear, high-authority summaries that AI models can easily digest and cite as primary references." },
  { q: "How often is my data refreshed?", a: "Pro plans refresh daily. Enterprise supports real-time and custom cadences." },
  { q: "Can I track competitors?", a: "Yes — up to 10 competitors on Pro and unlimited on Enterprise, with side-by-side visibility comparisons." },
  { q: "Is there a free trial?", a: "Yes, 14 days free on any plan. No credit card required." },
  { q: "Do you offer an API?", a: "Yes, Enterprise plans include full API access and webhook alerts." },
];

export function FAQ() {
  return (
    <Section id="faq" tone="light" className="bg-white py-28">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Heading */}
          <div className="lg:col-span-1 lg:sticky lg:top-28">
            <SectionKicker label="Questions" />
            <DisplayHeading className="text-gray-900 text-left">
              Questions,<br />answered.
            </DisplayHeading>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-sm">
              Everything you need to know about tracking citations, visibility indexes, and GEO processes.
            </p>
          </div>

          {/* Right Accordion */}
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-2xl border border-gray-200 bg-[#fafafa] px-6 data-[state=open]:border-indigo-500/30 data-[state=open]:bg-white hover:border-gray-300 transition-colors"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline text-gray-900 py-4.5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 leading-relaxed pb-5 pt-1">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </Section>
  );
}
