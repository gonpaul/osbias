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
    query = query.where("user_id", userId).orWhere("is_system", true);
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
