/**
 * @jest-environment node
 */
import { parseDetailMarkers } from '../parseDetailMarkers';

describe('parseDetailMarkers', () => {
  it('returns a single text segment when there are no markers', () => {
    expect(parseDetailMarkers('just plain text')).toEqual([
      { type: 'text', text: 'just plain text' },
    ]);
  });

  it('splits text around a single marker', () => {
    expect(parseDetailMarkers('Try [[open:res_1]] today')).toEqual([
      { type: 'text', text: 'Try ' },
      { type: 'marker', id: 'res_1' },
      { type: 'text', text: ' today' },
    ]);
  });

  it('handles multiple and adjacent markers in order', () => {
    expect(
      parseDetailMarkers('[[open:a]][[open:b]] and [[open:c]]'),
    ).toEqual([
      { type: 'marker', id: 'a' },
      { type: 'marker', id: 'b' },
      { type: 'text', text: ' and ' },
      { type: 'marker', id: 'c' },
    ]);
  });

  it('trims whitespace inside the marker id', () => {
    expect(parseDetailMarkers('[[open: res_9 ]]')).toEqual([
      { type: 'marker', id: 'res_9' },
    ]);
  });

  it('leaves malformed / unmatched brackets as plain text', () => {
    // Empty-id `[[open:]]` and stray brackets don't match, so the whole string
    // stays a single text segment.
    const input = 'see [[open:]] and [not a marker]';
    expect(parseDetailMarkers(input)).toEqual([{ type: 'text', text: input }]);
  });

  it('returns an empty array for an empty string', () => {
    expect(parseDetailMarkers('')).toEqual([]);
  });
});
