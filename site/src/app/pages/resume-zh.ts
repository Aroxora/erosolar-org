import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Proj { org: string; role: string; period: string; impact: string; tech: string[]; }

@Component({
  selector: 'app-resume-zh',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="section" lang="zh-Hans">
      <div class="section-head">
        <p class="kicker">/ 中文简历 · résumé</p>
        <h2 class="title">商波（Bo Shang）— AI 工程师 / 创始人</h2>
        <p class="sub">独立、端到端地构建可拥有、可验证的长周期 AI 智能体系统与底层基础设施。<a routerLink="/resume">English résumé →</a></p>
      </div>

      <h3>个人简介</h3>
      <p class="prose">我是一名 AI 工程师与创业者（Trenchwork 创始人），大部分系统都由我独自从头到尾构建。我的优势在于对整个 AI 技术栈的纵深掌握：智能体架构与工具调用、多模型编排、提示词缓存与上下文工程、检索与搜索管道（托管与自建），以及大多数团队都做错的成本经济学。我按能力与价格，在 Claude、GPT、Grok 与中国前沿模型（DeepSeek、通义千问、Kimi、GLM）之间做路由，并公开撰写关于 AI 成本、价值与竞争走向的分析。我拥有安全工程背景（塔夫茨大学 Tufts），在网络安全、应用 AI 与中国科技的交汇处工作；从第一性原理思考，靠亲手把最难的东西造出来学得最快。</p>

      <h3>核心能力</h3>
      <ul class="skills">
        <li><strong>智能体工程：</strong>智能体架构、工具调用、对抗式校验器、权限模式、长周期后台任务、无头事件流 SDK。</li>
        <li><strong>多模型编排：</strong>按能力与价格分层路由（DeepSeek-v4-pro + Tavily 为默认运行时，约比 Opus 4.8 便宜 22 倍），仅在最难任务上升级到前沿模型；token 上限 + 激进缓存。</li>
        <li><strong>LLMOps / AI 成本优化：</strong>区分“开发位”与“产品运行时”；搜索层优化（廉价 token 下搜索约占账单四成）；托管（Tavily）与自建（SearXNG）的“自建还是购买”取舍。</li>
        <li><strong>检索与上下文：</strong>RAG 嵌入、提示词缓存、上下文工程、实时联网检索管道。</li>
        <li><strong>全栈与基础设施：</strong>Angular、Node/TypeScript、Go、Firebase（Hosting/Firestore/Admin）、AWS Lambda + API Gateway、SwiftUI（iOS/Watch）、ffmpeg。</li>
        <li><strong>安全工程：</strong>防御性网络安全、红队思维、可审计与最小权限的系统设计。</li>
      </ul>

      <h3>代表项目（按用途描述）</h3>
      <div class="proj-grid">
        @for (p of projects; track p.org) {
          <div class="proj">
            <div class="proj__meta"><span class="proj__period">{{ p.period }}</span><span class="proj__org">{{ p.org }}</span></div>
            <h4 class="proj__role">{{ p.role }}</h4>
            <p class="proj__impact">{{ p.impact }}</p>
            <div class="proj__tech">@for (t of p.tech; track t) { <span class="tag">{{ t }}</span> }</div>
          </div>
        }
      </div>

      <h3>公开写作</h3>
      <p class="prose">在 erosolar.org 的「<a routerLink="/notes">Field notes</a>」专栏撰写有数据支撑的 AI 经济与基础设施分析：搜索层的“自建还是购买”、西方 200 美元订阅 vs 中国价格地板、2026 年算力与资本的故事（循环式超大规模厂商融资、苹果–谷歌 Siri 协议、SpaceX/xAI 约 1.25 万亿美元合并与轨道数据中心），以及一份「AI 权力榜」领袖逐一打分与预测。每篇都明确区分“已核实数据”与“估计值”。</p>

      <h3>教育背景</h3>
      <p class="prose">塔夫茨大学（Tufts University）— 安全工程方向背景。</p>

      <h3>求职意向</h3>
      <p class="prose">寻求加入愿意直面高难度技术与人性问题的 AI 工程团队。开放于 AI 工程、LLMOps、研究工程、红队 / AI 安全与基础设施岗位——<strong>包括海外职位，愿意配合任何所需的签证、担保与搬迁流程</strong>。</p>

      <h3>联系方式</h3>
      <p class="prose">
        邮箱：<a href="mailto:bo&#64;shang.software">bo&#64;shang.software</a> · <a href="mailto:bo&#64;trenchwork.org">bo&#64;trenchwork.org</a> ·
        电话：<a href="tel:+15082600326">508-260-0326</a> ·
        网站：<a routerLink="/">erosolar.org</a> ·
        <a href="https://www.linkedin.com/in/bo-shang-04923b3a6" target="_blank" rel="noopener">LinkedIn</a> ·
        <a href="https://github.com/aroxora" target="_blank" rel="noopener">GitHub</a>
      </p>
    </div>
  `,
  styles: [`
    h3 { font-family:var(--display); margin:1.8rem 0 .5rem; font-size:1.3rem; }
    .prose { color:var(--ink-2); line-height:1.8; max-width:80ch; }
    .skills { color:var(--ink-2); line-height:1.8; max-width:84ch; padding-left:1.1rem; }
    .skills li { margin:.4rem 0; }
    .proj-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1rem; margin-top:.6rem; }
    .proj { border:1px solid var(--line-soft); border-radius:14px; padding:1.2rem 1.3rem; background:linear-gradient(180deg, var(--surface), var(--surface-2)); }
    .proj__meta { display:flex; gap:.6rem; align-items:baseline; flex-wrap:wrap; font-family:var(--mono); font-size:.72rem; }
    .proj__period { color:var(--solar); } .proj__org { color:var(--muted); }
    .proj__role { font-family:var(--display); margin:.3rem 0 .4rem; font-size:1.12rem; }
    .proj__impact { color:var(--ink-2); line-height:1.7; margin:0 0 .6rem; }
    .proj__tech { display:flex; gap:.35rem; flex-wrap:wrap; }
    .tag { font-family:var(--mono); font-size:.66rem; color:var(--ink-2); border:1px solid var(--line-soft); border-radius:999px; padding:.16rem .5rem; }
    a { color:var(--solar); }
  `],
})
export class ResumeZh {
  readonly projects: Proj[] = [
    { period: '2025–2026', org: 'Trenchwork — Vigil', role: 'AI 防御性网络安全智能体', impact: '在自有公司 Trenchwork 旗下构建 Vigil：一个 AI 驱动的防御性网络安全智能体；并打造「Women Who Defend」——一个动手实战的安全工程学习平台。', tech: ['AI 安全', '红队', 'Node/TS', 'Firebase'] },
    { period: '2025–2026', org: 'Erosolar Coder / Anvilwing', role: '终端编程智能体（作者）', impact: '已发布到 npm 的、与 Claude Code 同级的终端编程智能体：DeepSeek v4 Pro 百万级上下文 + 对抗式校验器、权限模式、彩色 diff、后台长任务、无头事件流 SDK。完全由你拥有，无托管中间层。', tech: ['TypeScript', 'Ink + React', 'DeepSeek', 'node-pty'] },
    { period: '2024–2026', org: 'Erosolar', role: '自主 AI 研究助手', impact: '长周期的自主 AI 研究助手，自带编程 CLI；用同一套 DeepSeek-v4-pro + Tavily 的有据可循（grounded）智能体循环，快速进入新领域并达到生产质量。', tech: ['DeepSeek', 'Tavily', 'RAG', 'Angular'] },
    { period: '2025–2026', org: 'Frontier Model Index', role: '智能体管道工程师', impact: '每日自动更新的 AI 前沿图谱（三个线上站点 + iOS）：Tavily 检索 + DeepSeek-V4 合成，通过 Admin SDK 直写 Firestore；静态站点实时读取，内容更新无需重新部署。', tech: ['Firebase', 'DeepSeek', 'Tavily', 'SwiftUI'] },
    { period: '2025–2026', org: 'The Meridian', role: '主编（全自动）', impact: '全自动的经济学人风格报纸：DeepSeek 策划、采写、核查、改写，OpenAI TTS 配音；Angular PWA + iOS + Apple Watch、VAPID 推送、动态信息流;成本受控。', tech: ['Cloud Functions', 'DeepSeek', 'OpenAI TTS', 'Angular'] },
    { period: '2025–2026', org: 'DRIFT', role: '故事与科学系统', impact: '硬科幻剧本网站 + 每周「活体科学」策展（DeepSeek+Tavily），以及长周期视频管道（导演 → 图生视频链 → ffmpeg 拼接，可续跑、自愈）与有据可循的伴读问答。', tech: ['Angular', 'DeepSeek + Tavily', 'ffmpeg', 'SwiftUI'] },
    { period: '2025–2026', org: 'Trenchwork（活动追踪）', role: '动量系统', impact: 'Go 桌面守护进程（进程/tty/git 真实活动检测）+ iOS/Apple Watch 实时活动 + 基于 Tailscale 的长任务审批；7×24 智能提醒调度;全程归属于本人。', tech: ['Go', 'Firebase', 'WidgetKit/ActivityKit', 'Tailscale'] },
    { period: '2025–2026', org: 'Endearo', role: '个人 AI 生活助手', impact: '7×24 主动式助手:通过本地守护进程 + 邮件桥只读读取我自己的收件箱,维护向量记忆、档案与待办,把零散输入转化为下一步具体行动;非破坏性、仅自我通信、完全披露 AI 作者身份。', tech: ['Node ESM', 'IMAP/SMTP', 'DeepSeek + Tavily', 'Firestore'] },
  ];
}
