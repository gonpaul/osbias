export type ID = number;

export type Timestamps = {
  created_at?: Date;
  updated_at?: Date;
};

export type CreatedAtOnly = {
  created_at?: Date;
};

export type WithID = { id: ID };

export type Insertable<T extends object> = Omit<
  T,
  "id" | "created_at" | "updated_at"
>;

export type Updatable<T extends object> = Partial<
  Omit<T, "id" | "created_at" | "updated_at">
>;
