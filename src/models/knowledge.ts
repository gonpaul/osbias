// src/models/knowledge.ts
import { ID, Insertable, Updatable, Timestamps, WithID } from "./common";
import db from "../lib/db";

// export interface MentalModel extends WithID, Timestamps {
//   user_id: ID | null;
//   name: string;
//   description: string;
//   category: string | null;
//   is_system: boolean;
// }

// export type NewMentalModel = Insertable<MentalModel>;
// export type UpdateMentalModel = Updatable<MentalModel>;

export interface Framework extends WithID, Timestamps {
  user_id: ID | null;
  name: string;
  description: string;
  concepts: string;
  is_system: boolean;
}

export type NewFramework = Insertable<Framework>;
export type UpdateFramework = Updatable<Framework>;

export interface FrameworkStep extends WithID, Timestamps {
  framework_id: ID;
  step_order: number;
  title: string;
  description: string | null;
}

export type NewFrameworkStep = Insertable<FrameworkStep>;
export type UpdateFrameworkStep = Updatable<FrameworkStep>;

// export type FrameworkModelRole = "primary" | "supporting" | null;

// export interface FrameworkModel {
//   framework_id: ID;
//   model_id: ID;
//   role: FrameworkModelRole;
// }

// export type NewFrameworkModel = FrameworkModel;
// export type UpdateFrameworkModel = Partial<FrameworkModel>;

export interface SimilarFramework extends Timestamps {
  framework_id_a: ID;
  framework_id_b: ID;
  similarity_note: string | null;
}

export type NewSimilarFramework = SimilarFramework;
export type UpdateSimilarFramework = Partial<SimilarFramework>;

export interface FrameworkUsage extends WithID, Timestamps {
  user_id: ID;
  framework_id: ID;
  entry_id: ID | null;
  used_at: string;
  notes: string | null;
  completed: boolean;
}

export type NewFrameworkUsage = Insertable<FrameworkUsage>;
export type UpdateFrameworkUsage = Updatable<FrameworkUsage>;

export interface FrameworkEffectiveness extends WithID, Timestamps {
  user_id: ID;
  framework_id: ID;
  rating: number; // 1-5 scale
  feedback: string | null;
  rated_at: string;
}

export type NewFrameworkEffectiveness = Insertable<FrameworkEffectiveness>;
export type UpdateFrameworkEffectiveness = Updatable<FrameworkEffectiveness>;

// Helper functions for concepts JSON field
export function parseConcepts(concepts: string): string[] {
  try {
    return JSON.parse(concepts) || [];
  } catch {
    return [];
  }
}

export function stringifyConcepts(concepts: string[]): string {
  return JSON.stringify(concepts);
}

// Database operations for Frameworks
export async function getFrameworks(userId?: ID): Promise<Framework[]> {
  let query = db<Framework>("frameworks").select("*");
  if (userId) {
    // Also include frameworks where user_id is null (admin-added frameworks).
    // If these prove useful, they may be promoted to system frameworks (is_system = true).
    query = query.where("user_id", userId)
                 .orWhereNull("user_id")
                 .orWhere("is_system", true);
  }
  return query.orderBy("name");
}

export async function getFrameworkById(id: ID): Promise<Framework | undefined> {
  return db<Framework>("frameworks").where({ id }).first();
}

export async function createFramework(framework: NewFramework): Promise<Framework> {
  const [id] = await db<Framework>("frameworks").insert(framework);
  const newFramework = await db<Framework>("frameworks").where({ id }).first();
  if (!newFramework) throw new Error("Framework insert failed");
  return newFramework;
}

export async function updateFramework(id: ID, updates: UpdateFramework): Promise<Framework | undefined> {
  await db<Framework>("frameworks").where({ id }).update(updates);
  return db<Framework>("frameworks").where({ id }).first();
}

export async function deleteFramework(id: ID): Promise<boolean> {
  const deleted = await db<Framework>("frameworks").where({ id }).del();
  return deleted > 0;
}

