import { createContext, type ReactNode, useContext } from 'react';
import type { GeneratedContent } from './types';

const ContentContext = createContext<GeneratedContent | null>(null);

interface ContentProviderProps {
  children: ReactNode;
  content: GeneratedContent;
}

export function ContentProvider({ children, content }: ContentProviderProps) {
  return (
    <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
  );
}

export function useContent(): GeneratedContent {
  const content = useContext(ContentContext);

  if (content === null) {
    throw new Error('ContentProvider ontbreekt.');
  }

  return content;
}
