# Python Scraping Microservice (Vector 1 UI Scraping)

This microservice provides high-efficiency headless browser scraping for AI Search target environments that lack public APIs (e.g. **Google AI Overviews**, **Perplexity Web UI**, **Bing Copilot**).

## Architecture

```
TypeScript Edge Function / Queue Worker
           │
           ▼ HTTP POST /scrape
 ┌────────────────────────────────────┐
 │ Python FastAPI Microservice        │
 │ (Playwright + Stealth + Proxies)   │
 └────────────────────────────────────┘
           │
 ┌─────────┴─────────┐
 │                   │
 ▼                   ▼
Google AI Overviews  Perplexity Web UI
```

## Running locally

```bash
cd src/crawler/python-scraper
pip install -r requirements.txt
python scraper_bridge.py
```
