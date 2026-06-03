import db from "../lib/db";
import { ID, Insertable, Updatable, Timestamps, WithID } from "./common";
import { hashPassword } from "@/lib/auth";

export interface User extends WithID, Timestamps {
  name: string;
  email: string;
  password_hash: string;
  preferences?: string | null;
  role: 'user' | 'admin';
  openai_api_key?: string | null;
  anthropic_api_key?: string | null;
  openrouter_api_key?: string | null;
  // New user management fields
  is_test_user?: boolean;
  rate_limit_quota?: number | null;
  exempt_from_rate_limit?: boolean;
  plan?: string | null;
  allow_posting?: boolean;
}

export type NewUser = Insertable<User>;
export type UpdateUser = Updatable<User>;

// New type: input for createUser, has password (not password_hash)
export type NewUserWithPassword = Omit<NewUser, "password_hash" | "role"> & { password: string };

export async function getUsers(): Promise<User[]> {
  return db<User>("users").select("*");
}

export async function createUser(user: NewUserWithPassword): Promise<User> {
  const { password, ...rest } = user;
  if (!password) throw new Error("Password required");
  const password_hash = await hashPassword(password);
  const [id] = await db<User>("users").insert({ ...rest, password_hash, role: 'user' });
  const newUser = await db<User>("users").where({ id }).first();
  if (!newUser) throw new Error("User insert failed");
  return newUser;
}

export async function getUserById(id: ID): Promise<User | undefined> {
  return db<User>("users").where({ id }).first();
}

export async function updateUser(id: ID, updates: UpdateUser): Promise<User | undefined> {
  await db<User>("users").where({ id }).update(updates);
  return db<User>("users").where({ id }).first();
}

export async function deleteUser(id: ID): Promise<boolean> {
  const deleted = await db<User>("users").where({ id }).del();
  return deleted > 0;
}
