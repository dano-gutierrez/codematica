"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Turtle } from "lucide-react";
import { Button } from "./Button";
import { japaneseAudioUrls } from "@/generated/japanese-audio";

export function JapaneseAudioPlayer({ audioId, revealTranscript, transcript }: { audioId: string; revealTranscript?: boolean; transcript?: string }) {
  return <AudioPlayer key={audioId} audioId={audioId} revealTranscript={revealTranscript} transcript={transcript} />;
}

function AudioPlayer({ audioId, revealTranscript, transcript }: { audioId: string; revealTranscript?: boolean; transcript?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(false);
  const source = (japaneseAudioUrls as Record<string, string>)[audioId];
  useEffect(() => { const counter = request; return () => { counter.current++; }; }, []);

  if (!source) return <p className="rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] p-3 text-sm font-semibold text-[#53616c]">Listening audio is awaiting Japanese-language approval.</p>;

  async function play(nextSpeed = 1) {
    if (!audioRef.current) return;
    const version = ++request.current;
    setError(false);
    setSpeed(nextSpeed);
    audioRef.current.playbackRate = nextSpeed;
    audioRef.current.currentTime = 0;
    try { await audioRef.current.play(); }
    catch { if (version === request.current) setError(true); }
  }

  return (
    <div className="grid gap-3 rounded-xl border border-[#9cc7ff] bg-[#f5f9ff] p-4" data-testid="japanese-audio-player">
      <audio ref={audioRef} src={source} preload="metadata" />
      <p className="text-xs font-semibold uppercase text-[#1d4e9e]">AI-generated voice</p>
      <div className="flex flex-wrap gap-2">
        <Button label="Play / replay" icon={Play} onClick={() => void play()} tone="info" variant="primary" />
        <Button label="0.75× slow" icon={Turtle} aria-pressed={speed === 0.75} onClick={() => void play(0.75)} tone="info" />
      </div>
      {error ? <div className="ui-notice" role="status"><p>Couldn't play this audio. Check your sound and connection, then retry.</p><Button label="Retry audio" icon={RotateCcw} tone="warning" onClick={() => void play(speed)} /></div> : null}
      {revealTranscript && transcript ? <p lang="ja" className="text-lg font-medium text-[#263238]">{transcript}</p> : null}
    </div>
  );
}
