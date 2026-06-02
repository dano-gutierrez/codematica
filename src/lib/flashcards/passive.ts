export type RandomFn = () => number;

export type PassiveFlashcardWindowItem<T> = {
  card: T;
  sequenceIndex: number;
  instanceId: string;
};

export function shufflePassiveFlashcards<T>(cards: readonly T[], random: RandomFn = Math.random): T[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function buildPassiveFlashcardWindow<T extends { id: string }>(cards: readonly T[], count: number): PassiveFlashcardWindowItem<T>[] {
  if (cards.length === 0 || count <= 0) {
    return [];
  }

  return Array.from({ length: count }, (_, sequenceIndex) => {
    const card = cards[sequenceIndex % cards.length];

    return {
      card,
      sequenceIndex,
      instanceId: `${card.id}-${sequenceIndex}`,
    };
  });
}
