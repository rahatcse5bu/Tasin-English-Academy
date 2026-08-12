/**
 * Deck content is authored for an HTML renderer, so display strings may contain
 * entities like `&amp;` or `&nbsp;`. React renders text nodes literally, so any
 * field shown as JSX text must be decoded first. HTML fields (rendered with
 * dangerouslySetInnerHTML) must NOT go through this.
 */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
};

export function plain(s: string | undefined | null): string {
  if (!s) return '';
  return s.replace(/&(#?\w+);/g, (m, code) => ENTITIES[code] ?? m);
}
