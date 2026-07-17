You are the Lead Architect responsible for designing and implementing the complete crawling platform for this project. This is not a single crawler but a modular, event-driven Crawl Platform that powers all current and future product features.

## Objective
Build a scalable, adaptive, extensible crawling system that supports:
- Technical SEO audits
- Generative Engine Optimization (GEO/AEO)
- Browser Extension quick analysis
- robots.txt generation
- llms.txt generation
- AI Visibility scoring
- Content optimization
- Competitor analysis
- Historical monitoring
- Future AI search integrations

## Core Principles

1. Modular Architecture
Every responsibility must exist as an independent module. The orchestrator coordinates work; modules do not depend on each other directly.

2. Event-Driven Processing
All stages publish and consume events. Crawlers never invoke analyzers directly. Design clear event contracts (e.g., page.discovered, page.fetched, dom.extracted, analysis.completed).

3. Adaptive Crawl Strategy
Implement a Crawl Strategy Engine that selects the optimal fetcher based on page characteristics:
- Static HTML → Cheerio
- JavaScript-rendered → Playwright
- Authenticated flows → Playwright contexts
- SERP analysis → SERP engine
- AI visibility checks → LLM/API integrations

4. Crawl Budget Optimization
Avoid unnecessary rendering. Prefer lightweight HTTP fetches first, escalate only when required. Deduplicate URLs, detect crawl traps, honor robots.txt, prioritize canonical and sitemap URLs, and maintain a crawl frontier with configurable depth and concurrency.

5. Shared Extraction Pipeline
Normalize every crawled page into reusable structured data (metadata, headings, links, schema, text, media, DOM snapshot). All analyzers consume this normalized output.

6. Extensible Analyzers
Implement analyzers as plug-ins that subscribe to events. Initial analyzers include Technical SEO, GEO/AEO, AI Readiness, Link Graph, Structured Data, Content Quality, robots.txt Validator, and llms.txt Generator. New analyzers should be addable without changing the crawler core.

7. Data Persistence
Store:
- Raw HTML
- Rendered DOM (when applicable)
- HTTP metadata
- Extracted entities
- Link graph
- Structured data
- Analysis results
- Historical crawl snapshots

8. APIs and Outputs
Expose structured APIs that serve dashboards, browser extensions, reports, alerts, and future modules. Ensure outputs are consistent, versioned, and evidence-based.

## Non-Functional Requirements
- High concurrency with configurable limits
- Retry and backoff strategies
- Queue-based execution
- Observability (logging, metrics, tracing)
- Fault isolation between modules
- Scalable worker architecture
- Testable interfaces
- Type-safe contracts
- Minimal coupling

## Technology Guidelines
- Crawlee for orchestration and scaling
- Cheerio for static parsing
- Playwright for dynamic rendering
- Selenium only where Playwright is insufficient
- Redis/BullMQ (or equivalent) for queues
- PostgreSQL for persistence
- LLM APIs for semantic analysis only after crawl evidence is available

## Deliverables
Design and implement the crawling platform incrementally:
1. Define the overall architecture and module interfaces.
2. Build the orchestrator and event bus.
3. Implement fetchers and URL discovery.
4. Implement normalization and storage.
5. Add analyzers one by one.
6. Expose APIs for product features.
7. Ensure every component is independently testable and extensible.

Prioritize clean architecture, maintainability, and future expansion over short-term feature delivery.