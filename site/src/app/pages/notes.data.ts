// Single source of truth for the Field Notes index. Adding a post = append one entry
// here (newest first) + add the matching <article id="slug"> block in notes.ts.
// The /notes index AND the home-page teaser both render from this array.
export interface NoteMeta {
  slug: string;
  date: string; // YYYY-MM-DD
  tag: string;
  title: string;
  dek: string; // teaser-length summary
}

export const NOTES_META: NoteMeta[] = [
  {
    slug: 'ai-power-rankings',
    date: '2026-06-14',
    tag: 'Power rankings · forecast',
    title: 'The AI Power Rankings: grading the people building the future — and forecasting who wins next',
    dek: 'A mid-2026 scorecard + forecast on the six who matter most — Altman, Musk, Amodei, Pichai, Huang, Liang — from someone who pays these labs as a customer and tracks them as an analyst.',
  },
  {
    slug: 'cost-collapsing-prices-record',
    date: '2026-06-14',
    tag: 'Synthesis · the 2026 story',
    title: 'The cost of AI is collapsing while the companies making it sit at record highs',
    dek: 'The 2026 story in one gap: inference racing toward zero — cheapest capable supply now Chinese — against all-time-high frontier valuations. How durable is a moat built on owning the frontier?',
  },
  {
    slug: 'ai-da-fenhua-zh',
    date: '2026-06-14',
    tag: '中文 · 简体',
    title: 'AI 大分化：为什么智能越来越便宜，而卖智能的公司却越来越贵',
    dek: '一位开发者的 2026 年中 AI 经济与估值实地指南——从 token 价格，到万亿美元级别的 IPO。（简体中文，含语音朗读）',
  },
  {
    slug: 'musk-empire-overvalued',
    date: '2026-06-13',
    tag: 'Valuation · geopolitics',
    title: 'Is Musk’s $1T+ empire overvalued — and are US import controls hiding it?',
    dek: 'Tesla trades near 350× earnings while BYD outsells it behind a 100% tariff wall; SpaceX’s launch moat is real but priced for permanence; ~80% of Musk’s fortune rides one IPO mark.',
  },
  {
    slug: 'compute-is-the-asset',
    date: '2026-06-12',
    tag: 'Capital · compute',
    title: 'Compute is the asset: 2026’s AI story is vertical integration and circular capital',
    dek: 'A few vertically integrated giants are buying the entire stack — capital, compute, and now orbit. Anthropic $965B, OpenAI $852B, SpaceX+xAI ~$1.25T.',
  },
  {
    slug: 'wests-ai-subscriptions-vs-china',
    date: '2026-06-10',
    tag: 'Pricing · build the product',
    title: 'The West’s heaviest AI subscriptions all cost about the same. China’s cost a tenth — or less.',
    dek: 'Western “max” tiers cluster at $200–300/mo; China’s API floor (DeepSeek/Qwen/GLM) runs 20–40× cheaper at ~90–95% of the capability.',
  },
  {
    slug: 'build-vs-buy-web-search',
    date: '2026-06-08',
    tag: 'Build vs buy · search',
    title: 'Build vs buy, but for web search',
    dek: 'On a cheap-LLM stack, search is often a bigger line item than the model itself. Tavily vs self-hosted SearXNG, with the ~10k–20k searches/mo break-even.',
  },
];
