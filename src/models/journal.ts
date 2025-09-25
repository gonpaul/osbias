import { ID, Insertable, Updatable, Timestamps, WithID, CreatedAtOnly } from "./common";
import db from "../lib/db";

export interface JournalEntry extends WithID, Timestamps {
  user_id: ID;
  framework_id: ID | null;
  title: string;
  content: string;
}

export type NewJournalEntry = Insertable<JournalEntry>;
export type UpdateJournalEntry = Updatable<JournalEntry>;

export interface Idea extends WithID, CreatedAtOnly {
  entry_id: ID;
  framework_id: ID | null; // Changed from model_id
  content: string;
  text_selection: string | null;
  file_path: string | null;
}

export type NewIdea = Insertable<Idea>;
export type UpdateIdea = Updatable<Idea>;

// Database operations for Journal Entries
export async function getJournalEntries(userId: ID): Promise<JournalEntry[]> {
  return db<JournalEntry>("journal_entries")
    .where({ user_id: userId })
    .orderBy("created_at", "desc");
}

export async function getJournalEntryById(id: ID): Promise<JournalEntry | undefined> {
  return db<JournalEntry>("journal_entries").where({ id }).first();
}

export async function createJournalEntry(entry: NewJournalEntry): Promise<JournalEntry> {
  const [id] = await db<JournalEntry>("journal_entries").insert(entry)
  const newEntry = await db<JournalEntry>("journal_entries").where({ id }).first();
  if (!newEntry) throw new Error("Journal entry insert failed");
  return newEntry;
}

export async function updateJournalEntry(id: ID, updates: UpdateJournalEntry): Promise<JournalEntry | undefined> {
  await db<JournalEntry>("journal_entries").where({ id }).update(updates);
  return db<JournalEntry>("journal_entries").where({ id }).first();
}

export async function deleteJournalEntry(id: ID): Promise<boolean> {
  const deleted = await db<JournalEntry>("journal_entries").where({ id }).del();
  return deleted > 0;
}

// Database operations for Ideas
export async function getIdeas(entryId: ID): Promise<Idea[]> {
  return db<Idea>("ideas")
    .where({ entry_id: entryId })
    .orderBy("created_at", "desc");
}

export async function createIdea(idea: NewIdea): Promise<Idea> {
  const [id] = await db<Idea>("ideas").insert(idea)
  const newIdea = await db<Idea>("ideas").where({ id }).first();
  if (!newIdea) throw new Error("Idea insert failed");
  return newIdea;
}

export async function getIdeaById(id: ID): Promise<Idea | undefined> {
  return db<Idea>("ideas").where({ id }).first();
}

export async function updateIdea(id: ID, updates: UpdateIdea): Promise<Idea | undefined> {
  await db<Idea>("ideas").where({ id }).update(updates);
  return db<Idea>("ideas").where({ id }).first();
}

export async function deleteIdea(id: ID): Promise<boolean> {
  const deleted = await db<Idea>("ideas").where({ id }).del();
  return deleted > 0;
}

// Get journal entry with ideas
export async function getJournalEntryWithIdeas(id: ID): Promise<(JournalEntry & { ideas: Idea[] }) | undefined> {
  const entry = await getJournalEntryById(id);
  if (!entry) return undefined;
  
  const ideas = await getIdeas(id);
  return { ...entry, ideas };
}