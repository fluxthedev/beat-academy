# BeatAcademy — NoteForge
BeatAcademy is a browser-based MIDI practice platform for piano and percussion controllers. The architectural philosophy is "Performance as a Feature," using WebAssembly (WASM), AudioWorklets, and SharedArrayBuffers to deliver a sub-15ms latency experience that rivals native desktop software. The system adheres to General MIDI (GM) standards while supporting proprietary conventions from Akai, Roland, and Korg.

## 🚀 Getting Started

Prerequisites: Node.js 18+, Chrome or Edge (recommended for full Web MIDI support).

```bash
git clone https://github.com/your-org/beatacademy.git
cd beatacademy
npm install
npm run dev
```

The app requires a Cross-Origin Isolated environment to enable SharedArrayBuffer. Your server must include the following headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## 🌐 Browser Support

| Browser | Web MIDI Support | Status |
|:---|:---|:---|
| Chrome / Edge | Native | Fully supported |
| Firefox | Extension required | Partial support |
| Safari | Not supported | Not recommended |

## 📐 Features

The feature set is designed to bridge the gap between casual gamified learning and professional technical drills. Each component operates within a strict temporal budget, ensuring the feedback loop between a user striking a key and seeing/hearing the result stays below the threshold of human perception.

### MIDI Input Engine and Device Intelligence

The MIDI Input Engine handles asynchronous event streams from multiple hardware sources simultaneously via the Web MIDI API.

| Component | Description | Technical Requirement |
|:---|:---|:---|
| Web MIDI API Layer | Enumeration and selection of hardware ports. | Persistent device access requests and hot-plugging support. |
| Real-Time Message Parser | De-serialization of 3-byte status/data packets (Note On, Note Off, CC, Pitch Bend). | Handling of "Running Status" and timestamping using high-resolution performance clocks. |
| Velocity Mapping | Conversion of 0-127 values into gain-scaled curves for realistic sound bank triggering. | Support for custom velocity curves (linear, exponential, log). |
| Jitter Correction | Smoothing of input timestamps to prevent visual "micro-stutter." | Monotonic timing logic to prevent out-of-order event dispatching. |

### Device Type Detection 
This identifies whether the user has connected a piano or drum controller without manual configuration. The engine monitors MIDI Channel 10 (the GM percussion standard), analyzes the note range of incoming traffic (piano: notes 21–108, drums: notes 35–81), and parses the manufacturer string from the browser. Device names containing "MPD," "SPD," "Maschine," "Strike," or "Alesis" automatically default to drum mode.

### Sound Engine and Low-Latency Playback

The Sound Engine runs synthesis and sample playback in a dedicated AudioWorklet thread, isolated from the UI to prevent audio glitches during animations.

 * Piano Sound Banks: High-fidelity, multi-velocity sample sets for Grand Piano, Electric Piano, and Synth Leads. Samples are pre-buffered and transferred to the AudioWorklet via SharedArrayBuffers to eliminate memory allocation overhead during playback.
 * Drum Kit Packs: Acoustic Studio, Electronic (TR-style), and Orchestral kits, mapped to the GM Percussion Map for compatibility with all standard controllers.
 * WASM Synthesis: A WebAssembly-based synthesis engine for synth-based sounds that avoids JavaScript garbage collection pauses — the primary cause of audio crackling.
 * Polyphony Management: A voice allocator supporting up to 128 simultaneous notes with intelligent note-stealing (releasing the oldest or quietest voice first).

### Latency and Calibration System

| Latency Type | Origin | Mitigation Strategy |
|:---|:---|:---|
| MIDI Input Lag | USB bus polling and OS-level drivers. | Sub-ms timestamping and high-priority event handling. |
| Audio Output Lag | Browser buffer size and OS audio engine. | Use of `audioContext.outputLatency` and WASAPI/ASIO-level driver optimization recommendations. |
| Display Lag | VSync, monitor refresh rates, and compositor delays. | Visual offset calibration using a "Tap to Rhythm" wizard. |

The Advanced Calibration Wizard supports a manual tap test (strike a key in sync with a visual metronome to calculate the delta) and an automated acoustic loopback test (the app plays noise bursts and uses the microphone to measure true round-trip latency). Per-device profiles allow unique settings to be saved for different hardware setups.

### Practice Modes and Visual Display

