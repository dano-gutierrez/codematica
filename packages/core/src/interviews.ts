export function selectInterviewSolutionTrack<TTrack extends { id: string }>(
  question: { solutionTracks: TTrack[] },
  previousTrackId?: string,
  random: () => number = Math.random,
): TTrack {
  const tracks = question.solutionTracks;

  if (tracks.length === 0) {
    throw new Error("Interview question has no solution tracks.");
  }

  const candidates = previousTrackId && tracks.length > 1 ? tracks.filter((track) => track.id !== previousTrackId) : tracks;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));

  return candidates[index];
}
