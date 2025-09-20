import { Album } from "./lib/types"

export const sampleAlbums: Album[] = [
  {
    id: "album_demo_unya",
    name: "UN&YA Showcase",
    createdAt: "2025-01-12T10:00:00.000Z",
    releaseTargetDate: "2025-02-01",
    notes: "Demonstration album seeded for onboarding.",
    songs: [
      {
        id: "song_fragments",
        title: "Fragments of Silence",
        createdAt: "2025-01-12T10:05:00.000Z",
        status: "mastering",
        presetId: "fragments",
        tags: ["industrial", "orchestral", "anthem"],
        lyricBrief: "Merged prompt returned by GPT for the showcase track.",
        briefNotes: "Use this song to explore the full workflow.",
        references: ["Hybrid orchestral swells", "Cyber-brutalist pulse"],
        versions: [
          {
            id: "version_fragments_v1_2_0",
            label: "v1.2.0",
            createdAt: "2025-01-11T18:30:00.000Z",
            status: "release",
            seed: "seed-2417",
            bpm: "128",
            key: "E minor",
            duration: "2:48",
            prompt: `[Genre=Industrial Metal] [Subgenre=Cyber-Brutalist, Slavonic Anthemic]\n[Energy=High] [Tempo=128bpm] [Key=E minor] [TimeSig=4/4]\n[Vocal=Duet(Male deep, Female ethereal)] [Language=English]\n[Structure=Intro–Verse–Pre–Chorus–Chorus–Bridge–Outro]\n[Instrumentation=Drop-tuned guitars, distorted bass, glitched synths, hybrid orchestra, live drums]\n[Hooks=Choir synth doubles chorus melody]\n[MixNotes=warm_low_end, tight_highs, stereo_depth, clear_guitar]\n[Exclude=rap, screamo, trap_hats, vinyl_crackle]`,
            finalPrompt: `[Style]\n[Genre=Industrial Metal] [Subgenre=Cyber-Brutalist, Slavonic Anthemic]\n[Energy=High] [Tempo=128bpm] [Key=E minor] [TimeSig=4/4]\n[Vocal=Duet(Male deep, Female ethereal)] [Language=English]\n[Structure=Intro–Verse–Pre–Chorus–Chorus–Bridge–Outro]\n[Instrumentation=Drop-tuned guitars, distorted bass, glitched synths, hybrid orchestra, live drums]\n[Hooks=Choir synth doubles chorus melody]\n[MixNotes=warm_low_end, tight_highs, stereo_depth, clear_guitar]\n[Exclude=rap, screamo, trap_hats, vinyl_crackle]\n\n[Lyrics]\n[Intro]\nConcrete skies breathe in the dawn\nCold horizon carries on\n\n[Verse]\nMarching steps in echo halls\nSignals bloom through iron walls\n\n[Chorus]\nFragments of silence wake tonight\nSteel hearts are learning how to fight`,
            finalPromptId: "prompt_final",
            finalLyrics: `[Intro]\nConcrete skies breathe in the dawn\nCold horizon carries on\n\n[Verse]\nMarching steps in echo halls\nSignals bloom through iron walls\n\n[Chorus]\nFragments of silence wake tonight\nSteel hearts are learning how to fight`,
            promptHistory: [
              "[Energy=Medium] first draft",
              "[Energy=High] tightened guitars",
              "[Energy=High] final"
            ],
            iterationTimeline: [
              {
                id: "iter_a",
                createdAt: "2025-01-10T12:00:00.000Z",
                promptSummary: "Raised energy and reinforced chorus hook",
                sunoUrl: "https://app.suno.ai/share/fragment-sample",
                seed: "seed-2380",
                notes: "Great structure but softer chorus.",
                enhancements: ["tighten_chorus", "boost_hook"]
              },
              {
                id: "iter_b",
                createdAt: "2025-01-11T18:30:00.000Z",
                promptSummary: "Locked guitars, widened pads",
                sunoUrl: "https://app.suno.ai/share/fragment-final",
                seed: "seed-2417",
                enhancements: ["wider_pads"],
                notes: "Keeper version"
              }
            ],
            takes: [
              {
                id: "take_a",
                label: "Take A",
                shareUrl: "https://app.suno.ai/share/fragment-sample",
                notes: "First iteration",
                selected: false
              },
              {
                id: "take_b",
                label: "Take B",
                shareUrl: "https://app.suno.ai/share/fragment-final",
                notes: "Winning take",
                selected: true
              }
            ],
            releasePlans: [
              {
                id: "release_soundcloud",
                platform: "soundcloud",
                url: "https://soundcloud.com/unya/fragments-of-silence-demo",
                releaseDate: "2025-01-14",
                status: "released",
                notes: "Public demo"
              },
              {
                id: "release_bandcamp",
                platform: "bandcamp",
                releaseDate: "2025-01-20",
                status: "scheduled",
                notes: "Upload stems pack"
              }
            ],
            qaChecks: {
              conflicts: true,
              "bpm-key": true,
              lufs: true,
              sibilance: true,
              mono: true,
              "meta-added": true
            },
            metaTags: [
              "high_fidelity",
              "studio_mix",
              "clean_master",
              "no_artifacts",
              "clear_vocals",
              "warm_low_end",
              "tight_highs",
              "analog_warmth",
              "stereo_depth",
              "crystal_clarity"
            ],
            exclude: "",
            notes: "Seed 2417 carried the best structure; minor EQ tweaks smoothed harshness.",
            lufs: "-11.6",
            truePeak: "-1.1",
            masteringProfile: {
              targetLufs: "-12",
              targetTruePeak: "-1",
              bandlab: {
                preset: "Universal (low)",
                inputGain: "-1.9",
                tape: "45%"
              },
              expose: {
                integrated: "-11.6",
                short: "-11.2",
                truePeak: "-1.1",
                lra: "7.2"
              }
            },
            spectrumNotes: "Slight lift at 3k for vocal clarity; tightened low mids.",
            spectrumSnapshot: "60Hz:-6\n200Hz:-4\n1kHz:-3\n4kHz:-5\n8kHz:-6.5",
            shareUrl: "https://app.suno.ai/share/fragment-final",
            sunoUrl: "https://app.suno.ai/song/sample-fragments",
            soundcloudUrl: "https://soundcloud.com/unya/fragments-of-silence-demo",
            finalReleaseUrl: "https://soundcloud.com/unya/fragments-of-silence-demo"
          }
        ]
      }
    ]
  }
]
