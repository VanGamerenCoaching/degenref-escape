import type { GeneratedContent } from '../../content/types';
import type { ReviewNote } from '../../storage/reviewNotesStorage';

export interface ReviewReport {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    canonicalFile: string;
    contentTitle: string;
    generatedDate: string;
    sourceEdition: string;
  };
  noteCount: number;
  notes: ReviewNote[];
  instruction: string;
}

export function buildReviewReport({
  content,
  generatedAt,
  notes,
}: {
  content: GeneratedContent;
  generatedAt: string;
  notes: readonly ReviewNote[];
}): ReviewReport {
  const sortedNotes = [...notes].sort(
    (left, right) =>
      left.questionId.localeCompare(right.questionId, 'nl') ||
      left.date.localeCompare(right.date),
  );

  return {
    schemaVersion: 1,
    generatedAt,
    source: {
      canonicalFile: content.source.canonicalFile,
      contentTitle: content.metadata.title,
      generatedDate: content.metadata.generatedDate,
      sourceEdition: content.metadata.sourceEdition,
    },
    noteCount: sortedNotes.length,
    notes: sortedNotes,
    instruction:
      'Dit lokale reviewrapport wijzigt de ingebouwde appcontent niet. Verwerk akkoord, aanpassingen of controlepunten daarna handmatig in de bron-JSON.',
  };
}
