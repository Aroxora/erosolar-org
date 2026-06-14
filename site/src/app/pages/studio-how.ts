import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-studio-how',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ video studio · how it works</p>
        <h2 class="title">How the AI video studio works</h2>
        <p class="sub">A transparent walk-through of the long-form generation pipeline. The deliberate choice: for multi-minute videos, <strong>stitch descriptive AI images</strong> with motion over narration rather than generating video directly — it's far more reliable, controllable, and cheaper at length, and it yields a clean transcript + captions for free.</p>
      </div>

      <ol class="steps">
        <li>
          <h3>1 · Script — DeepSeek-v4-pro</h3>
          <p>A single structured prompt asks DeepSeek for a title, a YouTube description, and 6–9 segments — each with ~40–70 words of spoken narration and a vivid, concrete <em>image prompt</em>. The model is told to be accurate and avoid invented numbers; the script is the single source of truth for everything downstream.</p>
        </li>
        <li>
          <h3>2 · Scenes — xAI Grok image model</h3>
          <p>Each segment's image prompt is rendered by xAI's Grok image model into one cinematic 16:9 still. Images (not clips) are the unit of generation: they're cheap, consistent, and never "hallucinate motion." If a render fails, a branded fallback card keeps the pipeline unblocked.</p>
        </li>
        <li>
          <h3>3 · Narration — TTS</h3>
          <p>Each segment is narrated to an audio file (macOS's built-in <code>say</code> by default — free and offline; swappable for a cloud TTS via one env var). The exact audio duration is measured with <code>ffprobe</code> so the visuals match the voice.</p>
        </li>
        <li>
          <h3>4 · Assembly — ffmpeg (Ken Burns + concat)</h3>
          <p>For each scene, ffmpeg builds a clip: the still image with a slow Ken-Burns zoom, sized to 1080p, exactly as long as its narration. The clips are concatenated into one mp4. A <code>.txt</code> transcript and an <code>.srt</code> caption file are produced alongside — ready to upload to YouTube.</p>
        </li>
        <li>
          <h3>5 · Publish — Firebase Storage + Firestore</h3>
          <p>The mp4 + thumbnail are uploaded to Firebase Storage and a <code>videos/&#123;id&#125;</code> document is written to Firestore. The public <a routerLink="/studio">Studio gallery</a> renders it automatically — no redeploy.</p>
        </li>
      </ol>

      <div class="note">
        <p><strong>Why images, not text-to-video?</strong> Direct text-to-video models drift, are expensive per second, and are hard to keep on-message for minutes at a time. A narrated, motion-stilled image sequence is deterministic, editable scene-by-scene, accurate to the script, and produces broadcast-ready captions — the right trade-off for explainer-length content.</p>
        <p class="small">Runs locally via <code>studio/generate.mjs</code> (Node + ffmpeg). Same owner-controlled, provenance-logged pattern as the rest of ErosolarAI — DeepSeek + xAI on Bo's keys, nothing hidden.</p>
        <p><a class="btn btn-ghost" routerLink="/studio">← Back to the gallery</a></p>
      </div>
    </div>
  `,
  styles: [`
    .steps { list-style:none; margin:0; padding:0; display:grid; gap:.8rem; }
    .steps li { border:1px solid var(--line-soft); border-left:3px solid var(--solar); border-radius:10px; padding:1rem 1.2rem; background:var(--surface); }
    .steps h3 { font-family:var(--display); font-size:1.15rem; margin:0 0 .4rem; }
    .steps p { color:var(--ink-2); margin:0; line-height:1.55; }
    .note { margin-top:1.4rem; max-width:80ch; }
    .note p { color:var(--ink-2); line-height:1.6; }
    .note .small { color:var(--muted); }
  `],
})
export class StudioHow {}
