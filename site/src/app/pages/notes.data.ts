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
    slug: 'cost-collapsing-prices-record',
    date: '2026-06-14',
    tag: 'Synthesis · the 2026 story',
    title: 'The cost of AI is collapsing while the companies making it sit at record highs',
    dek: 'The 2026 story in one gap: inference racing toward zero — cheapest capable supply now Chinese — against all-time-high frontier valuations. How durable is a moat built on owning the frontier?',
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
