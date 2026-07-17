import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { BarChart as LucideBarChart, Copy, CheckCheck, Table, Code, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

export function ChartGenerator() {
  const [title, setTitle] = useState("AI Visibility Comparison");
  const [description, setDescription] = useState("Brand visibility score across leading search and answer engines.");
  const [xAxisLabel, setXAxisLabel] = useState("Month");
  const [yAxisLabel, setYAxisLabel] = useState("Score");
  
  // Data rows
  const [dataInput, setDataInput] = useState(
    "Jan,45,30\nFeb,52,38\nMar,68,45\nApr,82,50\nMay,89,52"
  );
  
  const [seriesName, setSeriesName] = useState("Our Brand");
  const [series2Name, setSeries2Name] = useState("Competitor Avg");

  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);

  // Parse data
  const parseData = () => {
    const lines = dataInput.split("\n").filter(Boolean);
    return lines.map((line) => {
      const parts = line.split(",").map(p => p.trim());
      return {
        label: parts[0] || "",
        value1: Number(parts[1]) || 0,
        value2: Number(parts[2]) || 0
      };
    });
  };

  const chartData = parseData();

  // Generate HTML table markup
  const generateTableHtml = () => {
    return `<table class="aeo-chart-data" summary="${description}">
  <caption>${title}</caption>
  <thead>
    <tr>
      <th scope="col">${xAxisLabel}</th>
      <th scope="col">${seriesName}</th>
      <th scope="col">${series2Name}</th>
    </tr>
  </thead>
  <tbody>
    ${chartData.map(row => `<tr>
      <td>${row.label}</td>
      <td>${row.value1}</td>
      <td>${row.value2}</td>
    </tr>`).join("\n    ")}
  </tbody>
</table>`;
  };

  // Generate JSON-LD schema
  const generateJsonLd = () => {
    const json = {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": title,
      "description": description,
      "variableMeasured": [
        {
          "@type": "PropertyValue",
          "name": seriesName,
          "description": "Visibility score of our brand"
        },
        {
          "@type": "PropertyValue",
          "name": series2Name,
          "description": "Average visibility score of leading competitors"
        }
      ],
      "temporalCoverage": "2026",
      "creator": {
        "@type": "Organization",
        "name": "RankFlow Optimization"
      }
    };
    return JSON.stringify(json, null, 2);
  };

  const copyToClipboard = (text: string, setCopied: (b: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Inputs Form */}
      <div className="lg:col-span-1 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4 h-fit">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <LucideBarChart className="w-5 h-5 text-indigo-400" />
          AI-Readable Chart Builder
        </h2>
        <p className="text-xs text-white/40 leading-relaxed">
          Answer engines cannot "see" chart pixels. Build charts that generate semantic HTML tables & Dataset schema markup so AI crawlers can fetch your research data.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1">Chart Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
            />
          </div>

          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1">Description / Capton</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1">Series 1 Label</label>
              <input
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1">Series 2 Label</label>
              <input
                type="text"
                value={series2Name}
                onChange={(e) => setSeries2Name(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider font-semibold block mb-1">
              Data Input (Label, Series 1, Series 2)
            </label>
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              className="w-full rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2 text-xs text-white/80 outline-none focus:border-indigo-500/40 h-28 resize-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Visual & Code Outputs */}
      <div className="lg:col-span-2 space-y-6">
        {/* Chart View */}
        <div className="rounded-2xl bg-[#18181a] ring-1 ring-white/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#242427", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11, color: "#fff" }} />
                <Area type="monotone" name={seriesName} dataKey="value1" stroke="#6366f1" strokeWidth={2} fill="url(#visGrad)" />
                <Area type="monotone" name={series2Name} dataKey="value2" stroke="rgba(255, 255, 255, 0.25)" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Semantic HTML Table */}
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Semantic HTML Table (AI Scraper Target)</h3>
            </div>
            <button
              onClick={() => copyToClipboard(generateTableHtml(), setCopiedTable)}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {copiedTable ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTable ? "Copied!" : "Copy Table"}
            </button>
          </div>
          <p className="text-[11px] text-white/35">
            Embed this HTML block immediately adjacent to the chart. Search crawlers index this block to extract the exact data points for AI citations.
          </p>

          <pre className="bg-black/35 rounded-xl border border-white/5 p-4 text-[10px] text-white/50 overflow-auto font-mono max-h-40 leading-normal">
            {generateTableHtml()}
          </pre>
        </div>

        {/* JSON-LD Schema */}
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">JSON-LD Dataset Schema</h3>
            </div>
            <button
              onClick={() => copyToClipboard(generateJsonLd(), setCopiedJson)}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {copiedJson ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedJson ? "Copied!" : "Copy Schema"}
            </button>
          </div>
          <p className="text-[11px] text-white/35">
            Include this in your page's &lt;head&gt; script tag. It signals Google and OpenAI that your page hosts a structured dataset.
          </p>

          <pre className="bg-black/35 rounded-xl border border-white/5 p-4 text-[10px] text-white/50 overflow-auto font-mono max-h-40 leading-normal">
            {generateJsonLd()}
          </pre>
        </div>
      </div>
    </div>
  );
}