The Visual Display is powered by a high-performance PixiJS rendering loop synchronized to the audio clock.

 * Free Play: A sandbox for exploration with real-time feedback and sound-bank switching.
 * Song Follow-Along: A Synthesia-style vertical timeline of falling notes. "Wait for Note" logic pauses playback until the correct MIDI input is received.
 * Rhythm Trainer: A drum-specific horizontal grid mode measuring quantization accuracy.
 * Finger Exercise Drills: Procedurally generated patterns for scales, chords, and rudiments.
 * Sight Reading: Standard musical notation rendering with real-time MIDI accuracy highlighting.

The visual interface includes a real-time hit detection system. Correct notes trigger particle effects and highlight animations. Ghost notes (notes played that weren't in the song) are flagged as errors.

### Progress Tracking and Library Management

 * XP and Leveling: Experience points earned per correct note, with bonuses for timing accuracy and streaks.
 * Skill Levels: Tiered progression from Novice to Virtuoso.
 * Song Library: Standard MIDI File (SMF) import support alongside a built-in library of licensed tracks and exercises.
 * Custom Pattern Creator: Record loops and convert them into practice exercises.

## 🧱 Tech Stack

| Layer | Choice | Justification |
|:---|:---|:---|
| Frontend Framework | SvelteKit | No virtual DOM — lower CPU overhead when sharing with the audio engine. |
| Audio Processing | Web Audio (AudioWorklet) + WASM | Dedicated threads and C++-level performance; avoids JS garbage collection pauses. |
| Visual Rendering | PixiJS (WebGPU/WebGL) | Hardware-accelerated 2D rendering for high sprite counts (falling notes). |
| MIDI Handling | Web MIDI API | The only native browser solution for hardware communication. |
| State Management | Svelte Stores + Atomics | Stores for UI state; Atomics for thread-safe sync between Main thread and AudioWorklets. |
| Animation Engine | GSAP | Smooth UI transitions and pedagogical overlays. |
| Backend / Database | Supabase (PostgreSQL + Realtime) | User profiles, real-time leaderboards, and MIDI file storage. |

## ⚡ Performance Architecture

NoteForge uses a "Zero-Grip" philosophy — no blocking operations anywhere in the data path. Target: sub-15ms perceived latency from physical action to auditory response.

### The Audio Pipeline

```
Physical Key Strike (USB Interrupt)
    → Web MIDI Callback (Main Thread) — high-resolution timestamp attached
    → SharedArrayBuffer Circular Queue (lock-free write, avoids postMessage delays)
    → AudioWorkletProcessor (high-priority audio thread, polls every 128 samples)
    → WASM Synthesis / PCM Sample Playback from pre-allocated heap
    → OS Audio Engine (WASAPI on Windows / CoreAudio on macOS)
    → Speaker Output
```

 * Asset Priming: All audio samples are fetched, decoded, and mirrored into WASM heap memory at startup. Playing a sound is a memory read-and-sum — no I/O or GC allocations on the critical path.
 * Audio Clock as Master: All visual animations query `audioContext.currentTime` per frame. Note positions are calculated relative to the audio clock with an added calibration offset, preventing any drift between visuals and sound.

## 📊 Project Timeline

9-Month Plan (3-Person Team)

| Milestone | Key Objective | Duration | Est. Completion |
|:---|:---|:---|:---|
| Foundation | Tech spikes, WASM audio engine, MIDI input. | 2 Months | Month 2 |
| Practice MVP | MIDI parsing, scoring logic, basic piano UI. | 2 Months | Month 4 |
| Device Intelligence | Drum engine, auto-detection, sound banks. | 2 Months | Month 6 |
| Visual / UX Polish | PixiJS renderer, animations, progress UI. | 1.5 Months | Month 7.5 |
| Beta & Launch | Gamification, multi-browser testing, optimization. | 1.5 Months | Month 9 |

| Resource Level | Time to MVP | Time to Launch | Key Constraint |
|:---|:---|:---|:---|
| Solo Developer | 6 Months | 18 Months | Limited capacity for high-fidelity assets and cross-browser testing. |
| 3-Person Team | 3 Months | 9 Months | Requires high coordination on SharedArrayBuffer/WASM interfaces. |

🤝 Contributing

Contributions are welcome. Please open an issue before submitting a pull request for major changes. See `CONTRIBUTING.md` for guidelines.

📄 License

GNU Affero General Public License v3 (AGPL-3.0) 
