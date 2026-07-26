import type { GeneratedContent } from './types';
import { formatContentIssues, validateContent } from './validation';

export type ContentLoadResult =
  | { ok: true; content: GeneratedContent; warningMessages: string[] }
  | { ok: false; errorMessage: string; warningMessages: string[] };

export async function loadContent(): Promise<ContentLoadResult> {
  try {
    const generatedModule = await import('./generated/appContent.json');

    return validateLoadedContent(generatedModule.default);
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error
          ? `Contentbestand kon niet worden geladen: ${error.message}`
          : 'Contentbestand kon niet worden geladen door een onbekende fout.',
      warningMessages: [],
    };
  }
}

export function validateLoadedContent(content: unknown): ContentLoadResult {
  const validationResult = validateContent(content);
  const warningMessages = validationResult.warnings.map(
    (warning) => `${warning.code}: ${warning.message}`,
  );

  if (!validationResult.valid) {
    return {
      ok: false,
      errorMessage: formatContentIssues(validationResult),
      warningMessages,
    };
  }

  return {
    ok: true,
    content: content as GeneratedContent,
    warningMessages,
  };
}

export async function loadValidContent(): Promise<GeneratedContent> {
  const result = await loadContent();

  if (!result.ok) {
    throw new Error(result.errorMessage);
  }

  return result.content;
}
