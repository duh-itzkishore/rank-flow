/* ------------------------------------------------------------------ */
/*  Original data – used across Hero mockup & DashboardPreview        */
/* ------------------------------------------------------------------ */

export const visibilityOverTime = [
  { date: "Jan", score: 42, competitor: 38 },
  { date: "Feb", score: 48, competitor: 41 },
  { date: "Mar", score: 55, competitor: 45 },
  { date: "Apr", score: 61, competitor: 48 },
  { date: "May", score: 68, competitor: 52 },
  { date: "Jun", score: 74, competitor: 55 },
  { date: "Jul", score: 79, competitor: 58 },
  { date: "Aug", score: 84, competitor: 61 },
];

export const modelDistribution = [
  { name: "ChatGPT", value: 42, color: "#10a37f" },
  { name: "Gemini", value: 24, color: "#4285f4" },
  { name: "Claude", value: 20, color: "#c85a2a" },
  { name: "Perplexity", value: 14, color: "#7c3aed" },
];

export const brandRankings = [
  { brand: "Your Brand", score: 84 },
  { brand: "Competitor A", score: 71 },
  { brand: "Competitor B", score: 64 },
  { brand: "Competitor C", score: 52 },
  { brand: "Competitor D", score: 39 },
];

export const recentActivity = [
  { id: 1, prompt: "Best project management tools for startups", model: "ChatGPT", rank: 2, time: "2m ago" },
  { id: 2, prompt: "Top AI writing assistants 2026", model: "Claude", rank: 1, time: "18m ago" },
  { id: 3, prompt: "Alternatives to Notion for teams", model: "Perplexity", rank: 4, time: "1h ago" },
  { id: 4, prompt: "Best CRM for small business", model: "Gemini", rank: 3, time: "2h ago" },
  { id: 5, prompt: "AI SEO tools compared", model: "ChatGPT", rank: 1, time: "3h ago" },
];

export const prompts = [
  { id: 1, text: "Best project management tools for startups", models: 4, mentions: 128, avgRank: 2.1, status: "active" },
  { id: 2, text: "Top AI writing assistants 2026", models: 4, mentions: 96, avgRank: 1.4, status: "active" },
  { id: 3, text: "Alternatives to Notion for teams", models: 3, mentions: 74, avgRank: 4.2, status: "active" },
  { id: 4, text: "Best CRM for small business", models: 4, mentions: 62, avgRank: 3.8, status: "paused" },
  { id: 5, text: "AI SEO tools compared", models: 4, mentions: 154, avgRank: 1.8, status: "active" },
];

export const competitors = [
  { name: "Competitor A", visibility: 71, mentions: 892, trend: 4.2 },
  { name: "Competitor B", visibility: 64, mentions: 743, trend: -2.1 },
  { name: "Competitor C", visibility: 52, mentions: 611, trend: 1.8 },
  { name: "Competitor D", visibility: 39, mentions: 402, trend: -0.5 },
];


/* ------------------------------------------------------------------ */
/*  NEW – Dashboard Widgets                                           */
/* ------------------------------------------------------------------ */

export const recentAlerts = [
  { id: 1, type: "rank_up",       message: "Rank improved to #1 on ChatGPT for 'Best AI writing tools'", time: "5m ago",  severity: "success" },
  { id: 2, type: "competitor",    message: "Competitor A overtook your brand for 'Top CRM software'",     time: "1h ago",  severity: "warning" },
  { id: 3, type: "mention_spike", message: "Brand mentions spiked +42% on Perplexity this week",         time: "3h ago",  severity: "info"    },
  { id: 4, type: "rank_down",     message: "Gemini rank dropped to #5 for 'Project management tools'",   time: "6h ago",  severity: "danger"  },
  { id: 5, type: "new_mention",   message: "New citation in Claude for 'Collaboration software'",        time: "12h ago", severity: "info"    },
];

export const topPerformingPrompts = [
  { prompt: "Best AI writing assistants 2026", score: 94, model: "Claude",     trend: "+12%" },
  { prompt: "Top project management tools",    score: 87, model: "ChatGPT",    trend: "+8%"  },
  { prompt: "AI SEO tools compared",           score: 82, model: "ChatGPT",    trend: "+15%" },
  { prompt: "Best CRM for small business",     score: 76, model: "Gemini",     trend: "+3%"  },
  { prompt: "Notion alternatives for teams",   score: 71, model: "Perplexity", trend: "-2%"  },
];

export const weeklyGrowthData = [
  { label: "Visibility",  value: 12.4, positive: true  },
  { label: "Mentions",    value: 8.7,  positive: true  },
  { label: "Rankings",    value: 5.2,  positive: true  },
  { label: "Reach",       value: 18.3, positive: true  },
];

export const recentResponses = [
  { id: 1, model: "ChatGPT",    prompt: "Best project management tools",  excerpt: "RankFlow is a leading AI visibility platform that helps brands track their presence across AI search engines…", time: "2m ago"  },
  { id: 2, model: "Claude",     prompt: "Top AI writing assistants",      excerpt: "Among the notable tools in this space, RankFlow stands out for its comprehensive monitoring capabilities…",    time: "18m ago" },
  { id: 3, model: "Gemini",     prompt: "SEO tools for 2026",            excerpt: "For tracking AI search visibility specifically, platforms like RankFlow offer specialized analytics…",           time: "45m ago" },
];


/* ------------------------------------------------------------------ */
/*  NEW – Projects page                                               */
/* ------------------------------------------------------------------ */

