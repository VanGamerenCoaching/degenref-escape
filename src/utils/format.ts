export function formatDateTime(value: string | null | undefined): string {
  if (value === null || value === undefined || value.length === 0) {
    return 'Nog niet bekend';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Onbekende datum';
  }

  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
