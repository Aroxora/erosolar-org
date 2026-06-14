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

      <!-- ───────────────── Note 6 (latest) — AI power rankings ───────────────── -->
      <article id="ai-power-rankings" class="note">
        <div class="note-head"><span class="chip">2026-06-14</span><span class="tag">Power rankings · forecast</span></div>
        <h3>The AI Power Rankings: grading the people building the future — and forecasting who wins next</h3>
        <p class="dek">Sam Altman, Elon Musk, Dario Amodei, Sundar Pichai, Jensen Huang, and Liang Wenfeng — a mid-2026 scorecard and forecast.</p>
        <p>The AI boom stopped being a single story. By mid-2026 it's a field of named bets, each tied to one person whose decisions move trillions. I build agentic AI for a living and track these companies as both a paying customer and an analyst — which gives me two vantage points: what they charge me, and what the market charges to own them. Here's my report card on the six who matter most, and where I think each is headed.</p>

        <h4>Sam Altman — OpenAI</h4>
        <p><strong>Performance.</strong> Still the most famous operator in the field, and on raw capital and reach he's delivered: a record $122B raise in March at an $852B valuation, a revenue run-rate from ~$2B (2023) to ~$25B annualized by early 2026, and ChatGPT as the default AI product for hundreds of millions. He completed the nonprofit→PBC conversion (the OpenAI Foundation keeps board-appointment rights and a ~$130B stake) and in April 2026 renegotiated Microsoft — capping the revenue share and stripping exclusivity to run multi-cloud.</p>
        <p><strong>Problem.</strong> He's barreling toward one of the largest IPOs in history with potholes that mostly have his name on them: Republican state AGs and the House Oversight Committee are both scrutinizing conflicts of interest between his personal portfolio and OpenAI's decisions — echoes of the 2023 ouster. Worse, OpenAI lost the technical lead: Gemini 3 beat it badly enough to trigger an internal "code red," and it shut down Sora. Still deeply lossmaking.</p>
        <p><strong>Verdict.</strong> Extraordinary capital and reach, slipping product lead, governance overhang. A strong franchise that is no longer the front-runner.</p>

        <h4>Elon Musk — SpaceX, xAI, Tesla</h4>
        <p><strong>Performance.</strong> The most audacious financial engineering in corporate history: in February he folded xAI and X into SpaceX to create a single $1.25T entity (the largest merger ever), and on June 12 took it public near $1.77T, raising ~$75B — the largest IPO of all time, making him the first trillionaire. Underneath: a genuine moat — reusable launch ~94% cheaper per kg than China's single-use rockets, Starlink 7,000+ satellites.</p>
        <p><strong>Problem.</strong> The valuation assumes that lead is permanent and that orbital compute arrives on schedule; independent analysts put fair value nearer $600–900B. ~80% of his fortune rides that one mark, ~95% unrealized. And Tesla is the weak link: ~350× earnings while BYD outsold it in 2025 (2.26M vs 1.64M), out-earned it (~$118B vs ~$92B), trades at a fraction of the multiple, and wins on price in every head-to-head market — shielded at home by 100% EV tariffs.</p>
        <p><strong>Verdict.</strong> Dazzling capital engineering and a real space moat, married to a stretched valuation, extreme concentration, and a car company losing a cost war it pretends it isn't in.</p>

        <h4>Dario Amodei — Anthropic</h4>
        <p><strong>Performance.</strong> The quiet winner. A $65B Series H on May 28 at a $965B valuation vaulted Anthropic past OpenAI to most-valuable AI lab, on ~$47B annualized revenue. The Claude franchise (Opus 4.8, Fable 5) is the preferred stack for serious coding and enterprise — the highest-value, stickiest segment. Confidential October IPO filing; guiding to break-even by 2028.</p>
        <p><strong>Problem.</strong> Still lossmaking and capital-hungry, facing the same commoditization pressure from Chinese models, with consumer presence a fraction of ChatGPT's — growth rides on developers and enterprises, not the mass market.</p>
        <p><strong>Verdict.</strong> Disciplined, focused, ascendant — the lab that quietly took the lead while everyone watched OpenAI.</p>

        <h4>Sundar Pichai — Google / Alphabet</h4>
        <p><strong>Performance.</strong> The comeback of the cycle, and on the numbers the single best performance here. Written off 18 months ago, Alphabet is up ~75% on the year, crossed $4T in January, passed Apple for the first time since 2019, and is closing on Nvidia for most valuable company on earth. Q1-2026: $109.9B revenue (+22%), $62.6B net income (+81%), Cloud +48%. Gemini 3 outperformed every rival, crossed 750M monthly users, and — critically — cut AI query cost ~78%. Apple now pays ~$1B/yr to run a custom Gemini inside Siri.</p>
        <p><strong>Problem.</strong> $175–185B of 2026 capex (a near-doubling) will pressure margins, and only pays off if the infrastructure keeps converting to demand. Search antitrust remains live.</p>
        <p><strong>Verdict.</strong> The best-positioned full-stack player, full stop — owns the chips (TPUs), models (Gemini), distribution (Search, Android, Chrome, YouTube, now Siri), cloud, and data. As workloads shift training→inference, cost-per-query is the whole game, and owning your silicon is the durable edge. The standout.</p>

        <h4>Jensen Huang — Nvidia</h4>
        <p><strong>Performance.</strong> The undisputed financial winner of the era: first company to $5T, trading in a $5–5.5T band no public company has touched. A recent quarter: ~$81B revenue (+85%), $58B net income (+211%). He sells the picks and shovels to every lab and hyperscaler here — including the ones building chips to compete with him — with benchmark-backed performance-per-dollar.</p>
        <p><strong>Problem.</strong> The customers are also the competition: Google's TPUs, Broadcom's custom accelerators (&gt;$8B AI revenue last quarter), Marvell's networking — all chipping at inference. The valuation now requires the entire (circular) AI buildout to keep compounding; any capex pause hits Nvidia first and hardest.</p>
        <p><strong>Verdict.</strong> The cleanest winner of the cycle — but increasingly a leveraged bet on the AI capex cycle never slowing.</p>

        <h4>Liang Wenfeng — DeepSeek</h4>
        <p><strong>Performance.</strong> The disruptor, and relative to his resources the most consequential person here. DeepSeek prices V4-Pro at $0.435 per million input tokens — ~22× cheaper than Opus, ~44× cheaper than Fable 5 — at ~90–95% of capability on public benchmarks, running on Huawei Ascend hardware, routing around US export controls entirely.</p>
        <p><strong>Forecast.</strong> Not a valuation story (privately backed, no trillion-dollar chase) — a margin story, and the asymmetric threat to every Western name above. By making "good enough" intelligence nearly free, he compresses the economics of the whole industry and hands every builder a credible alternative to the frontier labs. Living proof that export controls are accelerating, not preventing, Chinese self-sufficiency.</p>
        <p><strong>Verdict.</strong> The highest disruption-per-dollar in the field. The man who made intelligence cheap and forced everyone else to explain why theirs costs so much more.</p>

        <h4>The fast follower: Zuckerberg</h4>
        <p>Meta spends at the same nine-figure-monthly capex pace and pursues an open-weight Llama strategy that, like DeepSeek, pressures the closed labs from below, with enviable distribution. But it monetizes attention, not intelligence directly — so its AI spend is a defensive moat around advertising, not a standalone engine. Watchable, not yet decisive.</p>

        <h4>The ranking</h4>
        <p>On the combination of delivery and positioning: <strong>1) Pichai</strong> (execution + full-stack); <strong>2) Huang</strong> (financial king, single point of failure = the capex cycle); <strong>3) Amodei</strong> (disciplined new valuation leader); <strong>4) Liang</strong> (the disruptor reshaping everyone's margins); <strong>5) Altman</strong> (powerful but slipping, governance cloud); <strong>6) Musk</strong> — not because SpaceX isn't real, but because the blended bet carries the widest valuation-vs-fundamentals gap, the most concentration risk, and the weakest core asset in Tesla.</p>
        <p class="take">The through-line: the winners of this phase own infrastructure and distribution (Pichai, Huang) or made intelligence so cheap they reset the board (Liang). The exposed names are those whose valuations have outrun their economics and now depend on a narrative holding or a capex cycle never breaking. The IPO window now opening — Anthropic in October, SpaceX already trading — is where those two groups get sorted in public, on real numbers, for the first time. I'd watch that repricing more closely than any model launch this year.</p>
        <p class="verify"><strong>Verified vs estimated:</strong> valuations, raises, revenue figures, the SpaceX–xAI merger/IPO marks, Alphabet's Q1 numbers and capex, Nvidia's quarter, the Apple–Google flows, and DeepSeek's pricing are from mid-2026 reporting and company disclosures. The rankings are my analytical judgment; the SpaceX $600–900B fair-value range and net-worth composition are analyst estimates.</p>
        <p class="src">Sources: each company's mid-2026 earnings / funding announcements and filings; model API pricing pages (DeepSeek, Anthropic, OpenAI, xAI, Zhipu, Moonshot, Alibaba). Cross-referenced with the pricing notes below.</p>
      </article>

      <!-- ───────────────── Note 5 — synthesis ───────────────── -->
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

      <!-- ───────────────── Note (中文) — AI 大分化 ───────────────── -->
      <article id="ai-da-fenhua-zh" class="note" lang="zh-Hans">
        <div class="note-head"><span class="chip">2026-06-14</span><span class="tag">中文 · 简体</span></div>
        <h3>AI 大分化：为什么智能越来越便宜，而卖智能的公司却越来越贵</h3>
        <p class="dek">一位开发者的 2026 年中 AI 经济与估值实地指南——从 token 价格，到万亿美元级别的 IPO。</p>

        <div class="note-video">
          <video class="note-video__player" controls preload="none" playsinline poster="/video/home-summary-zh.jpg" src="/video/home-summary-zh.mp4">
            您的浏览器不支持视频——<a href="/video/home-summary-zh.mp4">下载 MP4</a>。
          </video>
          <span class="note-video__tag">▶ 视频摘要 <small>· AI 配音（婷婷）+ 画面 · 约 1 分钟</small> · <a class="note-video__dl" href="/audio/home-summary-zh.mp3" download>仅音频</a></span>
        </div>

        <p>我靠搭建 AI 智能体（agentic AI）系统为生，所以我会死盯两个数字。第一个，是我运行自己产品时，每个 token 要付多少钱；第二个，是市场为持有那些卖我 token 的公司，每股要付多少钱。到了 2026 年，这两条线分化得如此剧烈，以至于它们之间的差距，本身就成了科技行业最重要的故事。智能正一个月比一个月便宜，而生产智能的公司却从未如此值钱。这两件事同时为真，而把它们调和起来，就是整盘棋的关键。</p>

        <h4>智能的成本正在崩塌</h4>
        <p>先从价目表说起。在最前沿，Anthropic 的 Fable 5 每百万输入 token 收 10 美元、输出 50 美元；Claude Opus 4.8 是 5/25 美元；OpenAI 的 GPT-5.5 是 5/30 美元；xAI 的 Grok 4.3 是 1.25/2.50 美元。这些是全世界最好的模型，而且都不便宜。</p>
        <p>再看地板价。DeepSeek（深度求索）的 V4-Pro，每百万输入 token 只要 0.435 美元、输出 0.87 美元；Flash 版本是 0.14/0.28 美元。月之暗面的 Kimi K2.6 约 0.95/4.00 美元；智谱的 GLM-4.7 是 0.60/2.20 美元；阿里巴巴的通义千问 Qwen-Plus 是 0.40/1.20 美元。在真实的混合负载下，DeepSeek V4-Pro 比 Opus 4.8 便宜约 22 倍，比 Fable 5 便宜约 44 倍——而在公开的编程与推理基准上，它的能力大约能达到九成到九成五。最便宜、又够用的算力供给，如今来自中国；当你卖的东西正以这种速度变成大路货时，举证责任就落到了你头上：凭什么你值一个溢价，凭什么你值一万亿美元。</p>

        <h4>订阅制这面镜子</h4>
        <p>同样的分化也出现在个人订阅上。想要西方实验室最高配的个人套餐，你几乎到哪儿都付一样的钱：Claude Max 20x、ChatGPT Pro、谷歌 AI Ultra 全都是每月 200 美元，SuperGrok Heavy 以 300 美元封顶。四家实验室，一个价格带。</p>
        <p>然后是中国。智谱的 GLM 编程套餐每月 10、30 或 80 美元，直接按额度接入 Claude Code；月之暗面的 Kimi 会员从 19 到 199 美元，含最多 300 个子智能体的「智能体集群」。对大多数工程师真正关心的那件事——整天跑一个智能编程助手——一个 10 到 30 美元的中国套餐，已经能做到 200 美元西方订阅大部分能做的事。但有一条注意事项比任何价格都重要：订阅没法驱动一个产品。它是给你这副键盘用的；一旦你上线了要服务用户的东西，就进入了按量计费的 API 世界——在那里，中国的差距不再是折扣，而是一个数量级。正确的架构干净地一分为二：固定费用的订阅给开发位，最便宜又够用的 API 给运行时。</p>

        <h4>没人做预算的成本中心</h4>
        <p>有一课只有当 token 账单变小后才会显现：当你跑在便宜的模型上时，搜索就成了你最大的成本。联网搜索按次收费、不按 token，所以模型降价时它并不跟着降。在一个接入实时联网的 DeepSeek 技术栈上，我亲眼看着搜索这一层膨胀到总账单的约四成。</p>
        <p>托管搜索 API Tavily，基础查询每次约 0.008 美元、高级约 0.016 美元；自建开源元搜索（如 SearXNG）把边际成本压到接近于零，代价是你得自己搭建并照看。「自建还是购买」的分水岭大约在每月一万到两万次搜索之间。无论哪种，值得优化的杠杆都已经从模型本身，变成了它周围的「管道」。</p>

        <h4>另一条线：估值在创历史新高</h4>
        <p>翻到资本这一面，数字朝相反方向走。Anthropic 在 5 月 28 日完成 650 亿美元 H 轮，投后估值 9650 亿美元，年化收入约 470 亿美元，首次反超 OpenAI，已秘密递交 IPO、目标 10 月上市。OpenAI 在 3 月以 8520 亿美元估值融资创纪录的 1220 亿美元，月收入约 20 亿美元，却仍巨额亏损。两家合起来值将近 1.8 万亿美元，谁都没能稳定盈利。</p>
        <p>它们身后是能解释这种紧迫感的资本开支：亚马逊、微软、Alphabet 和 Meta，2026 年合计释放约 7250 亿美元资本开支，同比增长约 75%，几乎全砸在数据中心和芯片上。而下面这部分应该让任何投资者停下来想想：同一批超大规模云厂商与芯片厂商——亚马逊、英伟达、微软、谷歌，加上三星、SK 海力士——正是这些实验室的领投方；实验室随后拿这些钱回头购买算力与存储，由此产生的收入又被记成支撑下一次估值上调的增长。英伟达在 OpenAI 的持股，很大程度上是 GPU 而非现金。这些股权结构，从设计上就是循环的。</p>

        <h4>马斯克奇点</h4>
        <p>没有人比埃隆·马斯克更能体现这种分化。2 月，SpaceX 把 xAI（它已拥有 X）并入一家单一实体，估值 1.25 万亿美元——史上最大合并。6 月 12 日，这家实体以约 1.77 万亿美元上市，融资约 750 亿美元，是历史上最大的 IPO，让马斯克成了全世界第一个万亿富翁——其中约 80% 的身家押在 SpaceX 这个估值上，约 95% 是尚未变现、流动性很差的股权。</p>
        <p>被高估了吗？要看你说的是哪一家。SpaceX 的发射业务有真正的护城河：可重复使用让猎鹰 9 号每公斤成本比中国一次性火箭便宜约 94%，星链已有 7000 多颗卫星在轨。但这 1.77 万亿美元已把星链的永久统治、再加上一个尚属投机的「轨道算力」未来都计入价格；独立分析师给出的合理估值更接近 6000 亿到 9000 亿美元。</p>
        <p>特斯拉是更清楚的例子：市盈率接近 350 倍，而比亚迪——2025 年卖出更多车（226 万辆对 164 万辆）、赚到更多收入（约 1180 亿美元对约 920 亿美元）、市盈率却只有 17 到 23 倍——市值还不到特斯拉的十分之一。在两家正面交锋的每个市场，比亚迪都靠价格取胜。特斯拉的溢价是一个关于机器人和无人出租车的故事，在本土靠 100% 的电动车关税庇护。</p>

        <h4>苹果这个信号</h4>
        <p>想用一个细节概括真正的杠杆在哪儿，就看苹果。这家地球上最值钱的消费公司，先用十年坚称要自研 AI，然后悄悄签下协议：每年向谷歌支付约 10 亿美元，买一个定制的、1.2 万亿参数的 Gemini 去驱动重建后的 Siri；而与此同时，谷歌仍每年向苹果支付约 200 亿美元，以成为 Safari 的默认搜索引擎。全世界最强大的品牌，选择了租用前沿智能，而不是自己造。</p>

        <h4>轨道这条新战线</h4>
        <p>SpaceX 的 IPO 卖点其实不是火箭，而是「太空云」。它已向美国 FCC 申请部署多达一百万颗 AI 卫星的星座。每个单元 AI1 搭载约 120 千瓦算力——约等于一个英伟达 GB300 机架——星舰一次可送上 30 到 50 个。乐观的算法令人咋舌：每年约新增 100 吉瓦轨道算力，太阳能供电，不接电网、不占土地。</p>
        <p>它同样高度投机。亚马逊云业务负责人称轨道数据中心离实用「还差得远」，辐射、散热与发射成本的问题都真实存在，成败系于星舰能否达到工业级发射频率。与此同时，中国正朝同一方向疾奔——国网、千帆、鸿鹄三个巨型星座合计目标约 4 万颗卫星，主要掣肘是还缺一枚成熟的可重复使用火箭。SpaceX 的领先是真实的，它的估值只是假定了这种领先永久存在——而中国正花着几百亿美元要证明并非如此。</p>

        <h4>保护主义这个信号</h4>
        <p>在这里，AI 经济与地缘政治融为一体。美国对中国电动车征收 100% 关税，外加对所有进口车另征 25%，实际上把比亚迪挡在了美国市场之外；一家贸易媒体把政策目的说得很直白：庇护一个产业，使其免于「它无法匹敌的价格竞争」。这不是对实力的描述，而是一个症状。</p>
        <p>同样的逻辑贯穿芯片出口管制：它本意是拖慢中国，却也加速了自给自足——DeepSeek 的 V4 系列跑在华为昇腾硬件上，智谱训练 GLM 时根本没用英伟达芯片。把对手从供应链切出去，你就逼它别无选择只能自己造。而且这些墙已在裂开：加拿大把电动车关税降到 6.1%，欧盟在设价格下限后放开市场，比亚迪正在墨西哥建厂并起诉要推翻美国关税。</p>

        <h4>这一切意味着什么</h4>
        <p>退一步看，这场分化收敛成一个论点：价值正在从模型，转移向算力、分发渠道，以及「谁掌握了规模化之后最便宜又够用的供给」。模型本身正在变成大路货，而这件大路货越来越多地来自中国。在估值游戏里胜出的，是掌握了基础设施层或分发层的公司——但即便这些护城河，也比万亿美元估值所暗示的更窄、更依赖政策。</p>
        <p class="take">对开发者，打法很清楚，我自己每天都这么做：默认走便宜的技术栈，只为真正需要的少数任务保留前沿模型，掌握住自己的搜索与数据层，永远别把订阅误当成生产基础设施。对投资者，警示同样清楚：当单位经济效益正在崩塌、而最强对手是被关税而非技术挡在门外时，很多所谓的「领先」都比看上去更靠不住。这扇正在打开的 IPO 窗口——Anthropic 在 10 月、SpaceX 已上市——正是这个问题第一次得到真正答案的地方。比起任何一次模型发布，我会更紧盯这场重新定价。</p>
        <p class="verify"><strong>数据来源（2026 年中，来自公开报道与各公司公开定价）：</strong>各模型 API 价格；Anthropic 650 亿美元 H 轮 / 9650 亿美元估值 / 约 470 亿美元年化收入；OpenAI 1220 亿美元融资 / 8520 亿美元估值；四大厂商约 7250 亿美元资本开支；SpaceX–xAI 合并 1.25 万亿美元、6 月 12 日 IPO 约 1.77 万亿美元；特斯拉对比亚迪销量 / 营收 / 市盈率；苹果向谷歌支付约 10 亿美元、谷歌向苹果约 200 亿美元；SpaceX 太空云 FCC 申请与中国约 4 万颗卫星计划；美国 100% 电动车关税等。估值合理区间与净资产构成为分析师估计。</p>
        <p class="src">作者：Bo Shang（商波）· <a href="mailto:bo&#64;shang.software">bo&#64;shang.software</a> · <a routerLink="/">erosolar.org</a></p>
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
    .note-audio { display:flex; align-items:center; gap:.7rem; flex-wrap:wrap; margin:.2rem 0 1rem; padding:.6rem .8rem; border:1px solid var(--line-soft); border-radius:10px; background:rgba(255,255,255,.02); }
    .note-audio__tag { font-family:var(--mono); font-size:.72rem; color:var(--solar); white-space:nowrap; }
    .note-audio__tag small { color:var(--muted); }
    .note-audio__player { height:32px; flex:1; min-width:220px; }
    .note-audio__dl { font-family:var(--mono); font-size:.72rem; color:var(--muted); text-decoration:none; }
    .note-audio__dl:hover { color:var(--solar); }
    .note-video { margin:.2rem 0 1rem; }
    .note-video__player { width:100%; max-width:640px; border-radius:12px; border:1px solid var(--line-soft); background:#000; display:block; }
    .note-video__tag { display:inline-block; margin-top:.45rem; font-family:var(--mono); font-size:.72rem; color:var(--solar); }
    .note-video__tag small { color:var(--muted); }
    .note-video__dl { color:var(--muted); text-decoration:none; }
    .note-video__dl:hover { color:var(--solar); }
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
