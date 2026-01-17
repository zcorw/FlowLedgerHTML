import type { ZodError } from "zod";

export const buildErrors = <T extends Record<string, unknown>>(error: ZodError) => {
  const next: Partial<Record<keyof T, string>> = {};
  for (const issue of error.issues) {
    const pathKey = issue.path[0];
    if (typeof pathKey === "string") {
      next[pathKey as keyof T] = issue.message;
    }
  }
  return next;
};
