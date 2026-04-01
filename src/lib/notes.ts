import {z} from 'zod';
import type {NoteEntry} from '@/lib/types';

const noteSchema = z.object({
  page: z.number().int().nonnegative(),
  note: z.string(),
});

const notesSchema = z.array(noteSchema);

export function parseNotesJson(input: string): NoteEntry[] {
  const parsed = JSON.parse(input);
  return notesSchema.parse(parsed);
}
