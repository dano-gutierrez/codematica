type AuthCodeClient = { auth: { exchangeCodeForSession: (code: string) => PromiseLike<{ error: { message: string } | null }> } };
const latest = new WeakMap<AuthCodeClient, { code: string; outcome: Promise<{ error: { message: string } | null }> }>();

/** A repeated current callback observes its outcome instead of consuming its code again. */
export function exchangeNativeAuthCode(client: AuthCodeClient, code: string) {
  const previous = latest.get(client);
  if (previous?.code === code) return previous.outcome;
  const outcome = Promise.resolve(client.auth.exchangeCodeForSession(code));
  latest.set(client, { code, outcome });
  return outcome;
}
