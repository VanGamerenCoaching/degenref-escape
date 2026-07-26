import { describe, expect, it } from 'vitest';
import {
  REVIEW_NOTES_STORAGE_KEY,
  createReviewNote,
  loadReviewNotes,
  upsertReviewNote,
} from './reviewNotesStorage';

describe('reviewNotesStorage', () => {
  it('laadt leeg wanneer er nog geen reviewnotities zijn opgeslagen', () => {
    expect(loadReviewNotes(new MemoryStorage())).toEqual([]);
  });

  it('slaat reviewnotities lokaal op en laadt alleen geldige records terug', () => {
    const storage = new MemoryStorage();
    const note = createReviewNote({
      questionId: 'q-t8-01',
      status: 'akkoord',
      text: 'Controle akkoord.',
      date: '2026-07-25T10:00:00.000Z',
      reviewerName: 'Reviewer',
    });

    storage.setItem(REVIEW_NOTES_STORAGE_KEY, JSON.stringify([
      note,
      {
        questionId: '',
        status: 'aanpassen',
        text: 'Deze is technisch geldig maar zonder nuttige ID.',
        date: '2026-07-25T10:01:00.000Z',
      },
      {
        questionId: 'q-t1-01',
        status: 'onbekend',
        text: 'Ongeldige status.',
        date: '2026-07-25T10:02:00.000Z',
      },
    ]));

    expect(loadReviewNotes(storage)).toEqual([note]);
  });

  it('herstelt beschadigde reviewopslag zonder te crashen', () => {
    const storage = new MemoryStorage();
    storage.setItem(REVIEW_NOTES_STORAGE_KEY, '{geen-json');

    expect(loadReviewNotes(storage)).toEqual([]);
    expect(storage.getItem(REVIEW_NOTES_STORAGE_KEY)).toBeNull();
  });

  it('vervangt een bestaande notitie per vraag-ID deterministisch', () => {
    const firstNote = createReviewNote({
      questionId: 'q-t8-01',
      status: 'controleren',
      text: 'Nog bekijken.',
      date: '2026-07-25T10:00:00.000Z',
      reviewerName: '',
    });
    const replacementNote = createReviewNote({
      questionId: 'q-t8-01',
      status: 'aanpassen',
      text: 'Bronpagina controleren.',
      date: '2026-07-25T10:05:00.000Z',
      reviewerName: 'Reviewer',
    });
    const otherNote = createReviewNote({
      questionId: 'q-t1-01',
      status: 'akkoord',
      text: '',
      date: '2026-07-25T10:02:00.000Z',
      reviewerName: '',
    });

    expect(upsertReviewNote([firstNote, otherNote], replacementNote)).toEqual([
      otherNote,
      replacementNote,
    ]);
    expect(firstNote).not.toHaveProperty('reviewerName');
  });
});

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}
