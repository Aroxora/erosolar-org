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
      <p class="note">The frontier is worth paying for — just not for every token. This is exactly how Erosolar is built: DeepSeek-v4-pro + Tavily as the default runtime across the agentic stack (jobs, PhD/lab tracking, outreach, the newsroom, the coding agent), with selective escalation and aggressive caching. Owner-controlled keys, provenance-logged.</p>
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
  `],
})
export class AiCosts {}
