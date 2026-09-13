/** Thrown by feature actions when the caller isn't allowed to do something. */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

/** Uniform failure shape returned by actions consumed via useActionState. */
export function fail(error: string) {
  return { ok: false as const, error };
}

export function done(message?: string) {
  return { ok: true as const, message };
}
