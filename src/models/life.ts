// src/models/life.ts
import { ID, Insertable, Updatable, WithID, CreatedAtOnly } from './common';
import db from '../lib/db';

export interface Belief extends WithID, CreatedAtOnly {
  user_id: ID;
  belief: string;
  confidence_level: number; // 0..100
  evidence: string | null;
}

export type NewBelief = Insertable<Belief>;
export type UpdateBelief = Updatable<Belief>;

export type GoalStatus =
  | "planned"
  | "active"
  | "blocked"
  | "done"
  | "dropped";

export interface Goal extends WithID, CreatedAtOnly {
  user_id: ID;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null; // DATE
}

export type NewGoal = Insertable<Goal>;
export type UpdateGoal = Updatable<Goal>;

export interface Action extends WithID, CreatedAtOnly {
  goal_id: ID;
  description: string;
  completed: boolean;
  due_date: string | null; // DATE
}

export type NewAction = Insertable<Action>;
export type UpdateAction = Updatable<Action>;

// Database operations for Beliefs
export async function getBeliefs(userId: ID): Promise<Belief[]> {
  return db<Belief>("beliefs")
    .where({ user_id: userId })
    .orderBy("created_at", "desc");
}

export async function getBeliefById(id: ID): Promise<Belief | undefined> {
  return db<Belief>("beliefs").where({ id }).first();
}

export async function createBelief(belief: NewBelief): Promise<Belief> {
  const [id] = await db<Belief>("beliefs").insert(belief)
  const newBelief = await db<Belief>("beliefs").where({ id }).first();
  if (!newBelief) throw new Error("Belief insert failed");
  return newBelief;
}

export async function updateBelief(id: ID, updates: UpdateBelief): Promise<Belief | undefined> {
  await db<Belief>("beliefs").where({ id }).update(updates);
  return db<Belief>("beliefs").where({ id }).first();
}

export async function deleteBelief(id: ID): Promise<boolean> {
  const deleted = await db<Belief>("beliefs").where({ id }).del();
  return deleted > 0;
}

// Database operations for Goals
export async function getGoals(userId: ID): Promise<Goal[]> {
  return db<Goal>("goals")
    .where({ user_id: userId })
    .orderBy("created_at", "desc");
}

export async function getGoalById(id: ID): Promise<Goal | undefined> {
  return db<Goal>("goals").where({ id }).first();
}

export async function createGoal(goal: NewGoal): Promise<Goal> {
  const [id] = await db<Goal>("goals").insert(goal)
  const newGoal = await db<Goal>("goals").where({ id }).first();
  if (!newGoal) throw new Error("Goal insert failed");
  return newGoal;
}

export async function updateGoal(id: ID, updates: UpdateGoal): Promise<Goal | undefined> {
  await db<Goal>("goals").where({ id }).update(updates);
  return db<Goal>("goals").where({ id }).first();
}

export async function deleteGoal(id: ID): Promise<boolean> {
  const deleted = await db<Goal>("goals").where({ id }).del();
  return deleted > 0;
}

// Database operations for Actions
export async function getActions(goalId: ID): Promise<Action[]> {
  return db<Action>("actions")
    .where({ goal_id: goalId })
    .orderBy("created_at", "desc");
}

export async function getActionById(id: ID): Promise<Action | undefined> {
  return db<Action>("actions").where({ id }).first();
}

export async function createAction(action: NewAction): Promise<Action> {
  const [id] = await db<Action>("actions").insert(action)
  const newAction = await db<Action>("actions").where({ id }).first();
  if (!newAction) throw new Error("Action insert failed");
  return newAction;
}

export async function updateAction(id: ID, updates: UpdateAction): Promise<Action | undefined> {
  await db<Action>("actions").where({ id }).update(updates);
  return db<Action>("actions").where({ id }).first();
}

export async function deleteAction(id: ID): Promise<boolean> {
  const deleted = await db<Action>("actions").where({ id }).del();
  return deleted > 0;
}

// Get goal with actions
export async function getGoalWithActions(id: ID): Promise<(Goal & { actions: Action[] }) | undefined> {
  const goal = await getGoalById(id);
  if (!goal) return undefined;
  
  const actions = await getActions(id);
  return { ...goal, actions };
}
