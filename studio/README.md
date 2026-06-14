# ErosolarAI Video Studio

Long-form video generation that **strings together descriptive AI images** (with
Ken-Burns motion) over TTS narration — far more reliable and cheaper at length than
direct text-to-video.

**Pipeline** (`generate.mjs`, all local on your Mac):
1. **DeepSeek-v4-pro** writes a structured script (title, description, 6–9 segments, each
   with narration + a vivid image prompt).
2. **xAI Grok** generates one cinematic image per segment (falls back to a branded card).
3. **macOS `say`** narrates each segment → mp3 (free/offline; override with `TTS_CMD`).
4. **ffmpeg** builds a Ken-Burns clip per (image+audio) and concatenates them into one
   mp4, plus a `.txt` transcript and `.srt` captions for YouTube.
5. Uploads the mp4 + thumbnail to **Firebase Storage** and writes a Firestore `videos/{id}`
   doc — which the public **/studio** gallery on erosolar.org renders.

## Run
```bash
cd studio
npm install
cp .env.example .env   # fill DEEPSEEK_API_KEY + XAI_API_KEY (reuses ../outreach/service-account.json)
# topic given, or omitted to auto-pick from the latest blog update:
node generate.mjs "How DeepSeek trains frontier models on a budget"
```
Prereqs: `node >= 20`, `ffmpeg` + `ffprobe` (`brew install ffmpeg`), macOS `say` (or `TTS_CMD`).

The transcript (`out/<slug>/transcript.txt`) + captions (`captions.srt`) are ready to
upload alongside the mp4 to YouTube. How it works is documented on the site at `/studio-how`.
