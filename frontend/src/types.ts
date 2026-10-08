export type View =
  | "campaigns"
  | "detail"
  | "history"
  | "organizer"
  | "admin"
  | "payment";

export type Page<T> = {
  items: T[];
  meta: { total: number };
};
