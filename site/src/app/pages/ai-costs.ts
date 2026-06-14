import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ai-costs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ AI cost optimization · LLMOps</p>
        <h2 class="title">A $200 Claude subscription = ~$3,850/mo of frontier value — but you can't run a product on it</h2>
        <p class="sub">That one distinction — your <strong>dev seat</strong> vs your <strong>product runtime</strong> — is the most expensive thing teams get wrong about AI cost right now. Here's the full breakdown I used to architect Erosolar (June 2026 figures).</p>
      </div>

      <h3>1 · Your dev seat — flat-rate subscriptions (you, building)</h3>
      <p class="sub">Subscriptions are unbeatable for personal coding: huge effective discounts on frontier models. But a subscription <em>cannot serve your users</em>.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Plan</th><th>Price</th><th>What you get</th><th>Effective value</th></tr></thead>
        <tbody>
          <tr><td><strong>Claude Max 20×</strong></td><td>$200/mo</td><td>~1B tokens/mo of Opus 4.8</td><td>≈ <strong>$3,850</strong> of API value (~19× discount)</td></tr>
          <tr><td>ChatGPT Pro (20×)</td><td>≈ $200/mo</td><td>High GPT-5.x + reasoning quota, agents</td><td>strong dev-seat value</td></tr>
          <tr><td>Gemini AI Ultra (20×)</td><td>≈ $250/mo</td><td>Gemini 3.x Pro, large context, Deep Research</td><td>strong dev-seat value</td></tr>
          <tr><td>Grok SuperGrok Heavy / SuperCode</td><td>≈ $300/mo</td><td>Grok 4.x heavy reasoning + agentic coding</td><td>strong dev-seat value</td></tr>
        </tbody>
      </table></div>
      <p class="small note-line">Figures for the non-Claude tiers are positioning estimates as of June 2026; the Claude Max math is exact (~1B tokens/mo at Opus rates). The point isn't which sub — it's that <strong>all of them are dev-seat tools, not runtime</strong>.</p>

      <h3>2 · Your product runtime — metered API (your app serving real traffic)</h3>
      <p class="sub">Here you pay per token and the math flips. Blended per-token rates (June 2026):</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Model</th><th>$/1M in</th><th>$/1M out</th><th>vs Opus</th></tr></thead>
        <tbody>
          <tr><td>Opus 4.8</td><td>$5</td><td>$25</td><td>—</td></tr>
          <tr><td>Fable 5 <span class="small">(Anthropic top tier)</span></td><td>$10</td><td>$50</td><td>2× pricier</td></tr>
          <tr class="hi"><td><strong>DeepSeek V4-Pro</strong></td><td><strong>$0.435</strong></td><td><strong>$0.87</strong></td><td><strong>~22× cheaper</strong> than Opus · ~44× cheaper than Fable 5</td></tr>
        </tbody>
      </table></div>

      <h3>3 · Same workload, with Tavily search attached</h3>
      <div class="cards">
        <div class="cost-card bad"><span class="cc-n">≈ $3,970<small>/mo</small></span><span class="cc-l">Opus + Tavily</span></div>
        <div class="cost-card good"><span class="cc-n">≈ $297<small>/mo</small></span><span class="cc-l">DeepSeek + Tavily</span></div>
      </div>
      <p class="sub"><strong>The twist nobody talks about:</strong> once your tokens are that cheap, the <strong>search layer becomes ~40% of the bill</strong>. The thing to optimize stops being the model and becomes search — cache results, drop unnecessary "advanced" calls, or self-host (SearXNG).</p>

      <div class="warn">
        <strong>⏳ Time-sensitive:</strong> Fable 5 is free on Claude subscriptions only through <strong>June 22</strong>, then converts to API-rate credits — and it burns plan allowance ~2× faster than Opus. Evaluate it now; <em>don't architect on it.</em>
      </div>

      <h3>4 · The takeaway — tiered routing wins</h3>
      <ul class="takeaway">
        <li><strong>Default traffic →</strong> cheap, capable stack (DeepSeek + Tavily).</li>
        <li><strong>Hardest long-horizon tasks →</strong> escalate to Opus / Fable selectively, cap tokens, cache hard.</li>
        <li><strong>Your own dev seat →</strong> the flat-rate subscription.</li>
      </ul>
      <h3>5 · The Chinese stack — cheapest dev seat AND runtime (June 2026)</h3>
      <p class="sub">China shifted the floor on both axes: a <strong>coding subscription</strong> (Zhipu's GLM Coding Plan) is a fraction of Claude Max for the dev seat, and Chinese <strong>APIs</strong> are 10–40× cheaper than Opus for runtime. Trade-offs (data residency, capability gaps on the hardest tasks) are exactly what tiered routing manages.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Provider</th><th>Dev-seat sub</th><th>API $/1M (in / out)</th><th>Note</th></tr></thead>
        <tbody>
          <tr class="hi"><td><strong>DeepSeek</strong> (V4)</td><td>free chat</td><td>$0.30 / $0.50 <span class="small">(V3.2: $0.28/$0.42)</span></td><td>Erosolar's default runtime (Bo uses a V4-Pro blend ≈ $0.435/$0.87)</td></tr>
          <tr><td>Alibaba <strong>Qwen3</strong></td><td>—</td><td>Max $1.25/$3.75 · Plus $0.40/$1.20 · Flash <strong>$0.05/$0.40</strong></td><td>Qwen-Flash is the cheapest capable API anywhere</td></tr>
          <tr><td>Zhipu <strong>GLM</strong></td><td><strong>$10/mo</strong> (GLM Coding Plan)</td><td>GLM-4.6 $0.60/$2.20</td><td>Claude-Code-style coding sub at ~1/20th the price</td></tr>
          <tr><td>Moonshot <strong>Kimi K2</strong></td><td>—</td><td>$0.95/$4.00</td><td>strong long-context</td></tr>
          <tr><td>ByteDance <strong>Doubao</strong></td><td>—</td><td>$0.47/$2.37</td><td>massive scale, aggressive pricing</td></tr>
        </tbody>
      </table></div>

      <h3>6 · Methodology &amp; the calculations (reproducible)</h3>
      <p class="sub"><strong>Assumed workload</strong> (Erosolar-shaped, agentic + RAG): <strong>15,000 requests/month</strong>, each ≈ <strong>12k input + 8k output</strong> tokens (prompt + retrieved context + reasoning) and <strong>1 advanced Tavily search</strong>. That totals <strong>180M input + 120M output tokens</strong> and <strong>15,000 searches</strong> per month. Tavily advanced ≈ <strong>$0.008/search → $120/mo</strong>. Per model: <code>cost = 180·rate_in + 120·rate_out + 120</code> (rates per 1M; tokens in millions).</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Runtime model</th><th>Token cost</th><th>+ Tavily</th><th>Total / mo</th><th>Search %</th></tr></thead>
        <tbody>
          <tr class="hi"><td>DeepSeek V4-Pro ($0.435/$0.87)</td><td>$78.3 + $104.4 = $182.7</td><td>$120</td><td><strong>≈ $303</strong></td><td><strong>~40%</strong></td></tr>
          <tr><td>Qwen-Plus ($0.40/$1.20)</td><td>$72 + $144 = $216</td><td>$120</td><td>≈ $336</td><td>~36%</td></tr>
          <tr><td>Doubao ($0.47/$2.37)</td><td>$84.6 + $284.4 = $369</td><td>$120</td><td>≈ $489</td><td>~25%</td></tr>
          <tr><td>GLM-4.6 ($0.60/$2.20)</td><td>$108 + $264 = $372</td><td>$120</td><td>≈ $492</td><td>~24%</td></tr>
          <tr><td>Kimi K2 ($0.95/$4.00)</td><td>$171 + $480 = $651</td><td>$120</td><td>≈ $771</td><td>~16%</td></tr>
          <tr><td>Opus 4.8 ($5/$25)</td><td>$900 + $3,000 = $3,900</td><td>$120</td><td>≈ <strong>$4,020</strong></td><td>~3%</td></tr>
          <tr><td>Fable 5 ($10/$50)</td><td>$1,800 + $6,000 = $7,800</td><td>$120</td><td>≈ $7,920</td><td>~1.5%</td></tr>
        </tbody>
      </table></div>
      <p class="small note-line">This reproduces the headline figures (DeepSeek+Tavily ≈ $297–303, Opus+Tavily ≈ $3,970–4,020) and shows the key effect directly: once tokens are cheap, the fixed $120 search line dominates — so on the DeepSeek/Qwen stack you optimize <strong>search</strong> (cache, basic-vs-advanced, self-host SearXNG), not the model. Change the three workload assumptions to re-cost your own app.</p>

      <h3>7 · Sources (June 2026 — verify at source; prices move)</h3>
      <ul class="sources small">
        <li>DeepSeek API — <a href="https://deepseek.ai/pricing" target="_blank" rel="noopener">deepseek.ai/pricing</a>, <a href="https://benchlm.ai/blog/posts/deepseek-api-pricing" target="_blank" rel="noopener">benchlm</a></li>
        <li>Alibaba Qwen — <a href="https://felloai.com/qwen-pricing" target="_blank" rel="noopener">felloai/qwen-pricing</a>, <a href="https://deepinfra.com/blog/qwen-api-pricing-2026-guide" target="_blank" rel="noopener">deepinfra</a></li>
        <li>Zhipu GLM Coding Plan / API — <a href="https://vibecoding.app/blog/zhipu-ai-glm-pricing-2026" target="_blank" rel="noopener">vibecoding</a></li>
        <li>Moonshot Kimi K2 — <a href="https://apidog.com/blog/kimi-k2-api-pricing" target="_blank" rel="noopener">apidog</a>, <a href="https://deepinfra.com/blog/kimi-k2-6-pricing-guide-deployment-tradeoffs" target="_blank" rel="noopener">deepinfra</a></li>
        <li>ByteDance Doubao — <a href="https://evolink.ai/blog/doubao-seed-2-0-review-benchmarks-pricing" target="_blank" rel="noopener">evolink</a></li>
        <li>Anthropic Opus 4.8 API — <a href="https://www.finout.io/blog/claude-opus-4.8-pricing-2026-everything-you-need-to-know" target="_blank" rel="noopener">finout</a></li>
        <li>Subs (ChatGPT Pro / Gemini Ultra / Grok Heavy) — <a href="https://www.sentisight.ai/ai-price-comparison-gemini-chatgpt-claude-grok" target="_blank" rel="noopener">sentisight comparison</a>, <a href="https://aitoolanalysis.com/supergrok-subscription-price-2026" target="_blank" rel="noopener">SuperGrok Heavy</a></li>
        <li>Tavily search pricing — <a href="https://tavily.com/#pricing" target="_blank" rel="noopener">tavily.com</a></li>
      </ul>

      <p class="note">The frontier is worth paying for — just not for every token. This is exactly how Erosolar is built: DeepSeek-v4-pro + Tavily as the default runtime across the agentic stack (jobs, PhD/lab tracking, outreach, the newsroom, the coding agent), with selective escalation and aggressive caching. Owner-controlled keys, provenance-logged. More in <a routerLink="/notes">Field notes</a> — search build-vs-buy, the $200-club-vs-China gap, and the 2026 compute/capital story.</p>
      <p class="small">— Bo Shang · <a href="mailto:bo@shang.software">bo&#64;shang.software</a> · <a routerLink="/">erosolar.org</a> · open to AI engineering / LLMOps / research-engineering roles.</p>
    </div>
  `,
  styles: [`
    h3 { font-family:var(--display); margin:1.8rem 0 .4rem; font-size:1.3rem; }
    .table-wrap { overflow:auto; }
    table { width:100%; border-collapse:collapse; font-size:.92rem; margin:.4rem 0; }
    th,td { text-align:left; padding:.5rem .6rem; border-bottom:1px solid var(--line-soft); vertical-align:top; }
    th { font-family:var(--mono); font-size:.74rem; color:var(--solar); text-transform:uppercase; letter-spacing:.06em; }
    tr.hi td { background:rgba(42,85,0,.1); }
    .note-line { margin:.2rem 0 0; }
    .cards { display:flex; gap:1rem; flex-wrap:wrap; margin:.6rem 0 0; }
    .cost-card { flex:1; min-width:200px; border:1px solid var(--line-soft); border-radius:12px; padding:1.1rem 1.2rem; background:var(--surface); display:flex; flex-direction:column; gap:.2rem; }
    .cost-card.bad { border-color:#a33; } .cost-card.good { border-color:#2a5; }
    .cc-n { font-family:var(--display); font-size:2rem; } .cost-card.bad .cc-n { color:#ff8a7a; } .cost-card.good .cc-n { color:#8be0a0; }
    .cc-n small { font-size:.9rem; color:var(--muted); }
    .cc-l { font-family:var(--mono); font-size:.78rem; color:var(--muted); }
    .warn { border:1px solid var(--solar); background:rgba(255,159,69,.08); border-radius:12px; padding:.9rem 1.1rem; margin:1.2rem 0; color:var(--ink-2); }
    .takeaway { color:var(--ink-2); line-height:1.7; max-width:80ch; }
    .note { margin-top:1.2rem; color:var(--muted); max-width:82ch; line-height:1.6; }
    .small { font-size:.8rem; color:var(--muted); }
    .sources { line-height:1.9; padding-left:1.1rem; max-width:82ch; }
    .sources a { color:var(--solar); }
  `],
})
export class AiCosts {}
