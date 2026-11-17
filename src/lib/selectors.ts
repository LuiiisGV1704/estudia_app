import type { Flashcard, Subject, Deck, StudyBlock, Book } from '../types';

import { today, addDays } from './date';

export const getSubject = (subjects: Subject[], id?: string): Subject =>
  subjects.find((subject) => subject.id === id) ?? {
    id: 'none',
    name: 'General',
    color: '#665d54',
    icon: 'school',
  };

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const getBookProgress = (book: Book): number =>
  Math.round((Math.min(book.currentPage, book.totalPages) / Math.max(1, book.totalPages)) * 100);

export const getDeckCards = (cards: Flashcard[], deckId: string): Flashcard[] =>
  cards.filter((card) => card.deckId === deckId);

export const isCardDue = (card: Flashcard, date = today()): boolean => card.state === 'new' || card.due <= date;

export const getDueCards = (cards: Flashcard[], deckId?: string, date = today()): Flashcard[] =>
  cards.filter((card) => (!deckId || deckId === 'all' || card.deckId === deckId) && isCardDue(card, date));

export const getDeckStats = (deck: Deck, cards: Flashcard[]) => {
  const deckCards = getDeckCards(cards, deck.id);
  const stats = {
    total: deckCards.length,
    new: deckCards.filter((card) => card.state === 'new').length,
    learning: deckCards.filter((card) => card.state === 'learning').length,
    review: deckCards.filter((card) => card.state === 'review').length,
    due: deckCards.filter((card) => isCardDue(card)).length,
  };
  const mastery = stats.total === 0 ? 0 : Math.round((stats.review / stats.total) * 100);
  return { ...stats, mastery };
};

export const dueCount = (cards: Flashcard[]): number => getDueCards(cards).length;

export const nextExam = (blocks: StudyBlock[]): StudyBlock | undefined =>
  blocks
    .filter((block) => block.kind === 'exam' && block.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))[0];

export const upcomingBlocks = (blocks: StudyBlock[], days = 8): StudyBlock[] => {
  const limit = addDays(today(), days);
  return blocks
    .filter((block) => block.date >= today() && block.date <= limit)
    .sort((a, b) => (a.date + (a.start ?? '99:99')).localeCompare(b.date + (b.start ?? '99:99')));
};

export const totalStudyMinutes = (logs: { minutes: number }[]): number =>
  logs.reduce((sum, log) => sum + log.minutes, 0);

export const retentionOf = (logs: { reviews: number; correct: number }[]): number => {
  const reviews = logs.reduce((sum, log) => sum + log.reviews, 0);
  const correct = logs.reduce((sum, log) => sum + log.correct, 0);
  return reviews === 0 ? 0 : Math.round((correct / reviews) * 100);
};

export const logsInRange = <T extends { date: string }>(logs: T[], start: string, end: string): T[] =>
  logs.filter((log) => log.date >= start && log.date <= end);
