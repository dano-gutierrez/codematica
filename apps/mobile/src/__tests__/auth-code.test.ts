import { exchangeNativeAuthCode } from "../lib/auth-code";

it("shares a one-use auth exchange across duplicate callback mounts", async () => {
  let finish!: (value: { error: null }) => void;
  const exchange = jest.fn(() => new Promise<{ error: null }>(resolve => { finish = resolve; }));
  const client = { auth: { exchangeCodeForSession: exchange } };
  const first = exchangeNativeAuthCode(client, "code-1");
  const duplicate = exchangeNativeAuthCode(client, "code-1");
  expect(duplicate).toBe(first); expect(exchange).toHaveBeenCalledTimes(1);
  finish({ error: null }); await expect(first).resolves.toEqual({ error: null });
  await expect(exchangeNativeAuthCode(client, "code-1")).resolves.toEqual({ error: null });
  expect(exchange).toHaveBeenCalledTimes(1);
});

it("retains a failed code outcome while allowing a fresh sign-in code or client", async () => {
  const exchange = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ error: null });
  const client = { auth: { exchangeCodeForSession: exchange } };
  await expect(exchangeNativeAuthCode(client, "code-1")).rejects.toThrow("offline");
  await expect(exchangeNativeAuthCode(client, "code-1")).rejects.toThrow("offline");
  expect(exchange).toHaveBeenCalledTimes(1);
  await expect(exchangeNativeAuthCode(client, "code-2")).resolves.toEqual({ error: null });
  const other = { auth: { exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }) } };
  await exchangeNativeAuthCode(other, "code-2");
  expect(exchange).toHaveBeenCalledTimes(2); expect(other.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
});
