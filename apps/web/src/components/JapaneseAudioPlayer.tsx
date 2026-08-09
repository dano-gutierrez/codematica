"use client";

import { useRef, useState } from "react";
import { japaneseAudioUrls } from "@/generated/japanese-audio";

export function JapaneseAudioPlayer({ audioId, revealTranscript, transcript }: { audioId: string; revealTranscript?: boolean; transcript?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = useState(1);
  const source = (japaneseAudioUrls as Record<string, string>)[audioId];

  if (!source) return <p className="rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-3 text-sm font-semibold text-[#53616c]">Listening audio is awaiting Japanese-language approval.</p>;

  function play(nextSpeed = speed) {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = nextSpeed;
    audioRef.current.currentTime = 0;
    void audioRef.current.play();
  }

  return (
    <div className="grid gap-3 rounded-xl border-2 border-b-4 border-[#9cc7ff] bg-[#f5f9ff] p-4" data-testid="japanese-audio-player">
      <audio ref={audioRef} src={source} preload="metadata" />
      <p className="text-xs font-extrabold uppercase text-[#1d4e9e]">AI-generated voice</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => play()} className="min-h-11 rounded-lg bg-[#245fba] px-4 font-extrabold text-white">Play / replay</button>
        <button type="button" aria-pressed={speed === 0.75} onClick={() => { setSpeed(0.75); play(0.75); }} className="min-h-11 rounded-lg border-2 border-[#245fba] px-4 font-extrabold text-[#1d4e9e]">0.75× slow</button>
      </div>
      {revealTranscript && transcript ? <p lang="ja" className="text-lg font-bold text-[#263238]">{transcript}</p> : null}
    </div>
  );
}
