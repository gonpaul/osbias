import db from "../lib/db";
import { ID, Insertable, Updatable, Timestamps, WithID } from "./common";

export interface ValidationStep {
  id: string;
  proposition: string;
  isValid: boolean;
  confidence: number; // 0-1
  reasoning: string;
  dependencies: string[]; // IDs of previous steps this depends on
  environment: string; // Context where this should be validated
}

export interface ValidationResult {
  overallValid: boolean;
  steps: ValidationStep[];
  summary: string;
  recommendations: string[];
}

export interface ValidationHistory extends WithID, Timestamps {
  user_id: number;
  journal_entry_id: number | null;
  original_text: string;
  validation_result: string; // JSON string of ValidationResult
  ai_provider: string | null;
  ai_model: string | null;
  text_start: number | null;
  text_end: number | null;
  is_full_document: boolean;
}

export type NewValidationHistory = Insertable<ValidationHistory>;
export type UpdateValidationHistory = Updatable<ValidationHistory>;

export async function createValidationHistory(data: NewValidationHistory): Promise<ValidationHistory> {
  const [id] = await db('validation_history').insert(data);
  return getValidationHistoryById(id);
}

export async function getValidationHistoryById(id: number): Promise<ValidationHistory | null> {
  const result = await db('validation_history').where({ id }).first();
  return result || null;
}

export async function getValidationHistoryByUserId(
  userId: number, 
  limit: number = 50, 
  offset: number = 0
): Promise<ValidationHistory[]> {
  return await db('validation_history')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
}

export async function getValidationHistoryByJournalEntry(
  journalEntryId: number
): Promise<ValidationHistory[]> {
  return await db('validation_history')
    .where({ journal_entry_id: journalEntryId })
    .orderBy('created_at', 'desc');
}

export async function getValidationHistoryByFilePath(
  userId: number,
  filePath: string,
  limit: number = 50,
  offset: number = 0
): Promise<ValidationHistory[]> {
  return await db('validation_history')
    .where({ user_id: userId, file_path: filePath })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
}

export async function getValidationHistoryByEntryForUser(
  userId: number,
  entryId: number,
  limit: number = 50,
  offset: number = 0
): Promise<ValidationHistory[]> {
  return await db('validation_history')
    .where({ user_id: userId, journal_entry_id: entryId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
}

export async function deleteValidationHistory(id: number, userId: number): Promise<boolean> {
  const deleted = await db('validation_history')
    .where({ id, user_id: userId })
    .del();
  return deleted > 0;
}

export async function searchValidationHistory(
  userId: number,
  searchTerm: string,
  limit: number = 50,
  offset: number = 0
): Promise<ValidationHistory[]> {
  return await db('validation_history')
    .where({ user_id: userId })
    .where(function() {
      this.where('original_text', 'like', `%${searchTerm}%`)
        .orWhere('validation_result', 'like', `%${searchTerm}%`);
    })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
}

// Helper function to parse validation result from JSON string
export function parseValidationResult(jsonString: string): ValidationResult {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse validation result:', error);
    return {
      overallValid: false,
      steps: [],
      summary: 'Failed to parse validation result',
      recommendations: []
    };
  }
}

// Helper function to stringify validation result to JSON string
export function stringifyValidationResult(result: ValidationResult): string {
  return JSON.stringify(result);
}