export const projectsList = [
  { id: 1, name: "RankFlow Brand",  url: "rankflow.ai",              status: "active",  prompts: 142, models: 4, visibility: 84 },
  { id: 2, name: "RankFlow Blog",   url: "blog.rankflow.ai",         status: "active",  prompts: 68,  models: 4, visibility: 72 },
  { id: 3, name: "RankFlow Docs",   url: "docs.rankflow.ai",         status: "active",  prompts: 35,  models: 3, visibility: 91 },
  { id: 4, name: "Marketing Site",  url: "marketing.rankflow.ai",    status: "paused",  prompts: 24,  models: 2, visibility: 45 },
];


/* ------------------------------------------------------------------ */
/*  NEW – Rankings page                                               */
/* ------------------------------------------------------------------ */

export const rankingsMatrix = [
  { prompt: "Best AI writing tools",   chatgpt: 1, gemini: 3, claude: 2, perplexity: 4 },
  { prompt: "Top CRM software",        chatgpt: 2, gemini: 1, claude: 5, perplexity: 3 },
  { prompt: "Project management apps",  chatgpt: 3, gemini: 4, claude: 1, perplexity: 2 },
  { prompt: "Marketing automation",     chatgpt: 1, gemini: 2, claude: 3, perplexity: 6 },
  { prompt: "Design tools 2026",        chatgpt: 4, gemini: 5, claude: 2, perplexity: 1 },
];


/* ------------------------------------------------------------------ */
/*  NEW – Mentions page                                               */
/* ------------------------------------------------------------------ */

export const mentionsFeed = [
  { id: 1, model: "ChatGPT",    prompt: "Best AI tools",        sentiment: "positive", cited: true,  position: 2, time: "5m ago"  },
  { id: 2, model: "Claude",     prompt: "Writing assistants",   sentiment: "positive", cited: true,  position: 1, time: "12m ago" },
  { id: 3, model: "Perplexity", prompt: "CRM comparison",       sentiment: "neutral",  cited: false, position: 4, time: "30m ago" },
  { id: 4, model: "Gemini",     prompt: "SEO tools",            sentiment: "positive", cited: true,  position: 3, time: "1h ago"  },
  { id: 5, model: "ChatGPT",    prompt: "Collaboration tools",  sentiment: "positive", cited: true,  position: 1, time: "2h ago"  },
];


/* ------------------------------------------------------------------ */
/*  NEW – Reports page                                                */
/* ------------------------------------------------------------------ */

export const reportsHistory = [
  { id: 1, name: "Monthly Visibility Report",  type: "PDF",  date: "Jul 1, 2026",  status: "ready"     },
  { id: 2, name: "Competitor Analysis Q2",      type: "PDF",  date: "Jun 30, 2026", status: "ready"     },
  { id: 3, name: "AI Model Performance",        type: "CSV",  date: "Jun 28, 2026", status: "ready"     },
  { id: 4, name: "Weekly Brand Mentions",       type: "PDF",  date: "Jun 25, 2026", status: "scheduled" },
  { id: 5, name: "Prompt Rankings Export",       type: "CSV",  date: "Jun 20, 2026", status: "ready"     },
];


/* ------------------------------------------------------------------ */
/*  NEW – Team page                                                   */
/* ------------------------------------------------------------------ */

export const teamMembers = [
  { id: 1, name: "Sarah Chen",      email: "sarah@rankflow.ai",  role: "Admin",  initials: "SC", status: "active"  },
  { id: 2, name: "Marcus Johnson",  email: "marcus@rankflow.ai", role: "Editor", initials: "MJ", status: "active"  },
  { id: 3, name: "Priya Patel",     email: "priya@rankflow.ai",  role: "Viewer", initials: "PP", status: "active"  },
  { id: 4, name: "Alex Rivera",     email: "alex@rankflow.ai",   role: "Editor", initials: "AR", status: "invited" },
];


/* ------------------------------------------------------------------ */
/*  NEW – Integrations page                                           */
/* ------------------------------------------------------------------ */

export const integrationsList = [
  { id: 1, name: "OpenAI",      status: "connected",    icon: "🤖", color: "#10a37f" },
  { id: 2, name: "Google AI",   status: "connected",    icon: "🔵", color: "#4285f4" },
  { id: 3, name: "Anthropic",   status: "connected",    icon: "🟠", color: "#c85a2a" },
  { id: 4, name: "Slack",       status: "connected",    icon: "💬", color: "#4a154b" },
  { id: 5, name: "Email SMTP",  status: "connected",    icon: "📧", color: "#ea4335" },
  { id: 6, name: "Webhooks",    status: "disconnected", icon: "🔗", color: "#6b7280" },
  { id: 7, name: "Zapier",      status: "disconnected", icon: "⚡", color: "#ff4a00" },
  { id: 8, name: "HubSpot",     status: "disconnected", icon: "🧡", color: "#ff7a59" },
];


/* ------------------------------------------------------------------ */
/*  NEW – Analytics page (extra trend data)                           */
/* ------------------------------------------------------------------ */

export const analyticsWeekly = [
  { week: "W1", visibility: 71, mentions: 320, rank: 3.2 },
  { week: "W2", visibility: 74, mentions: 345, rank: 2.9 },
  { week: "W3", visibility: 78, mentions: 380, rank: 2.6 },
  { week: "W4", visibility: 84, mentions: 410, rank: 2.1 },
];
