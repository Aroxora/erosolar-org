import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FirestoreService, PhdProgram } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { SEED_PHDS } from '../seed.data';

interface AiLab {
  name: string;
  location: string;
  country: string; // ISO-ish code used by region map + filters
  region: string; // grouping bucket for "sort by location"
  type: 'University' | 'Industry' | 'Institute';
  focus: string;
  phd: string; // PhD / opportunities
  notable: string; // notable groups / faculty / affiliated labs
  website: string;
  notes: string;
}

// Region order for "sort by location". Every country code maps into one bucket.
const REGION_ORDER = [
  'United States',
  'Canada',
  'United Kingdom',
  'Europe (ex-UK)',
  'Israel & Middle East',
  'China (mainland)',
  'Hong Kong',
  'Asia (ex-China/HK)',
  'Australia',
];

@Component({
  selector: 'app-phd-labs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ phd programs &amp; top ai labs</p>
        <h2 class="title">Full directory: PhD programs &amp; AI research labs — every region</h2>
        <p class="sub">
          A comprehensive, expandable directory of the world's leading AI/ML/CS PhD programs and research
          labs — the United States (MIT, Stanford, Harvard, CMU, Berkeley and more, in depth), China, Hong
          Kong, Canada, the UK, the rest of Europe, Israel &amp; the Middle East, the rest of Asia, and
          Australia. <strong>Click any card to expand its full description.</strong> Sort by location to
          browse region-by-region. Live application status (where known) is kept fresh agentically with
          DeepSeek-v4-pro + Tavily.
        </p>
      </div>

      @if (auth.isAdmin()) {
        <div class="admin-bar">
          <button class="btn btn-solar" (click)="refreshPhds()">Refresh live PhD status (admin)</button>
          <span class="small">Triggers an agent scan. Live results stream into the status section below.</span>
        </div>
      }

      <!-- Filters -->
      <div class="filters">
        <input class="in grow" [(ngModel)]="search" placeholder="Search program, lab, city, focus area, faculty…">
        <select class="in" [(ngModel)]="regionFilter">
          <option value="">All regions</option>
          @for (r of regionOrder; track r) { <option [value]="r">{{ r }}</option> }
        </select>
        <select class="in" [(ngModel)]="typeFilter">
          <option value="">All types</option>
          <option value="University">University programs</option>
          <option value="Industry">Industry labs</option>
          <option value="Institute">Institutes</option>
        </select>
        <select class="in" [(ngModel)]="labSort">
          <option value="location">Sort: Location (region)</option>
          <option value="name">Sort: Name (A–Z)</option>
          <option value="type">Sort: Type</option>
        </select>
        <button class="btn" (click)="expandAll()">Expand all</button>
        <button class="btn" (click)="collapseAll()">Collapse all</button>
        <button class="btn" (click)="clearFilters()">Clear</button>
      </div>
      <p class="count small">{{ visibleCount() }} of {{ allLabs.length }} programs/labs shown.</p>

      <!-- Directory: grouped by region when sorting by location, else a flat list -->
      @for (group of groupedLabs(); track group.region) {
        <div class="region-block">
          @if (labSort !== 'name') {
            <h3 class="region-head">{{ group.region }} <span class="rc">{{ group.labs.length }}</span></h3>
          }
          <div class="labs-grid">
            @for (lab of group.labs; track lab.name) {
              <div class="lab-card" [class.open]="isExpanded(lab.name)">
                <button class="lab-hdr" (click)="toggle(lab.name)" [attr.aria-expanded]="isExpanded(lab.name)">
                  <span class="lab-title">
                    <strong>{{ lab.name }}</strong>
                    <span class="loc">{{ lab.location }}</span>
                  </span>
                  <span class="badges">
                    <span class="type-tag" [class.industry]="lab.type==='Industry'" [class.institute]="lab.type==='Institute'">{{ lab.type }}</span>
                    <span class="chev">{{ isExpanded(lab.name) ? '−' : '+' }}</span>
                  </span>
                </button>

                @if (!isExpanded(lab.name)) {
                  <p class="teaser">{{ lab.focus }}</p>
                } @else {
                  <div class="lab-body">
                    <p><strong>Focus.</strong> {{ lab.focus }}</p>
                    <p><strong>PhD &amp; opportunities.</strong> {{ lab.phd }}</p>
                    <p><strong>Notable groups / people.</strong> {{ lab.notable }}</p>
                    <p class="muted">{{ lab.notes }}</p>
                    <a [href]="lab.website" target="_blank" rel="noopener" class="go">Official site / admissions →</a>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (visibleCount() === 0) {
        <p class="muted">No programs or labs match your filters. <a href="javascript:void(0)" (click)="clearFilters()">Clear filters</a>.</p>
      }

      <!-- Live PhD application status (agentic) -->
      <h3 class="sec-head">Live application status <span class="small">(agent-tracked)</span></h3>
      <p class="sub">Current known application windows for tracked programs, refreshed by the DeepSeek + Tavily agent. Cards above are the full directory; the table below is the live status feed.</p>

      @if (phds().length === 0) {
        <p class="muted">No live status records yet. An admin can trigger a scan above (or via the chatbot: "scan phd now"). The full directory above is always available.</p>
      } @else {
        <div class="sort-controls">
          <label>Sort live table by: </label>
          <select class="in" [value]="sortColumn()" (change)="sortColumn.set($any($event.target).value)">
            <option value="country">Location (Country)</option>
            <option value="uni">University</option>
            <option value="program">Program</option>
            <option value="status">Status</option>
            <option value="deadline">Deadline</option>
          </select>
          <button class="btn" (click)="sortDirection.set(sortDirection() === 'asc' ? 'desc' : 'asc')">
            {{ sortDirection() === 'asc' ? '↑ Asc' : '↓ Desc' }}
          </button>
        </div>

        <div class="table-wrap">
          <table class="phd-table">
            <thead>
              <tr>
                <th (click)="setSort('program')">Program</th>
                <th (click)="setSort('uni')">University</th>
                <th (click)="setSort('country')">Location</th>
                <th (click)="setSort('status')">Status</th>
                <th (click)="setSort('deadline')">Deadline</th>
                <th>Visa / Intl</th>
                <th>Notes</th>
                <th>Checked</th>
              </tr>
            </thead>
            <tbody>
              @for (p of sortedPhds(); track p.id) {
                <tr [class.open-row]="isOpen(p)">
                  <td><strong>{{ p.program }}</strong></td>
                  <td>{{ p.uni }}</td>
                  <td><span class="country-tag">{{ p.country }}</span></td>
                  <td><span class="status" [class.open]="isOpen(p)" [class.closed]="!isOpen(p)">{{ p.status }}</span></td>
                  <td>{{ p.deadline || '—' }}</td>
                  <td class="small">{{ p.visaNotes || '—' }}</td>
                  <td class="small">{{ p.notes || '—' }}</td>
                  <td class="small">{{ p.lastChecked || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <div class="note">
        <p>
          Application windows change quickly. Use the live status feed for current deadlines and the
          expandable directory above for breadth. Many programs and labs — especially in China, Hong Kong,
          Canada, Europe, and Singapore — actively welcome international applicants and provide visa support.
          Admins can ask the chatbot to "scan phd now" for the freshest read.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .filters { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:.6rem; align-items:center; }
    .in { background:#111; color:#ddd; border:1px solid #333; padding:.45rem .6rem; border-radius:8px; }
    .in.grow { flex:1; min-width:220px; }
    .count { margin:.1rem 0 1.1rem; }
    .region-block { margin-bottom:1.4rem; }
    .region-head { font-family:var(--display); color:var(--solar); margin:1.2rem 0 .6rem; display:flex; align-items:center; gap:.5rem; }
    .region-head .rc { font-family:var(--mono); font-size:.7rem; color:var(--muted); border:1px solid var(--line); border-radius:999px; padding:0 .45rem; }
    .labs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:.7rem; }
    .lab-card { border:1px solid var(--line-soft); border-radius:11px; background:var(--surface); overflow:hidden; transition:border-color .2s; }
    .lab-card.open { border-color:var(--solar); }
    .lab-hdr { width:100%; text-align:left; background:none; border:0; color:inherit; cursor:pointer; padding:.8rem .9rem; display:flex; justify-content:space-between; align-items:flex-start; gap:.6rem; }
    .lab-hdr:hover { background:rgba(255,255,255,.02); }
    .lab-title { display:flex; flex-direction:column; gap:.15rem; }
    .lab-title strong { font-size:.98rem; line-height:1.25; }
    .loc { font-family:var(--mono); font-size:.7rem; color:var(--muted); }
    .badges { display:flex; align-items:center; gap:.4rem; flex-shrink:0; }
    .type-tag { font-size:.6rem; padding:.1rem .35rem; border-radius:4px; background:#243; color:#9fd; white-space:nowrap; }
    .type-tag.industry { background:#342; color:#fd9; }
    .type-tag.institute { background:#234; color:#9cf; }
    .chev { font-family:var(--mono); font-size:1rem; color:var(--solar); width:1ch; }
    .teaser { padding:0 .9rem .8rem; margin:0; font-size:.84rem; color:var(--muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .lab-body { padding:0 .9rem .9rem; font-size:.86rem; color:var(--ink-2); line-height:1.5; }
    .lab-body p { margin:.35rem 0; }
    .lab-body .muted { color:var(--muted); font-size:.82rem; }
    .go { color:var(--solar); font-size:.8rem; display:inline-block; margin-top:.3rem; }
    .admin-bar { margin-bottom:1rem; }
    .sec-head { margin-top:2.4rem; font-family:var(--display); }
    .sort-controls { display:flex; align-items:center; gap:.5rem; margin:.6rem 0; flex-wrap:wrap; }
    .table-wrap { overflow:auto; }
    .phd-table { width:100%; border-collapse:collapse; font-size:.88rem; }
    .phd-table th, .phd-table td { padding:.5rem .55rem; border-bottom:1px solid var(--line-soft); text-align:left; vertical-align:top; }
    .phd-table th { cursor:pointer; font-family:var(--mono); font-size:.74rem; color:var(--solar); user-select:none; white-space:nowrap; }
    .phd-table tr.open-row { background:rgba(42,85,0,.08); }
    .country-tag { font-family:var(--mono); font-size:.72rem; padding:.1rem .35rem; background:var(--surface-2); border-radius:3px; }
    .status { font-size:.7rem; padding:.1rem .4rem; border-radius:4px; }
    .status.open { background:#1a3; color:#9f9; }
    .status.closed { background:#3a2424; color:#f99; }
    .note { margin-top:1.4rem; font-size:.84rem; color:var(--muted); max-width:82ch; }
    .muted { color:var(--muted); }
    .btn { white-space:nowrap; }
    @media (max-width:560px){ .labs-grid { grid-template-columns:1fr; } }
  `]
})
export class PhdLabs implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);
  auth = inject(AuthService);

  readonly regionOrder = REGION_ORDER;

  phds = signal<PhdProgram[]>([]);
  private unsub?: () => void;

  search = '';
  regionFilter = '';
  typeFilter = '';
  labSort: 'location' | 'name' | 'type' = 'location';

  private expanded = signal<Set<string>>(new Set());

  // Live-table sorting
  sortColumn = signal<'country' | 'uni' | 'program' | 'status' | 'deadline'>('country');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // ── Comprehensive directory (curated, agentically extended) ─────────────────
  allLabs: AiLab[] = [
    // ===== United States — universities (marquee schools in depth) =====
    { name: 'MIT — CSAIL & EECS', location: 'Cambridge, MA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'The full breadth of AI: deep learning, NLP, computer vision, robotics, reinforcement learning, AI safety/alignment, theory, and ML systems. CSAIL is one of the largest academic CS/AI labs in the world.',
      phd: 'PhD via EECS (course 6) — admission is to the department, then you join a research group. Among the most competitive programs globally; full funding (RA/TA/fellowship) is standard. No master\'s required to apply.',
      notable: 'CSAIL, the Schwarzman College of Computing, Improbable AI, the Medard/Jaakkola/Barzilay/Torralba/Tedrake groups, MIT-IBM Watson AI Lab.',
      website: 'https://www.eecs.mit.edu/academics/graduate-programs/', notes: 'Deadline typically mid-December for fall entry. Excellent support for international students.' },
    { name: 'Stanford — SAIL & HAI', location: 'Stanford, CA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Foundation models, agents, vision, robotics, NLP, human-centered AI. Stanford AI Lab (SAIL) plus the Institute for Human-Centered AI (HAI) and the Center for Research on Foundation Models (CRFM).',
      phd: 'PhD through the CS department; you apply to the program and match with an advisor in your first year. Extremely selective, fully funded. Heart of Silicon Valley with deep industry ties.',
      notable: 'SAIL, HAI, CRFM, Stanford NLP (Manning), Vision & Learning Lab, Fei-Fei Li, Chelsea Finn, Percy Liang.',
      website: 'https://cs.stanford.edu/admissions/phd', notes: 'Application typically due early December. Strong pipeline into frontier labs.' },
    { name: 'Harvard — SEAS & Kempner Institute', location: 'Cambridge, MA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Machine learning theory and practice, NLP, AI safety, computational neuroscience, and the intersection of natural and artificial intelligence via the Kempner Institute.',
      phd: 'PhD through SEAS (Computer Science) / the Graduate School of Arts and Sciences. Strong interdisciplinary options across statistics, neuroscience, and the medical school. Fully funded.',
      notable: 'Kempner Institute for the Study of Natural & Artificial Intelligence, the ML Foundations group, Hima Lakkaraju, Sham Kakade, Boaz Barak.',
      website: 'https://seas.harvard.edu/computer-science', notes: 'Mid-December deadline. Excellent for safety, theory, and neuro-AI.' },
    { name: 'Carnegie Mellon — SCS (LTI, MLD, RI)', location: 'Pittsburgh, PA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Arguably the deepest AI bench in academia: the Language Technologies Institute (NLP/speech/agents), the Machine Learning Department, and the Robotics Institute, plus the new AI major.',
      phd: 'Multiple separate PhD programs (LTI, MLD, RI, CSD) — apply directly to the institute that fits. Legendary for language, ML, and robotics. Very international-friendly, fully funded.',
      notable: 'LTI, MLD, Robotics Institute, Graham Neubig, Zico Kolter, Ruslan Salakhutdinov, the Auton Lab.',
      website: 'https://www.lti.cs.cmu.edu/learn', notes: 'Deadlines vary by institute, typically December. One of the strongest NLP/agents pipelines anywhere.' },
    { name: 'UC Berkeley — BAIR', location: 'Berkeley, CA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Deep learning, reinforcement learning, robotics, computer vision, NLP, and AI safety. Berkeley AI Research (BAIR) is a hub of open-source, heavily-cited work.',
      phd: 'PhD via EECS; admission is to the department and you join a BAIR group. Extremely competitive and fully funded. Strong RL and robotics tradition; close to the Bay Area ecosystem.',
      notable: 'BAIR, RISELab/Sky Computing, CHAI (Center for Human-Compatible AI, Stuart Russell), Sergey Levine, Pieter Abbeel, Dawn Song.',
      website: 'https://www2.eecs.berkeley.edu/Admissions/Grad/', notes: 'Early-December deadline. CHAI is a leading academic home for AI alignment.' },
    { name: 'Princeton — CS & PLI', location: 'Princeton, NJ, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML theory, NLP, computer vision, and AI for society. The Princeton Language & Intelligence (PLI) initiative focuses on large models.',
      phd: 'PhD in Computer Science; admitted to the department, fully funded. Small, selective, theory-strong.',
      notable: 'PLI, Sanjeev Arora, Karthik Narasimhan, Danqi Chen, the theory group.', website: 'https://www.cs.princeton.edu/grad/admissions', notes: 'December deadline. Outstanding for theory + LLMs.' },
    { name: 'University of Washington — Allen School', location: 'Seattle, WA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'A top-tier program for NLP, ML, vision, and systems, tightly linked to the Allen Institute for AI (AI2). Especially strong in language.',
      phd: 'PhD via the Paul G. Allen School; admitted to the department. Fully funded, large AI faculty, deep AI2 collaboration.',
      notable: 'UW NLP, Noah Smith, Yejin Choi, Luke Zettlemoyer, RAIVN lab; AI2 partnership.', website: 'https://www.cs.washington.edu/academics/phd', notes: 'Mid-December deadline. A clear NLP powerhouse.' },
    { name: 'Caltech — CMS', location: 'Pasadena, CA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML theory, robotics, vision, and AI for science. Computing + Mathematical Sciences is small and intensely research-focused.',
      phd: 'Very small, highly selective PhD with close faculty contact and full funding.', notable: 'Yisong Yue, Anima Anandkumar, Pietro Perona, the AI4Science efforts.', website: 'https://www.cms.caltech.edu/academics/grad_cms', notes: 'December deadline. Elite for theory + interdisciplinary AI.' },
    { name: 'Cornell — CS / Cornell Tech', location: 'Ithaca & NYC, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML, NLP, vision, and AI ethics/fairness, split across the Ithaca campus and Cornell Tech in NYC.',
      phd: 'PhD in Computer Science, fully funded; you can be based in Ithaca or NYC depending on advisor.', notable: 'Kilian Weinberger, the fairness group, Cornell Tech.', website: 'https://www.cs.cornell.edu/phd', notes: 'December deadline. Strong, well-rounded program.' },
    { name: 'UIUC — Siebel School of Computing & Data Science', location: 'Urbana, IL, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Computer vision, NLP, ML systems, and robotics, with one of the largest CS programs in the US.',
      phd: 'Large, well-funded PhD with many AI faculty and strong systems/vision tradition.', notable: 'Heng Ji, Svetlana Lazebnik, the systems + vision groups.', website: 'https://cs.illinois.edu/academics/graduate', notes: 'December deadline. Great for systems-flavored AI.' },
    { name: 'Georgia Tech — Machine Learning (ML@GT)', location: 'Atlanta, GA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Robotics, ML, computer vision, and interactive/embodied AI. The interdisciplinary ML PhD spans many colleges.',
      phd: 'Dedicated interdisciplinary ML PhD plus CS PhD; large, well-funded, collaborative.', notable: 'ML@GT, Dhruv Batra, Devi Parikh, the robotics + RL groups.', website: 'https://ml.gatech.edu/phd-machine-learning', notes: 'December deadline. Strong for robotics + embodied AI.' },
    { name: 'University of Michigan — CSE', location: 'Ann Arbor, MI, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML, robotics, NLP, and AI for healthcare, with excellent funding at a top public university.',
      phd: 'PhD via CSE; fully funded, broad AI faculty.', notable: 'Honglak Lee, the AI lab, robotics institute.', website: 'https://cse.engin.umich.edu/academics/graduate/', notes: 'December deadline.' },
    { name: 'UT Austin — CS & Good Systems', location: 'Austin, TX, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'NLP, RL, robotics, and ML, with a strong and growing AI presence and ties to local industry.',
      phd: 'PhD in CS, fully funded; strong NLP and RL groups.', notable: 'Peter Stone, Ray Mooney, Greg Durrett, Scott Niekum (RL).', website: 'https://www.cs.utexas.edu/graduate-programs', notes: 'December deadline. Excellent RL/NLP.' },
    { name: 'NYU — Courant & Center for Data Science', location: 'New York, NY, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Deep learning, NLP, and the science of ML. CDS and Courant have a storied deep-learning lineage.',
      phd: 'PhD via Computer Science (Courant) or Data Science; fully funded, NYC location.', notable: 'Yann LeCun (NYU/Meta), Kyunghyun Cho, Sam Bowman, the CDS group.', website: 'https://cds.nyu.edu/phd/', notes: 'December deadline. Deep-learning heritage + NYC.' },
    { name: 'University of Pennsylvania — CIS & GRASP', location: 'Philadelphia, PA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML, NLP, and one of the premier robotics labs (GRASP).',
      phd: 'PhD in CIS, fully funded; pick GRASP for robotics or the ML/NLP groups.', notable: 'GRASP Lab, Lyle Ungar, Chris Callison-Burch.', website: 'https://www.cis.upenn.edu/graduate/', notes: 'December deadline. Robotics standout.' },
    { name: 'Johns Hopkins — CLSP & CS', location: 'Baltimore, MD, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Speech and language processing (the Center for Language and Speech Processing is legendary) plus ML and medical AI.',
      phd: 'PhD in CS; CLSP is a top destination for speech/NLP, fully funded.', notable: 'CLSP, Jason Eisner, the speech group.', website: 'https://www.cs.jhu.edu/graduate-studies/', notes: 'December deadline. Premier for speech/NLP.' },
    { name: 'Columbia — CS', location: 'New York, NY, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML, NLP, vision, and AI applied to finance and media, with NYC industry access.', phd: 'PhD in CS, fully funded.', notable: 'Kathleen McKeown (NLP), the Data Science Institute.', website: 'https://www.cs.columbia.edu/education/phd/', notes: 'December deadline.' },
    { name: 'UCLA — CS', location: 'Los Angeles, CA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'Computer vision, NLP, ML, and AI for science, with a large AI faculty.', phd: 'PhD in CS, fully funded.', notable: 'Song-Chun Zhu (formerly), Kai-Wei Chang, the vision groups.', website: 'https://www.cs.ucla.edu/graduate-program/', notes: 'December deadline.' },
    { name: 'UC San Diego — CSE & HDSI', location: 'La Jolla, CA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML, NLP, vision, and data science, with strong systems and a growing AI bench.', phd: 'PhD in CSE; fully funded.', notable: 'Julian McAuley, the Halıcıoğlu Data Science Institute.', website: 'https://cse.ucsd.edu/graduate', notes: 'December deadline.' },
    { name: 'University of Wisconsin–Madison — CS', location: 'Madison, WI, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'ML theory and optimization, NLP, and AI systems at a strong public research university.', phd: 'PhD in CS, fully funded.', notable: 'Optimization + ML groups, Jerry Zhu.', website: 'https://www.cs.wisc.edu/graduate/phd/', notes: 'December deadline.' },
    { name: 'UMass Amherst — CICS', location: 'Amherst, MA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'A renowned NLP and information-retrieval program, plus ML and RL.', phd: 'PhD via the College of Information & Computer Sciences; fully funded.', notable: 'The Center for Intelligent Information Retrieval (CIIR), Andrew McCallum, Mohit Iyyer.', website: 'https://www.cics.umass.edu/graduate', notes: 'December deadline. NLP/IR strength punches above its rank.' },
    { name: 'University of Southern California — ISI', location: 'Los Angeles, CA, USA', country: 'US', region: 'United States', type: 'University',
      focus: 'NLP, ML, and knowledge systems, anchored by the Information Sciences Institute.', phd: 'PhD in CS; many students affiliate with ISI; fully funded.', notable: 'ISI, the NLP group.', website: 'https://www.cs.usc.edu/academics/phd/', notes: 'December deadline.' },

    // ===== United States — industry labs =====
    { name: 'Anthropic', location: 'San Francisco, CA, USA', country: 'US', region: 'United States', type: 'Industry',
      focus: 'Frontier model research with a safety-first mission: interpretability, scalable oversight, RL from human/AI feedback, and the Claude model family.',
      phd: 'Not a degree program, but hires research engineers, research scientists, and runs residencies/fellowships; PhD-level research roles and internships are common entry points.',
      notable: 'Interpretability team, Alignment Science, the Claude models.', website: 'https://www.anthropic.com/careers', notes: 'Visa sponsorship varies by role; strong destination for safety-minded researchers.' },
    { name: 'OpenAI', location: 'San Francisco, CA, USA', country: 'US', region: 'United States', type: 'Industry',
      focus: 'Frontier models (GPT family), reasoning, multimodality, agents, and alignment.', phd: 'Research scientist/engineer roles, a Residency program, and internships are the main paths in.', notable: 'The reasoning + alignment teams.', website: 'https://openai.com/careers', notes: 'Sponsorship available for many roles.' },
    { name: 'Google DeepMind (US)', location: 'Mountain View, CA, USA', country: 'US', region: 'United States', type: 'Industry',
      focus: 'Foundational AI research — Gemini, RL, multimodality, AI for science (AlphaFold lineage), and safety.', phd: 'Research scientist/engineer roles, a strong internship pipeline, and the (UK-rooted) academic partnerships.', notable: 'Gemini, the safety + science teams.', website: 'https://deepmind.google/about/careers/', notes: 'Sponsorship common; deeply academic.' },
    { name: 'Meta — FAIR / GenAI', location: 'Menlo Park, CA & NYC, USA', country: 'US', region: 'United States', type: 'Industry',
      focus: 'Open research and open-weight models (Llama), vision, NLP, and ML systems.', phd: 'FAIR hires research scientists and runs a well-known PhD internship + residency pipeline.', notable: 'FAIR, the Llama team, Yann LeCun.', website: 'https://www.metacareers.com/', notes: 'Strong open-source culture.' },
    { name: 'Microsoft Research', location: 'Redmond, WA & worldwide', country: 'US', region: 'United States', type: 'Industry',
      focus: 'Broad AI research — LLMs, ML theory, systems, NLP, and AI for science — across many global labs.', phd: 'Research roles, PhD internships, and the MSR PhD Fellowship.', notable: 'MSR Redmond, MSR NYC, MSR AI4Science; ties to OpenAI.', website: 'https://www.microsoft.com/en-us/research/careers/', notes: 'One of the largest industrial research footprints.' },
    { name: 'Allen Institute for AI (AI2)', location: 'Seattle, WA, USA', country: 'US', region: 'United States', type: 'Institute',
      focus: 'Open, reproducible AI — open models (OLMo), NLP, and AI for the common good; tight UW collaboration.', phd: 'Predoctoral young-investigator program, research engineer/scientist roles, internships.', notable: 'OLMo, Semantic Scholar, the Mosaic + Aristo teams.', website: 'https://allenai.org/careers', notes: 'Excellent for open-science-minded researchers.' },
    { name: 'NVIDIA Research', location: 'Santa Clara, CA & worldwide', country: 'US', region: 'United States', type: 'Industry',
      focus: 'Generative AI, graphics, robotics, and ML systems / GPU-scale training and inference.', phd: 'Research scientist roles + a large PhD internship program.', notable: 'The graphics + robotics + LLM systems groups.', website: 'https://www.nvidia.com/en-us/research/', notes: 'Best-in-class for ML systems and hardware-aware research.' },
    { name: 'xAI', location: 'Bay Area & Memphis, USA', country: 'US', region: 'United States', type: 'Industry',
      focus: 'Frontier models (Grok), large-scale training infrastructure, and reasoning.', phd: 'Research + engineering roles; fast-moving.', notable: 'The Grok models, Colossus training cluster.', website: 'https://x.ai/careers', notes: 'International candidates welcomed for many roles.' },

    // ===== Canada =====
    { name: 'University of Toronto & Vector Institute', location: 'Toronto, Canada', country: 'CA', region: 'Canada', type: 'University',
      focus: 'The birthplace of much of modern deep learning — generative models, ML theory, vision, and AI for health, with the Vector Institute as an industry-academic hub.',
      phd: 'PhD via the CS department; many students affiliate with Vector for funding and community. Strong funding and more accessible immigration/visa pathways than the US.',
      notable: 'Geoffrey Hinton lineage, Vector Institute, David Duvenaud, Roger Grosse.', website: 'https://web.cs.toronto.edu/graduate', notes: 'December deadline. A top choice for North-American PhDs with friendlier visa paths.' },
    { name: 'Mila — Université de Montréal & McGill', location: 'Montréal, Canada', country: 'CA', region: 'Canada', type: 'Institute',
      focus: 'One of the world\'s largest academic deep-learning institutes — representation learning, generative models, RL, and AI for social good.',
      phd: 'PhD through Université de Montréal or McGill, affiliated with Mila; large, vibrant, well-funded community.', notable: 'Yoshua Bengio, Aaron Courville, the Mila community.', website: 'https://mila.quebec/en/prospective-students', notes: 'Apply to the host university and indicate Mila advisors. Excellent for deep learning.' },
    { name: 'University of Alberta & Amii', location: 'Edmonton, Canada', country: 'CA', region: 'Canada', type: 'University',
      focus: 'The world capital of reinforcement learning, plus ML and AI for games, anchored by the Alberta Machine Intelligence Institute (Amii).',
      phd: 'PhD in Computing Science affiliated with Amii; fully funded.', notable: 'Richard Sutton, Michael Bowling, the RAIL/RLAI labs.', website: 'https://www.amii.ca/', notes: 'The destination for serious RL research.' },
    { name: 'University of British Columbia & Mila-adjacent', location: 'Vancouver, Canada', country: 'CA', region: 'Canada', type: 'University',
      focus: 'ML, vision, NLP, and AI for sustainability, in a strong public research university.', phd: 'PhD in CS, funded; good international support.', notable: 'The ML + vision groups.', website: 'https://www.cs.ubc.ca/students/grad', notes: 'December deadline.' },

    // ===== United Kingdom =====
    { name: 'University of Oxford — CS & OATML', location: 'Oxford, UK', country: 'UK', region: 'United Kingdom', type: 'University',
      focus: 'AI safety, multi-agent systems, probabilistic ML, and foundation models; strong DeepMind ties.', phd: 'DPhil in Computer Science; funded studentships are competitive. UK PhDs are shorter (3–4 yrs) and advisor-matched.', notable: 'OATML (Yarin Gal), the AI safety + multi-agent groups, FHI lineage.', website: 'https://www.cs.ox.ac.uk/admissions/graduate/', notes: 'Strong for safety + Bayesian ML.' },
    { name: 'University of Cambridge — CST & CBL', location: 'Cambridge, UK', country: 'UK', region: 'United Kingdom', type: 'University',
      focus: 'Machine learning (the Computational and Biological Learning Lab), Bayesian methods, NLP, and AI for science.', phd: 'PhD via the Department of Computer Science & Technology or Engineering (CBL); advisor-matched.', notable: 'CBL (Zoubin Ghahramani lineage), the ML group, José Miguel Hernández-Lobato.', website: 'https://www.cst.cam.ac.uk/admissions/phd', notes: 'Premier for Bayesian/probabilistic ML.' },
    { name: 'Imperial College London — Computing', location: 'London, UK', country: 'UK', region: 'United Kingdom', type: 'University',
      focus: 'ML, robotics, computer vision, and AI for healthcare in central London.', phd: 'PhD in Computing; funded studentships; strong industry links.', notable: 'The Dyson Robotics Lab, BioMedIA.', website: 'https://www.imperial.ac.uk/computing/prospective-students/pg/', notes: 'Robotics + medical AI strength.' },
    { name: 'University of Edinburgh — ILCC & ANC', location: 'Edinburgh, UK', country: 'UK', region: 'United Kingdom', type: 'University',
      focus: 'One of Europe\'s great NLP centres (ILCC), plus ML, robotics, and computational neuroscience.', phd: 'PhD via the School of Informatics; large AI community, funded.', notable: 'ILCC (NLP), the Institute for Adaptive & Neural Computation, Mirella Lapata.', website: 'https://web.inf.ed.ac.uk/postgraduate', notes: 'Top European NLP destination.' },
    { name: 'UCL — Centre for AI & Google DeepMind', location: 'London, UK', country: 'UK', region: 'United Kingdom', type: 'University',
      focus: 'Deep learning, RL, and AI theory, with a famously close DeepMind relationship and the UCL Centre for AI.', phd: 'PhD via the UCL Centre for Artificial Intelligence; many DeepMind-affiliated supervisors.', notable: 'Google DeepMind (HQ in London), the UCL AI Centre.', website: 'https://www.ucl.ac.uk/ai-centre/', notes: 'Direct line into DeepMind.' },

    // ===== Europe (ex-UK) =====
    { name: 'ETH Zürich — AI Center', location: 'Zürich, Switzerland', country: 'CH', region: 'Europe (ex-UK)', type: 'University',
      focus: 'Reliable and trustworthy ML, robotics, vision, and ML systems at Europe\'s top technical university.', phd: 'PhD is hire-then-enroll — you apply to a professor/group for a funded position; salaried PhDs (a major draw).', notable: 'The ETH AI Center, Andreas Krause, the Robotic Systems Lab.', website: 'https://ai.ethz.ch/', notes: 'Salaried PhD positions; apply to specific groups.' },
    { name: 'EPFL — School of Computer & Communication Sciences', location: 'Lausanne, Switzerland', country: 'CH', region: 'Europe (ex-UK)', type: 'University',
      focus: 'ML, vision, NLP, robotics, and ML theory in a highly international environment.', phd: 'Doctoral school admission (EDIC) then group match; salaried PhDs.', notable: 'The IVRL, NLP, and theory groups.', website: 'https://www.epfl.ch/education/phd/edic-computer-and-communication-sciences/', notes: 'Apply to the EDIC doctoral program.' },
    { name: 'Max Planck Institutes (IS / Informatics / Intelligent Systems)', location: 'Tübingen, Saarbrücken & Stuttgart, Germany', country: 'DE', region: 'Europe (ex-UK)', type: 'Institute',
      focus: 'World-class ML theory, robotics, vision, and the science of intelligence, across several Max Planck institutes.', phd: 'Funded positions via the institutes and partner doctoral schools (e.g., IMPRS-IS, ELLIS); apply to groups.', notable: 'MPI-IS, Bernhard Schölkopf, the empirical-inference + perceiving-systems groups.', website: 'https://imprs.is.mpg.de/', notes: 'A premier European ML research home.' },
    { name: 'University of Tübingen & ELLIS', location: 'Tübingen, Germany', country: 'DE', region: 'Europe (ex-UK)', type: 'University',
      focus: 'A leading European ML hub (the "Cyber Valley") — ML theory, vision, and robustness; a flagship ELLIS node.', phd: 'PhD positions via the Tübingen AI Center and the ELLIS PhD program (co-supervised across Europe).', notable: 'Cyber Valley, the Tübingen AI Center, ELLIS.', website: 'https://ellis.eu/phd-postdoc', notes: 'The ELLIS PhD program offers cross-European co-supervision.' },
    { name: 'Technical University of Munich (TUM)', location: 'Munich, Germany', country: 'DE', region: 'Europe (ex-UK)', type: 'University',
      focus: 'ML, computer vision, robotics, and AI for medicine/engineering at a top German technical university.', phd: 'Hire-then-enroll funded positions via chairs/groups.', notable: 'The Computer Vision Group, Munich Center for ML (MCML), Daniel Cremers.', website: 'https://www.cit.tum.de/en/cit/studies/doctorate/', notes: 'Apply to specific chairs.' },
    { name: 'INRIA & PSL/ENS', location: 'Paris, Grenoble & nationwide, France', country: 'FR', region: 'Europe (ex-UK)', type: 'Institute',
      focus: 'ML, vision, NLP, and optimization across France\'s national research institute and the Paris ML ecosystem.', phd: 'Funded PhD positions via INRIA teams and partner universities (PSL/ENS, Sorbonne).', notable: 'INRIA WILLOW/SIERRA, Francis Bach, Jean Ponce; the broader Paris ML scene.', website: 'https://www.inria.fr/en/phd-thesis', notes: 'Apply to specific teams; salaried.' },
    { name: 'University of Amsterdam — AMLab / ELLIS', location: 'Amsterdam, Netherlands', country: 'NL', region: 'Europe (ex-UK)', type: 'University',
      focus: 'Deep learning, generative models, geometric/equivariant ML, and probabilistic methods.', phd: 'Funded PhD positions via AMLab and QUVA; ELLIS node.', notable: 'AMLab, Max Welling lineage, the geometric-DL group.', website: 'https://amlab.science.uva.nl/', notes: 'Strong for principled deep learning.' },
    { name: 'Mistral AI', location: 'Paris, France', country: 'FR', region: 'Europe (ex-UK)', type: 'Industry',
      focus: 'Open-weight and frontier European LLMs, efficient training/inference, and agents.', phd: 'Research + engineering roles; a leading European frontier lab.', notable: 'The Mistral / Mixtral models.', website: 'https://mistral.ai/careers/', notes: 'Europe\'s flagship LLM startup.' },

    // ===== Israel & Middle East =====
    { name: 'Technion — Israel Institute of Technology', location: 'Haifa, Israel', country: 'IL', region: 'Israel & Middle East', type: 'University',
      focus: 'ML theory, vision, NLP, and optimization at Israel\'s top technical university.', phd: 'PhD via CS/EE; funded; strong industry pipeline.', notable: 'Shai Shalev-Shwartz, the ML + vision groups.', website: 'https://cs.technion.ac.il/en/graduate-studies/', notes: 'Elite for ML theory.' },
    { name: 'Tel Aviv University', location: 'Tel Aviv, Israel', country: 'IL', region: 'Israel & Middle East', type: 'University',
      focus: 'Deep learning, generative models, vision, and NLP, with a vibrant startup ecosystem alongside.', phd: 'PhD via the Blavatnik School of CS; funded.', notable: 'Lior Wolf, Amir Globerson, the DL group.', website: 'https://en-exact-sciences.tau.ac.il/computer', notes: 'Strong generative-models work.' },
    { name: 'Hebrew University of Jerusalem', location: 'Jerusalem, Israel', country: 'IL', region: 'Israel & Middle East', type: 'University',
      focus: 'ML theory, NLP, and computational learning at a historic research university.', phd: 'PhD via the School of CS & Engineering; funded.', notable: 'Amnon Shashua, the NLP + learning-theory groups.', website: 'https://www.cse.huji.ac.il/', notes: 'Deep learning-theory tradition.' },
    { name: 'Weizmann Institute of Science', location: 'Rehovot, Israel', country: 'IL', region: 'Israel & Middle East', type: 'Institute',
      focus: 'Fundamental ML, vision, and theory at a pure-research graduate institute.', phd: 'Fully-funded research-only PhD/MSc; very selective.', notable: 'The Faculty of Mathematics & CS, vision + theory groups.', website: 'https://www.weizmann.ac.il/feinberg/', notes: 'Research-only; generous stipends.' },
    { name: 'MBZUAI', location: 'Abu Dhabi, UAE', country: 'AE', region: 'Israel & Middle East', type: 'University',
      focus: 'A graduate research university dedicated entirely to AI — ML, NLP, CV, and robotics — with heavy funding.', phd: 'Fully-funded MSc/PhD specifically in AI; recruits internationally with generous stipends + relocation.', notable: 'Mohamed bin Zayed University of AI; international faculty.', website: 'https://mbzuai.ac.ae/study/', notes: 'Very international-friendly; strong funding + visa support.' },

    // ===== China (mainland) =====
    { name: 'Tsinghua University — IIIS & CS / AIR', location: 'Beijing, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'Foundation models, multimodal AI, reasoning, robotics, and AI safety. The Institute for Interdisciplinary Information Sciences (IIIS) and the Institute for AI Industry Research (AIR) are flagships.',
      phd: 'Highly competitive PhD via IIIS or the Department of CS; funded. Growing English-taught options and international cohorts.', notable: 'IIIS (Andrew Yao), AIR, Jun Zhu, the NLP + KEG lab (GLM models).', website: 'https://www.tsinghua.edu.cn/en/', notes: 'The top Chinese AI program; visa-friendly for top talent.' },
    { name: 'Peking University — School of CS / Institute for AI', location: 'Beijing, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'ML theory, computer vision, NLP, multimodal, and trustworthy AI.', phd: 'PhD via the School of CS or the Institute for AI; growing international intake.', notable: 'The Institute for AI, the vision + NLP groups.', website: 'https://english.pku.edu.cn/', notes: 'Excellent for both theory and applied AI.' },
    { name: 'Shanghai Jiao Tong University — AI Institute', location: 'Shanghai, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'Embodied AI, multi-agent systems, large models, and medical AI.', phd: 'Active PhD recruitment with English-taught options and international faculty; funded.', notable: 'The AI Institute, the APEX/embodied-AI labs.', website: 'https://en.sjtu.edu.cn/', notes: 'Strong industry ties (Alibaba, etc.).' },
    { name: 'Zhejiang University — College of CS / AI', location: 'Hangzhou, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'Embodied AI, robotics, computer vision, and knowledge graphs.', phd: 'Large PhD intake with strong industry links (close to Alibaba/Hangzhou ecosystem).', notable: 'The CAD&CG State Key Lab, the AI college.', website: 'https://www.zju.edu.cn/english/', notes: 'Excellent for robotics + vision.' },
    { name: 'University of Science & Technology of China (USTC)', location: 'Hefei, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'Foundation models, computer vision, speech, and quantum-adjacent AI.', phd: 'Strong, well-funded PhD; rising fast in vision + theory.', notable: 'The National lab affiliations; iFLYTEK speech ties.', website: 'https://en.ustc.edu.cn/', notes: 'Elite for vision/speech.' },
    { name: 'Fudan University — School of CS / AI', location: 'Shanghai, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'NLP, multimodal learning, and AI for healthcare.', phd: 'PhD via CS or AI institutes.', notable: 'The NLP group (MOSS models), Xipeng Qiu.', website: 'https://www.fudan.edu.cn/en/', notes: 'Top for NLP / open Chinese LLMs.' },
    { name: 'Nanjing University — School of AI / LAMDA', location: 'Nanjing, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'Machine learning theory, ensemble methods, and AutoML, anchored by the renowned LAMDA group.', phd: 'PhD via the School of Artificial Intelligence; funded.', notable: 'LAMDA, Zhi-Hua Zhou.', website: 'https://ai.nju.edu.cn/', notes: 'A premier ML-theory group in China.' },
    { name: 'Renmin University — Gaoling School of AI', location: 'Beijing, China', country: 'CN', region: 'China (mainland)', type: 'University',
      focus: 'Large language models, information retrieval, and recommendation.', phd: 'PhD via the Gaoling School of AI (GSAI); funded.', notable: 'GSAI, the IR + LLM groups.', website: 'https://ai.ruc.edu.cn/english/', notes: 'Strong on LLMs + IR.' },
    { name: 'Shanghai AI Laboratory', location: 'Shanghai, China', country: 'CN', region: 'China (mainland)', type: 'Institute',
      focus: 'A major national AI research institute — foundation models (InternLM), multimodal, embodied AI, and AI for science.', phd: 'Joint PhD programs with top universities + research internships; funded.', notable: 'InternLM, the OpenGVLab + OpenMMLab efforts.', website: 'https://www.shlab.org.cn/', notes: 'Open-source-heavy; strong joint-PhD pipeline.' },
    { name: 'BAAI — Beijing Academy of AI', location: 'Beijing, China', country: 'CN', region: 'China (mainland)', type: 'Institute',
      focus: 'Foundation models (the Wu Dao / Aquila lineage), embodied AI, and FlagOpen open infrastructure.', phd: 'Research roles + joint programs and internships with Beijing universities.', notable: 'FlagOpen, the Wu Dao models.', website: 'https://www.baai.ac.cn/english.html', notes: 'A hub of Chinese open-model work.' },
    { name: 'DeepSeek (深度求索)', location: 'Hangzhou / Beijing, China', country: 'CN', region: 'China (mainland)', type: 'Industry',
      focus: 'Frontier open-weight foundation models (DeepSeek V-series), long-context reasoning, efficient training, and agentic systems.', phd: 'Not a degree program, but hires research engineers/scientists and runs internships; partners with Tsinghua/PKU.', notable: 'The DeepSeek V3/V4 + R-series models.', website: 'https://www.deepseek.com/', notes: 'One of the fastest-moving labs globally. International applicants often need a work visa; the lab supports the process for strong candidates.' },
    { name: 'Alibaba DAMO Academy & Qwen', location: 'Hangzhou, China', country: 'CN', region: 'China (mainland)', type: 'Industry',
      focus: 'The Qwen open-weight LLM family, multimodal models, and AI for industry.', phd: 'Research roles, internships, and the Alibaba research fellowship.', notable: 'The Qwen models, DAMO Academy.', website: 'https://damo.alibaba.com/', notes: 'Qwen is among the strongest open model families.' },
    { name: 'ByteDance Seed & Tencent AI Lab', location: 'Beijing / Shenzhen, China', country: 'CN', region: 'China (mainland)', type: 'Industry',
      focus: 'Foundation models, multimodal generation, recommendation, and agents at massive scale.', phd: 'Research roles, internships, and scholarship programs.', notable: 'ByteDance Seed (Doubao), Tencent Hunyuan + AI Lab.', website: 'https://seed.bytedance.com/en/', notes: 'Vast scale + compute.' },

    // ===== Hong Kong =====
    { name: 'HKUST — CSE & AI', location: 'Hong Kong', country: 'HK', region: 'Hong Kong', type: 'University',
      focus: 'Computer vision, NLP, ML systems, trustworthy ML, and agents — one of Asia\'s best for AI.', phd: 'World-class, well-funded PhD with the competitive Hong Kong PhD Fellowship Scheme; very international.', notable: 'The CSE department, the AI + vision groups.', website: 'https://www.cse.ust.hk/pg/admissions/', notes: 'Attractive HK post-study work visa; strong funding.' },
    { name: 'CUHK — CSE & MMLab', location: 'Hong Kong', country: 'HK', region: 'Hong Kong', type: 'University',
      focus: 'Computer vision, multimodal learning, robotics, and AI for science — home to the influential MMLab.', phd: 'PhD via CSE or IE; Hong Kong PhD Fellowship eligible; funded.', notable: 'MMLab (Dahua Lin, Xiaoou Tang lineage), the vision groups.', website: 'https://www.cse.cuhk.edu.hk/admission/', notes: 'MMLab is a vision powerhouse.' },
    { name: 'HKU — Department of CS', location: 'Hong Kong', country: 'HK', region: 'Hong Kong', type: 'University',
      focus: 'Foundation models, data-centric AI, AI ethics, and healthcare AI; rising fast.', phd: 'Growing, well-funded PhD with increasing international intake.', notable: 'The CS department, the HKU-NLP group.', website: 'https://www.cs.hku.hk/programmes/research-postgraduate', notes: 'Strong interdisciplinary options.' },
    { name: 'City University of Hong Kong & PolyU', location: 'Hong Kong', country: 'HK', region: 'Hong Kong', type: 'University',
      focus: 'ML, vision, NLP, and AI applications, with active international recruiting.', phd: 'Funded PhDs (Fellowship eligible) across CityU and PolyU CS departments.', notable: 'The CityU + PolyU AI groups.', website: 'https://www.cityu.edu.hk/pg/', notes: 'Good funding + visa support.' },

    // ===== Asia (ex-China/HK) =====
    { name: 'KAIST', location: 'Daejeon, South Korea', country: 'KR', region: 'Asia (ex-China/HK)', type: 'University',
      focus: 'Deep learning, vision, NLP, and ML theory at Korea\'s leading science/tech institute.', phd: 'Funded MS/PhD via the Kim Jaechul Graduate School of AI and the School of Computing; English-taught.', notable: 'The Graduate School of AI, strong generative-models work.', website: 'https://gsai.kaist.ac.kr/?lang=en', notes: 'A dedicated AI graduate school; international-friendly.' },
    { name: 'Seoul National University (SNU)', location: 'Seoul, South Korea', country: 'KR', region: 'Asia (ex-China/HK)', type: 'University',
      focus: 'ML, vision, NLP, and robotics at Korea\'s top university.', phd: 'Funded PhD via CSE / the interdisciplinary AI program.', notable: 'The SNU AI Institute, vision + NLP groups.', website: 'https://cse.snu.ac.kr/en', notes: 'Strong and well-resourced.' },
    { name: 'National University of Singapore (NUS)', location: 'Singapore', country: 'SG', region: 'Asia (ex-China/HK)', type: 'University',
      focus: 'Foundation models, vision, ML systems, trustworthy AI, and AI for science — Asia\'s top-ranked CS school.', phd: 'Generously-funded PhD (incl. the AI Singapore programme); highly international.', notable: 'NUS CS, the NExT++ + NLP groups, AI Singapore.', website: 'https://www.comp.nus.edu.sg/programmes/pg/phd/', notes: 'Excellent funding + visa for international students.' },
    { name: 'Nanyang Technological University (NTU)', location: 'Singapore', country: 'SG', region: 'Asia (ex-China/HK)', type: 'University',
      focus: 'ML, computer vision, multimodal, and AI systems; home to influential vision labs.', phd: 'Funded PhD via SCSE; international-friendly.', notable: 'S-Lab, MMLab@NTU, the vision groups.', website: 'https://www.ntu.edu.sg/scse/admissions/graduate', notes: 'Strong vision + generative work.' },
    { name: 'University of Tokyo', location: 'Tokyo, Japan', country: 'JP', region: 'Asia (ex-China/HK)', type: 'University',
      focus: 'ML, vision, NLP, and robotics at Japan\'s flagship university.', phd: 'Funded PhD via the Graduate School of Information Science & Technology; some English-taught tracks.', notable: 'The Matsuo Lab (deep learning), IST.', website: 'https://www.i.u-tokyo.ac.jp/index_e.shtml', notes: 'Matsuo Lab is a deep-learning hub.' },
    { name: 'RIKEN Center for AIP', location: 'Tokyo, Japan', country: 'JP', region: 'Asia (ex-China/HK)', type: 'Institute',
      focus: 'ML theory, optimization, and AI for science at Japan\'s national research institute.', phd: 'Research positions + joint PhD programs with partner universities.', notable: 'RIKEN AIP, Masashi Sugiyama.', website: 'https://aip.riken.jp/?lang=en', notes: 'Strong ML-theory bench.' },
    { name: 'IISc Bangalore & the IITs', location: 'Bangalore / Delhi / Bombay / Madras, India', country: 'IN', region: 'Asia (ex-China/HK)', type: 'University',
      focus: 'ML, vision, NLP, and systems across India\'s premier technical institutes.', phd: 'Funded PhDs via IISc and the IITs; large, strong CS departments.', notable: 'IISc CSA/CDS, IIT Bombay/Delhi/Madras CS.', website: 'https://www.iisc.ac.in/admissions/', notes: 'Excellent, fast-growing AI research.' },
    { name: 'KAUST', location: 'Thuwal, Saudi Arabia', country: 'SA', region: 'Asia (ex-China/HK)', type: 'University',
      focus: 'ML, vision, optimization, and AI for science, with heavy funding and a global faculty.', phd: 'Fully-funded MS/PhD with generous stipends, housing, and relocation; recruits internationally.', notable: 'The Visual Computing Center, the AI initiative.', website: 'https://www.kaust.edu.sa/en/study', notes: 'Very generous funding + visa/relocation support.' },

    // ===== Australia =====
    { name: 'Australian National University (ANU)', location: 'Canberra, Australia', country: 'AU', region: 'Australia', type: 'University',
      focus: 'ML, computer vision, and AI for science, with a strong theory + vision tradition.', phd: 'Funded PhD via the School of Computing; research scholarships for international students.', notable: 'The vision + ML groups, Stephen Gould.', website: 'https://cs.anu.edu.au/study/research-degrees', notes: 'Strong vision research.' },
    { name: 'University of Melbourne & University of Sydney', location: 'Melbourne / Sydney, Australia', country: 'AU', region: 'Australia', type: 'University',
      focus: 'ML, NLP, vision, and trustworthy AI at two of Australia\'s leading research universities.', phd: 'Funded PhDs with research scholarships; good international support.', notable: 'The NLP + ML groups; the Sydney AI Centre.', website: 'https://www.unimelb.edu.au/study/research', notes: 'Good for applied + interdisciplinary AI.' },
    { name: 'UNSW & Monash', location: 'Sydney / Melbourne, Australia', country: 'AU', region: 'Australia', type: 'University',
      focus: 'ML, vision, NLP, and AI systems with strong, growing AI groups.', phd: 'Funded PhDs with international scholarships.', notable: 'The UNSW AI group; Monash Data Science & AI.', website: 'https://www.unsw.edu.au/research/hdr', notes: 'Solid options with scholarship funding.' },
  ];

  ngOnInit() {
    this.unsub = this.fs.listenPhds((list) => this.phds.set(list.length ? list : SEED_PHDS));
  }
  ngOnDestroy() { this.unsub?.(); }

  // ── Directory filtering / sorting / grouping ────────────────────────────────
  // These are plain methods (not computed signals) because the filter state lives
  // in ngModel plain fields; methods re-run every change-detection pass so the
  // directory stays reactive to typing and select changes.
  private filteredLabs(): AiLab[] {
    const s = this.search.toLowerCase().trim();
    const rf = this.regionFilter;
    const tf = this.typeFilter;
    return this.allLabs.filter((lab) => {
      const hay = (lab.name + ' ' + lab.location + ' ' + lab.focus + ' ' + lab.notable + ' ' + lab.notes).toLowerCase();
      if (s && !hay.includes(s)) return false;
      if (rf && lab.region !== rf) return false;
      if (tf && lab.type !== tf) return false;
      return true;
    });
  }

  visibleCount(): number { return this.filteredLabs().length; }

  groupedLabs(): { region: string; labs: AiLab[] }[] {
    const labs = this.filteredLabs();
    if (this.labSort === 'name') {
      return [{ region: 'All (A–Z)', labs: [...labs].sort((a, b) => a.name.localeCompare(b.name)) }];
    }
    if (this.labSort === 'type') {
      const order: AiLab['type'][] = ['University', 'Institute', 'Industry'];
      const label: Record<AiLab['type'], string> = { University: 'University programs', Industry: 'Industry labs', Institute: 'Institutes' };
      return order
        .map((t) => ({ region: label[t], labs: labs.filter((l) => l.type === t).sort((a, b) => a.name.localeCompare(b.name)) }))
        .filter((g) => g.labs.length);
    }
    // Sort by location → group by region in canonical order
    return REGION_ORDER
      .map((region) => ({ region, labs: labs.filter((l) => l.region === region).sort((a, b) => a.location.localeCompare(b.location)) }))
      .filter((g) => g.labs.length);
  }

  isExpanded(name: string) { return this.expanded().has(name); }
  toggle(name: string) {
    const next = new Set(this.expanded());
    next.has(name) ? next.delete(name) : next.add(name);
    this.expanded.set(next);
  }
  expandAll() { this.expanded.set(new Set(this.filteredLabs().map((l) => l.name))); }
  collapseAll() { this.expanded.set(new Set()); }

  clearFilters() {
    this.search = '';
    this.regionFilter = '';
    this.typeFilter = '';
  }

  // ── Live status table ───────────────────────────────────────────────────────
  sortedPhds = computed(() => {
    const list = [...this.phds()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    list.sort((a, b) => {
      const va = String((a as any)[col] ?? (col === 'deadline' ? 'zzz' : '')).toLowerCase();
      const vb = String((b as any)[col] ?? (col === 'deadline' ? 'zzz' : '')).toLowerCase();
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  });

  isOpen(p: PhdProgram): boolean {
    const st = (p.status || '').toLowerCase();
    return st.includes('open') || st.includes('rolling');
  }
  setSort(col: 'country' | 'uni' | 'program' | 'status' | 'deadline') {
    if (this.sortColumn() === col) this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    else { this.sortColumn.set(col); this.sortDirection.set('asc'); }
  }

  async refreshPhds() {
    if (!this.auth.isAdmin()) return;
    try {
      await this.fs.triggerPhdScan();
      alert('PhD scan triggered. Live status will stream in via Firestore listeners.');
    } catch (e: any) {
      alert('Trigger failed: ' + (e?.message || e));
    }
  }
}
