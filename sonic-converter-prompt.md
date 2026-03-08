# SONIC CONVERTER — Build Prompt for Claude Code

## Before you start writing ANY code, I need your raw honest opinion:

I want to build a **custom MP3→WAV converter from scratch in Rust** as a **reusable library (crate)** — not a CLI app, not a wrapper around ffmpeg. A library-first architecture that any Rust project can add as a dependency and use with a few lines of code.

The goal: production-grade, designed to handle **millions of conversions monthly** at extreme speed.

### Give me your honest take on:
1. Is building an MP3 decoder from absolute zero (no minimp3, no external C libs) worth it vs using `minimp3` or `symphonia` (pure Rust)?
2. What's the realistic performance ceiling compared to ffmpeg?
3. What are the hidden landmines (patents, edge cases in MP3 spec, VBR handling)?
4. If you were building this to sell as a SaaS or license it — would you? Is there market demand?
5. What's the smartest architecture for a lib that needs to be embeddable everywhere (WASM, mobile FFI, server-side, CLI)?

Be brutal. Don't sugarcoat it.

---

## After your opinion, build the project with these specs:

### Architecture: Library-First
```
sonic-converter/
├── Cargo.toml
├── src/
│   ├── lib.rs              # Public API — the star of the show
│   ├── decoder/
│   │   ├── mod.rs           # MP3 decoder orchestrator
│   │   ├── frame.rs         # MP3 frame parser (header, side info, main data)
│   │   ├── huffman.rs       # Huffman decoding tables + logic
│   │   ├── requantize.rs    # Inverse quantization + stereo processing
│   │   ├── imdct.rs         # IMDCT transform
│   │   └── synthesis.rs     # Polyphase synthesis filterbank → PCM
│   ├── encoder/
│   │   ├── mod.rs           # WAV encoder
│   │   └── wav.rs           # RIFF/WAV header + PCM writer
│   ├── pipeline/
│   │   ├── mod.rs           # Conversion pipeline orchestrator
│   │   ├── batch.rs         # Parallel batch processing (rayon)
│   │   └── stream.rs        # Streaming/chunked conversion
│   ├── error.rs             # Custom error types (thiserror)
│   └── types.rs             # Shared types (AudioFormat, SampleRate, etc.)
├── examples/
│   ├── simple.rs            # Minimal: 3 lines to convert
│   ├── batch.rs             # Convert entire directory
│   ├── streaming.rs         # Stream conversion with progress callback
│   └── custom_pipeline.rs   # Advanced: custom sample rate, bit depth
├── benches/
│   └── conversion.rs        # Criterion benchmarks
└── tests/
    ├── integration.rs       # End-to-end tests
    └── fixtures/            # Test MP3 files
```

### Public API Design (this is the most important part):

```rust
// === Simple: One-liner conversion ===
sonic::convert("input.mp3", "output.wav")?;

// === Builder pattern for control ===
sonic::Converter::new()
    .sample_rate(44100)
    .bit_depth(BitDepth::F32)
    .channels(Channels::Stereo)
    .on_progress(|p| println!("{}%", p.percent))
    .convert_file("input.mp3", "output.wav")?;

// === In-memory conversion (for servers) ===
let mp3_bytes: &[u8] = &std::fs::read("input.mp3")?;
let wav_bytes: Vec<u8> = sonic::convert_bytes(mp3_bytes)?;

// === Streaming conversion (for large files) ===
let decoder = sonic::StreamDecoder::new(mp3_reader)?;
for chunk in decoder.chunks(4096) {
    wav_writer.write_samples(&chunk?)?;
}

// === Batch conversion (parallel) ===
sonic::batch_convert("./mp3s/", "./wavs/")
    .threads(num_cpus::get())
    .on_file_complete(|f| println!("Done: {}", f.name))
    .run()?;
```

### Core Requirements:
- **ZERO external runtime dependencies** for the core lib (no ffmpeg, no system libs)
- **Pure Rust** preferred — if you use minimp3 (C), make it an optional feature flag, not default
- **Memory-mapped I/O** via `memmap2` for large files
- **Rayon** for batch parallelism
- **#![no_std] compatible core** if possible (for WASM/embedded)
- **Feature flags**: `pure-rust` (default), `minimp3-backend`, `parallel`, `mmap`
- Custom error types with `thiserror`, ergonomic `Result` aliases
- Full documentation with `///` doc comments on every public item
- Benchmarks with `criterion`

### Performance Targets:
- Single file (5min MP3): < 200ms
- Batch (1000 files): near-linear scaling with cores
- Memory: streaming mode should handle 2GB+ files with < 50MB RAM
- Zero allocations in the hot decode loop where possible

### Quality:
- Handle all MP3 variants: MPEG1/2/2.5, Layer III, CBR/VBR/ABR
- Proper ID3v1/v2 tag skipping
- Gapless decoding support
- Correct LAME/Xing header parsing for VBR

### Write the actual implementation, not stubs. I want:
1. Real Huffman tables (at minimum the most common ones)
2. Real IMDCT implementation
3. Real synthesis filterbank
4. Working WAV encoder with proper RIFF headers
5. Integration test that can verify output

Build it. Make it legendary.
