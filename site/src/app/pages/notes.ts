import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NOTES_META } from './notes.data';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ Field notes · AI economics &amp; infrastructure</p>
        <h2 class="title">Field notes</h2>
        <p class="sub">Short, sourced analyses on the economics and infrastructure of frontier AI — the same reasoning I use to architect Erosolar. Figures are June 2026; I mark <strong>verified</strong> vs <strong>estimated</strong> in every piece, because prices and rounds move weekly.</p>
      </div>

      <nav class="note-index" aria-label="Field notes index">
        @for (n of notes; track n.slug) {
          <a class="note-index__item" href="#{{ n.slug }}">
            <span class="note-index__date">{{ n.date }}</span>
            <span class="note-index__title">{{ n.title }}</span>
            <span class="note-index__tag">{{ n.tag }}</span>
          </a>
        }
      </nav>

      <!-- ───────────────── Note 5 (latest) — synthesis ───────────────── -->
      <article id="cost-collapsing-prices-record" class="note">
        <div class="note-head"><span class="chip">2026-06-14</span><span class="tag">Synthesis · the 2026 story</span></div>
        <h3>The cost of AI is collapsing while the companies making it sit at record highs</h3>
        <p class="dek">The cost of AI is collapsing. The price of the companies that make it is at record highs. That gap is the 2026 story.</p>

        <h4>The floor — API, per 1M tokens</h4>
        <p><strong>Frontier:</strong> Fable 5 $10/$50 · Opus 4.8 $5/$25 · GPT-5.5 $5/$30 · Grok 4.3 $1.25/$2.50. <strong>Value:</strong> DeepSeek V4-Pro $0.435/$0.87 · V4-Flash $0.14/$0.28 · Kimi K2.6 $0.95/$4 · GLM-4.7 $0.60/$2.20. DeepSeek runs ~22× cheaper than Opus and ~44× cheaper than Fable 5 — at ~90–95% of the capability on coding benchmarks. The cheapest capable supply is now Chinese.</p>

        <h4>The seat — heaviest monthly plan</h4>
        <p><strong>West:</strong> Claude Max 20×, ChatGPT Pro, Gemini Ultra — all $200; SuperGrok Heavy $300. <strong>China:</strong> GLM Coding Plan $10–$80 (Claude-Code compatible); Kimi $19–$199. A $10–30 Chinese plan covers most of what a $200 Western plan does.</p>

        <h4>The ceiling — valuations</h4>
        <p>Anthropic $965B · OpenAI $852B · SpaceX (+xAI+X) IPO'd at ~$1.77T — analysts peg fair value at $600–900B. Musk became the first trillionaire, ~80% of it on the SpaceX mark, ~95% unrealized. Tesla trades near 350× earnings while BYD sells more cars at ~1/10th the market cap. Apple now pays Google ~$1B/yr for the Gemini that runs Siri — while Google pays Apple ~$20B/yr for search.</p>

        <h4>The plumbing</h4>
        <p>Amazon, Microsoft, Alphabet and Meta are spending ~$725B on 2026 capex, +75% YoY. The same hyperscalers and chipmakers fund the labs that buy their compute. Circular by design.</p>

        <h4>The tension</h4>
        <p>If inference is commoditizing toward zero — and the cheapest capable supply is Chinese — how durable are trillion-dollar valuations built on owning the frontier? Protectionism (100%+ EV tariffs, chip controls) is propping up the gap, and it's already cracking.</p>

        <p class="take"><strong>My takeaway:</strong> value is migrating from models to compute, distribution, and whoever owns the cheapest supply at scale. Build cheap, reserve the frontier for what truly needs it, and don't mistake a policy moat for a real one.</p>
        <p class="verify"><strong>Verified vs estimated:</strong> API rates, subscription tiers, the $965B / $852B / ~$1.77T valuations, the Apple–Google flows, and the ~$725B (+75% YoY) capex are from June-2026 pricing and reporting. The $600–900B SpaceX fair-value range, the ~80% / ~95% net-worth split, and "~90–95% of capability" are analyst / benchmark estimates — directional, not exact.</p>
        <p class="src">This note synthesizes the four below — see them for the full working and sources.</p>
      </article>

      <!-- ───────────────── Note 4 — Musk empire / valuations ───────────────── -->
      <article id="musk-empire-overvalued" class="note">
        <div class="note-head"><span class="chip">2026-06-13</span><span class="tag">Valuation · geopolitics</span></div>
        <h3>Is Musk's $1T+ empire overvalued — and are US import controls hiding it?</h3>
        <p class="dek">A genuine evaluation: the bear case on Tesla is strong, but SpaceX stays nuanced — its launch moat is real. Lumping them together would be the weaker argument. The common thread is that tariffs and export controls may be masking how contingent the US lead is.</p>

        <h4>Tesla — the clear case</h4>
        <p>Tesla trades around <strong>350× earnings</strong> at a market cap over $1 trillion. Yet <strong>BYD sold more cars in 2025</strong> (2.26M vs Tesla's 1.64M), earns more revenue (~$118B vs ~$92B), and trades at <strong>~17× forward earnings</strong> (low-20s trailing) — about one-tenth Tesla's market cap. In every market where they meet head-to-head — Europe, the UK, Australia — BYD wins on price and matches on tech. The only reason Tesla doesn't face that fight at home is a <strong>100%+ tariff wall</strong> on Chinese EVs (plus a separate 25% on all imported cars), a wall built to shield an industry "from price competition it cannot match." That isn't strength — it's a moat made of policy.</p>

        <h4>SpaceX — the nuanced case</h4>
        <p>Here the moat is real. Reusability makes SpaceX launches <strong>~94% cheaper</strong> than China's single-use Long March (~$2,700/kg vs ~$21,000/kg), and Starlink has <strong>7,000+ satellites</strong> up versus China's few hundred. China is not beating SpaceX on rockets today. But the <strong>$1.77T IPO valuation</strong> prices in permanent Starlink dominance plus a speculative orbital-AI-data-center story — and China is spending tens of billions to erode exactly that: three megaconstellations targeting ~40,000 satellites, new reusable rockets, and a dedicated STAR Market IPO channel. Independent analysts peg fair value nearer <strong>$600–900B</strong> than $1.77T.</p>

        <h4>The net worth</h4>
        <p>Musk is now the world's first trillionaire — but <strong>~80% of it rides on SpaceX's $135/share IPO mark</strong>, ~25% on Tesla at 350× earnings, and ~95% is unrealized, illiquid equity. The fortune sits on the two most stretched valuations in the market.</p>

        <h4>The tell</h4>
        <p>EV tariffs and chip export controls get sold as strength. Read them instead as symptoms: the US is shielding its champions from a Chinese cost curve and manufacturing base it can't currently match. That buys time; it doesn't close the gap. And the walls are already cracking — Canada cut its EV tariff to 6.1%, the EU opened up, and BYD is building in Mexico while suing to kill the US tariffs.</p>

        <p class="take"><strong>My read:</strong> Tesla looks genuinely overvalued against competition that policy keeps offshore. SpaceX has a real moat — at a valuation that assumes it lasts forever. Strip out the protection, and a lot of "US leadership" in EVs, chips, and space is more contingent than the trillion-dollar marks imply.</p>
        <p class="verify"><strong>Verified vs estimated:</strong> Tesla's ~352× P/E, BYD's ~$118B sales / 2.26M-vs-1.64M units / ~17× forward P/E, the 100% + 25% US tariffs, the ~94% launch-cost gap, Starlink's 7,000 satellites, the $1.77T IPO mark, and the Canada/EU/Mexico tariff moves are from June-2026 reporting and filings. The $600–900B fair-value range and the ~80%/~95% net-worth composition are analyst estimates — directional, not exact.</p>
      </article>

      <!-- ───────────────── Note 3 — compute / capital ───────────────── -->
      <article id="compute-is-the-asset" class="note">
        <div class="note-head"><span class="chip">2026-06-12</span><span class="tag">Capital · compute</span></div>
        <h3>Compute is the asset: 2026's AI story is vertical integration and circular capital</h3>
        <p class="dek">Strip away the model launches and 2026's AI story gets simpler — a few vertically integrated giants are buying the entire stack: capital, compute, and now orbit.</p>

        <h4>The valuations</h4>
        <ul class="rows">
          <li><strong>Anthropic — $965B</strong> after a $65B Series H (May 28), now ahead of OpenAI for the first time. ~$47B ARR. Confidential S-1 filed; October IPO targeted.</li>
          <li><strong>OpenAI — $852B</strong> after a record $122B raise (Amazon, Nvidia, SoftBank, Microsoft). ~$2B/month revenue, still deeply lossmaking.</li>
          <li><strong>SpaceX + xAI — ~$1.25T</strong>, merged in February (SpaceX at $1T, xAI at $250B) into the largest merger ever. A ~$1.75T IPO is being teed up for mid-2026 — which would be the biggest listing in history.</li>
        </ul>

        <h4>The circularity</h4>
        <p>The same hyperscalers and chipmakers — Amazon, Nvidia, Microsoft, Google, plus Samsung / SK Hynix / Micron — invest in the labs, then sell them the compute and memory those dollars buy back. Nvidia's OpenAI stake is largely GPUs, not cash. The spend books as revenue; the revenue justifies the next markup. Increasingly a closed loop, against a backdrop of roughly <strong>$725B of 2026 capex</strong> (a ~75% jump) across Meta, Amazon, Microsoft, and Alphabet.</p>
        <p>Even Apple plays both sides: it takes <strong>~$20B/year from Google</strong> to keep search default in Safari, and now pays <strong>~$1B/year back</strong> for a custom <strong>1.2-trillion-parameter Gemini</strong> model to run the rebuilt Siri (WWDC, June 8). The world's most valuable consumer company chose to <em>rent</em> frontier AI, not build it.</p>

        <h4>The orbital frontier</h4>
        <p>SpaceX's IPO pitch is the "space cloud," not rockets. It has filed with the FCC for up to <strong>1,000,000 AI satellites</strong> — the "AI1," ~120 kW each (≈ one Nvidia GB300 rack), 30–50 per Starship launch, with a 10 GW solar plant going up near Austin to feed production. Bull case: ~100 GW of new orbital compute per year — solar-powered, no grid, no land. The catch: it hinges on Starship hitting industrial launch rates and solving radiation, cooling, and cost. Amazon's cloud chief calls orbital data centers "nowhere close," and independent analysts peg fair value nearer <strong>$600–900B</strong> than $1.75T.</p>

        <p class="take"><strong>My read:</strong> compute is the asset; capital, supply, and demand are consolidating onto a handful of balance sheets. The IPO window — Anthropic in October, SpaceX mid-year — will test whether public markets pay private-round prices for partly-circular revenue. The orbital bet is real engineering, but a long-dated option, not 2026 cash flow.</p>
        <p class="verify"><strong>Verified vs estimated:</strong> valuations, the $65B/$122B rounds, the SpaceX–xAI merger marks, the FCC filing, the AI1/Starship specs, the Apple–Google figures and the ~$725B capex are from June-2026 reporting and company/regulatory disclosures. The orbital throughput math and the $600–900B fair-value range are analyst projections — directional, not guaranteed.</p>
      </article>

      <!-- ───────────────── Note 2 — the $200 club vs China ───────────────── -->
      <article id="wests-ai-subscriptions-vs-china" class="note">
        <div class="note-head"><span class="chip">2026-06-10</span><span class="tag">Pricing · build the product</span></div>
        <h3>The West's heaviest AI subscriptions all cost about the same. China's cost a tenth — or less.</h3>
        <p class="dek">I priced every flagship "max tier" as of June 2026. The clustering is almost funny.</p>

        <h4>The Western $200+ club (top individual plans)</h4>
        <ul class="rows">
          <li><strong>Claude Max 20×</strong> — $200/mo (Opus 4.8; Fable 5 free through June 22)</li>
          <li><strong>ChatGPT Pro</strong> — $200/mo (GPT-5.5 Pro, 20× Plus limits, 1M context)</li>
          <li><strong>Google AI Ultra</strong> — $200/mo (Gemini Deep Think, 20× Pro, Spark agent)</li>
          <li><strong>SuperGrok Heavy</strong> — $300/mo (Grok 4.3 + Grok 4 Heavy multi-agent)</li>
        </ul>
        <p>Four labs, one price band: $200–300/month for the heaviest consumer plan.</p>

        <h4>China — same agentic coding workflow</h4>
        <ul class="rows">
          <li><strong>Zhipu GLM Coding Plan</strong> — $10 / $30 / $80/mo. Runs inside Claude Code on a quota system. GLM-5.2, 1M context, trained without Nvidia.</li>
          <li><strong>Moonshot Kimi membership</strong> — $19 → $199/mo. Kimi Code + agent swarms up to 300 subagents.</li>
          <li><strong>DeepSeek / Qwen</strong> — no premium tier at all. Just metered API.</li>
        </ul>

        <h4>On the API — where you actually ship a product</h4>
        <p>The gap stops being a discount and becomes a different category:</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Model</th><th>$/1M in</th><th>$/1M out</th></tr></thead>
          <tbody>
            <tr class="hi"><td><strong>DeepSeek V4-Pro</strong></td><td>$0.435</td><td>$0.87</td></tr>
            <tr class="hi"><td><strong>DeepSeek V4-Flash</strong></td><td>$0.14</td><td>$0.28</td></tr>
            <tr><td>Qwen-Plus</td><td>$0.40</td><td>$1.20</td></tr>
            <tr><td>GLM-4.7</td><td>$0.60</td><td>$2.20</td></tr>
            <tr><td>Claude Opus 4.8</td><td>$5.00</td><td>$25.00</td></tr>
            <tr><td>Fable 5</td><td>$10.00</td><td>$50.00</td></tr>
          </tbody>
        </table></div>
        <p>That's roughly <strong>20–40× cheaper per token</strong>, for ~90–95% of the capability on public coding and reasoning benchmarks.</p>

        <p class="take"><strong>Where I keep landing:</strong> for your own <em>dev seat</em>, a $10–30 Chinese, Claude-Code-compatible plan does most of what a $200 Western subscription does. For a <em>product you ship</em>, the API math isn't close — the cheap stack wins by an order of magnitude. Pay Western-frontier prices only for the hardest tasks that genuinely need them. The frontier is real; the price floor is being set in China.</p>
        <p class="verify"><strong>Verified vs estimated:</strong> all subscription tiers and API rates are from June-2026 provider pricing and reporting (sources below). The "~90–95% of capability" is a read of public coding/reasoning benchmarks, not a guarantee on your specific workload.</p>
        <p class="src">Sources: <a href="https://deepseek.ai/pricing" target="_blank" rel="noopener">DeepSeek</a> · <a href="https://felloai.com/qwen-pricing" target="_blank" rel="noopener">Qwen</a> · <a href="https://vibecoding.app/blog/zhipu-ai-glm-pricing-2026" target="_blank" rel="noopener">Zhipu GLM</a> · <a href="https://apidog.com/blog/kimi-k2-api-pricing" target="_blank" rel="noopener">Moonshot Kimi</a> · <a href="https://www.finout.io/blog/claude-opus-4.8-pricing-2026-everything-you-need-to-know" target="_blank" rel="noopener">Opus 4.8</a> · <a href="https://www.sentisight.ai/ai-price-comparison-gemini-chatgpt-claude-grok" target="_blank" rel="noopener">Western sub comparison</a>. Full methodology on the <a routerLink="/ai-costs">AI Costs</a> page.</p>
      </article>

      <!-- ───────────────── Note 1 — build vs buy: search ───────────────── -->
      <article id="build-vs-buy-web-search" class="note">
        <div class="note-head"><span class="chip">2026-06-08</span><span class="tag">Build vs buy · search</span></div>
        <h3>Build vs buy, but for web search</h3>
        <p class="dek">On a cheap-LLM stack, search is often a bigger line item than the model itself. Here's the honest trade-off between managed search (Tavily) and a self-hosted SearXNG stack for an agentic research assistant.</p>

        <h4>Buy — Tavily (managed search API)</h4>
        <p><strong>Cost:</strong> ~$0.008/basic search, ~$0.016/advanced; ~$0.005 on volume plans; 1,000 free/mo. So ~10k searches ≈ $120/mo, ~100k ≈ $1,200/mo. <strong>You get:</strong> clean, LLM-ready results plus answer extraction, anti-bot handling, proxies, uptime — zero ops, scales instantly. <strong>You give up:</strong> cost that grows linearly with traffic, a third party in your data path, vendor lock-in, and credits that don't roll over.</p>

        <h4>Build — SearXNG + your own extraction (proprietary)</h4>
        <p><strong>Cost:</strong> mostly fixed — a VPS (~$20/mo) + a residential proxy pool (~$75–200/mo at scale, to survive Google/Bing blocks) + extraction compute (~$10–30/mo) ≈ $100–250/mo, then near-$0 per search. <strong>You get:</strong> full control of sources, ranking, and extraction; data stays in your own infra (real for privacy/residency); no per-call meter; no lock-in. <strong>You give up:</strong> your time — SearXNG returns links, not clean content, so you build the scraping/cleaning layer, babysit proxies and blocks, and own uptime. Budget ~20–40 hrs to stand it up, then a few hrs/month forever.</p>

        <h4>The break-even</h4>
        <p>On cash alone, the two cross at roughly <strong>10k–20k searches/month</strong>. Below that, Tavily wins easily (free tier + no ops). Above ~50k–100k/month, self-hosting's flat cost pulls clearly ahead — <em>if</em> you value the maintenance time near zero.</p>
        <ul class="rows">
          <li><strong>Early / low volume / small team →</strong> buy. Your time is worth more than the savings.</li>
          <li><strong>High volume, or hard privacy / residency / control needs →</strong> build. Flat cost and data control compound.</li>
          <li><strong>In between →</strong> start on Tavily's free tier, but design a SearXNG fallback in from day one so the switch is cheap.</li>
        </ul>
        <p class="take"><strong>The trap</strong> is treating search as free because the model got cheap. It isn't — it's just the line item nobody budgets for. (Erosolar ships exactly this: Tavily by default, a one-flag SearXNG fallback wired in — see the top-bar search picker.)</p>
        <p class="verify"><strong>Verified vs estimated:</strong> Tavily is credit-based — advanced search costs 2 credits, basic 1, at $0.008/credit pay-as-you-go, falling to ~$0.0075–0.005 on volume plans, with a 1,000-credit free tier (<a href="https://tavily.com/#pricing" target="_blank" rel="noopener">tavily.com</a>). The SearXNG-side figures (VPS, proxies, extraction, build hours) are engineering ballparks that swing widely with traffic and how hard you scrape — estimates, not quotes.</p>
      </article>

      <p class="byline">— Bo Shang · <a href="mailto:bo&#64;shang.software">bo&#64;shang.software</a> · <a routerLink="/">erosolar.org</a> · open to AI engineering / LLMOps / research-engineering roles.</p>
    </div>
  `,
  styles: [`
    .note-index { display:grid; gap:.1rem; margin:1rem 0 .4rem; padding:.5rem 1rem; border:1px solid var(--line-soft); border-radius:12px; background:var(--surface); }
    .note-index__item { display:flex; gap:.8rem; align-items:baseline; flex-wrap:wrap; color:var(--ink-2); text-decoration:none; padding:.5rem 0; border-bottom:1px solid var(--line-soft); }
    .note-index__item:last-child { border-bottom:0; }
    .note-index__item:hover .note-index__title { color:var(--solar); }
    .note-index__date { font-family:var(--mono); font-size:.72rem; color:var(--muted); white-space:nowrap; }
    .note-index__title { font-size:.94rem; flex:1; min-width:14rem; }
    .note-index__tag { font-family:var(--mono); font-size:.68rem; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
    .note { border:1px solid var(--line-soft); border-radius:14px; padding:1.3rem 1.5rem; margin:1.4rem 0; background:var(--surface); scroll-margin-top:90px; }
    .note-head { display:flex; gap:.6rem; align-items:center; margin-bottom:.5rem; }
    .chip { font-family:var(--mono); font-size:.72rem; color:var(--solar); border:1px solid var(--line-soft); border-radius:999px; padding:.18rem .55rem; }
    .tag { font-family:var(--mono); font-size:.72rem; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }
    h3 { font-family:var(--display); margin:.2rem 0 .3rem; font-size:1.42rem; line-height:1.2; }
    h4 { font-family:var(--mono); font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; color:var(--solar); margin:1.1rem 0 .35rem; }
    .dek { color:var(--ink-2); font-size:1.02rem; line-height:1.55; max-width:82ch; }
    p { color:var(--ink-2); line-height:1.62; max-width:84ch; }
    .rows { color:var(--ink-2); line-height:1.6; max-width:84ch; padding-left:1.1rem; }
    .rows li { margin:.3rem 0; }
    .take { border-left:3px solid var(--solar); padding-left:.9rem; margin-top:1rem; color:var(--ink); }
    .verify, .src { font-size:.8rem; color:var(--muted); max-width:84ch; }
    .verify { margin-top:.9rem; } .src a, .verify a { color:var(--solar); }
    .table-wrap { overflow:auto; }
    table { width:100%; border-collapse:collapse; font-size:.92rem; margin:.4rem 0; }
    th,td { text-align:left; padding:.45rem .6rem; border-bottom:1px solid var(--line-soft); }
    th { font-family:var(--mono); font-size:.72rem; color:var(--solar); text-transform:uppercase; letter-spacing:.06em; }
    tr.hi td { background:rgba(42,85,0,.1); }
    .byline { font-size:.82rem; color:var(--muted); margin-top:1.6rem; } .byline a { color:var(--solar); }
  `],
})
export class Notes {
  readonly notes = NOTES_META;
}
