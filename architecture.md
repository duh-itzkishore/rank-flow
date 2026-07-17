                           User Request
                                 │
                                 ▼
                      Crawl Orchestrator Service
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
   Crawl Strategy         Feature Selector        Crawl Scheduler
      Engine                                        Queue
          │
          ▼
──────────────────────────────────────────────────────────────────────────────
                    CRAWLER ENGINE LAYER
──────────────────────────────────────────────────────────────────────────────

     Static HTML         Dynamic           SERP           Sitemap
      Crawler            Crawler          Crawler         Crawler
     (Cheerio)       (Playwright)        (Google)          XML
          │               │                 │               │
          └───────────────┼─────────────────┼───────────────┘
                          ▼
                URL Discovery Engine
                          │
                          ▼
                 URL Priority Engine
                          │
                          ▼
                 Crawl Frontier Queue
                          │
                          ▼
               Content Extraction Layer
                          │
                          ▼
                Data Normalization Layer
                          │
                          ▼
──────────────────────────────────────────────────────────────────────────────
                    ANALYSIS ENGINE LAYER
──────────────────────────────────────────────────────────────────────────────

      Technical SEO Analyzer

      GEO / AEO Analyzer

      LLM Readiness Analyzer

      Content Quality Analyzer

      Schema Analyzer

      Link Graph Analyzer

      Image Analyzer

      Page Performance Analyzer

      AI Citation Analyzer

      Duplicate Detection

      Robots Validator

      llms.txt Generator

──────────────────────────────────────────────────────────────────────────────
                      STORAGE LAYER
──────────────────────────────────────────────────────────────────────────────

Raw HTML

DOM Snapshot

Network Requests

Extracted Metadata

Structured Data

Link Graph

Issues

Recommendations

Historical Crawl

SERP Results

LLM Results

──────────────────────────────────────────────────────────────────────────────
                      API LAYER
──────────────────────────────────────────────────────────────────────────────

Dashboard

Browser Extension

Reports

Competitor Analysis

Content Optimizer

AI Visibility

Monitoring

Alerts