export const REVIEW_NOTES_STORAGE_KEY = 'degenref-escape-review-notes';

export const REVIEW_NOTE_STATUSES = ['akkoord', 'aanpassen', 'controleren'] as const;

export type ReviewNoteStatus = (typeof REVIEW_NOTE_STATUSES)[number];

export interface ReviewNote {
  questionId: string;
  status: ReviewNoteStatus;
  text: string;
  date: string;
  reviewerName?: string;
}

interface ReviewStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadReviewNotes(storage: ReviewStorageLike): ReviewNote[] {
  const rawValue = storage.getItem(REVIEW_NOTES_STORAGE_KEY);

  if (rawValue === null) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      storage.removeItem(REVIEW_NOTES_STORAGE_KEY);
      return [];
    }

    return parsedValue.filter(isReviewNote);
  } catch {
    storage.removeItem(REVIEW_NOTES_STORAGE_KEY);
    return [];
  }
}

export function saveReviewNotes(
  storage: ReviewStorageLike,
  notes: readonly ReviewNote[],
): void {
  storage.setItem(REVIEW_NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export function upsertReviewNote(
  notes: readonly ReviewNote[],
  note: ReviewNote,
): ReviewNote[] {
  const remainingNotes = notes.filter(
    (currentNote) => currentNote.questionId !== note.questionId,
  );

  return [...remainingNotes, note].sort((left, right) =>
    left.questionId.localeCompare(right.questionId, 'nl'),
  );
}

export function createReviewNote({
  date,
  questionId,
  reviewerName,
  status,
  text,
}: {
  date: string;
  questionId: string;
  reviewerName: string;
  status: ReviewNoteStatus;
  text: string;
}): ReviewNote {
  const trimmedReviewerName = reviewerName.trim();
  const note = {
    questionId,
    status,
    text,
    date,
  };

  return trimmedReviewerName.length === 0
    ? note
    : { ...note, reviewerName: trimmedReviewerName };
}

function isReviewNote(value: unknown): value is ReviewNote {
  if (!isRecord(value)) {
    return false;
  }

  const reviewerName = value.reviewerName;

  return (
    typeof value.questionId === 'string' &&
    value.questionId.trim().length > 0 &&
    REVIEW_NOTE_STATUSES.includes(value.status as ReviewNoteStatus) &&
    typeof value.text === 'string' &&
    typeof value.date === 'string' &&
    (reviewerName === undefined || typeof reviewerName === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