// Database operations for Framework Steps
export async function getFrameworkSteps(frameworkId: ID): Promise<FrameworkStep[]> {
  return db<FrameworkStep>("framework_steps")
    .where({ framework_id: frameworkId })
    .orderBy("step_order");
}

export async function getFrameworkStepById(id: ID): Promise<FrameworkStep | undefined> {
  return db<FrameworkStep>("framework_steps").where({ id }).first();
}

export async function createFrameworkStep(step: NewFrameworkStep): Promise<FrameworkStep> {
  const [id] = await db<FrameworkStep>("framework_steps").insert(step);
  const newStep = await db<FrameworkStep>("framework_steps").where({ id }).first();
  if (!newStep) throw new Error("Framework step insert failed");
  return newStep;
}

export async function updateFrameworkStep(id: ID, updates: UpdateFrameworkStep): Promise<FrameworkStep | undefined> {
  await db<FrameworkStep>("framework_steps").where({ id }).update(updates);
  return db<FrameworkStep>("framework_steps").where({ id }).first();
}

export async function deleteFrameworkStep(id: ID): Promise<boolean> {
  const deleted = await db<FrameworkStep>("framework_steps").where({ id }).del();
  return deleted > 0;
}

// Get framework with steps
export async function getFrameworkWithSteps(id: ID): Promise<(Framework & { steps: FrameworkStep[] }) | undefined> {
  const framework = await getFrameworkById(id);
  if (!framework) return undefined;
  
  const steps = await getFrameworkSteps(id);
  return { ...framework, steps };
}

// Framework Usage Tracking
export async function createFrameworkUsage(usage: NewFrameworkUsage): Promise<FrameworkUsage> {
  const [id] = await db<FrameworkUsage>("framework_usage").insert(usage);
  const newUsage = await db<FrameworkUsage>("framework_usage").where({ id }).first();
  if (!newUsage) throw new Error("Framework usage insert failed");
  return newUsage;
}

export async function getFrameworkUsageByUser(userId: ID): Promise<FrameworkUsage[]> {
  return db<FrameworkUsage>("framework_usage")
    .where({ user_id: userId })
    .orderBy("used_at", "desc");
}

export async function getFrameworkUsageStats(frameworkId: ID): Promise<{
  total_uses: number;
  unique_users: number;
  completion_rate: number;
  avg_rating: number;
}> {
  const usage = await db<FrameworkUsage>("framework_usage")
    .where({ framework_id: frameworkId })
    .count("* as total_uses")
    .countDistinct("user_id as unique_users")
    .avg("completed as completion_rate")
    .first();

  const effectiveness = await db<FrameworkEffectiveness>("framework_effectiveness")
    .where({ framework_id: frameworkId })
    .avg("rating as avg_rating")
    .first();

  return {
    total_uses: parseInt(usage?.total_uses as string) || 0,
    unique_users: parseInt(usage?.unique_users as string) || 0,
    completion_rate: parseFloat(usage?.completion_rate as string) || 0,
    avg_rating: parseFloat(effectiveness?.avg_rating as string) || 0,
  };
}

// Framework Effectiveness Rating
export async function createFrameworkEffectiveness(effectiveness: NewFrameworkEffectiveness): Promise<FrameworkEffectiveness> {
  const [id] = await db<FrameworkEffectiveness>("framework_effectiveness").insert(effectiveness);
  const newEffectiveness = await db<FrameworkEffectiveness>("framework_effectiveness").where({ id }).first();
  if (!newEffectiveness) throw new Error("Framework effectiveness insert failed");
  return newEffectiveness;
}

export async function updateFrameworkEffectiveness(
  userId: ID, 
  frameworkId: ID, 
  updates: UpdateFrameworkEffectiveness
): Promise<FrameworkEffectiveness | undefined> {
  await db<FrameworkEffectiveness>("framework_effectiveness")
    .where({ user_id: userId, framework_id: frameworkId })
    .update(updates);
  return db<FrameworkEffectiveness>("framework_effectiveness")
    .where({ user_id: userId, framework_id: frameworkId })
    .first();
}
