// Exercises /api/auth/register across every documented status code.
// Turbopack compiles routes on first hit, so each request is given a long
// timeout and retried once on failure.
const base = "http://localhost:3000";
const suffix = Math.random().toString(36).slice(2, 9);
const email = `probe+${suffix}@fazaa.sa`;

async function post(body, raw) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw ? raw : JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      const json = await res.json().catch(() => null);
      return { status: res.status, body: json };
    } catch (e) {
      if (attempt === 2) return { error: e.message };
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

const out = {};
out["1. valid volunteer"] = await post({
  name: " probe volunteer ",
  email,
  password: "hunter2000",
  role: "VOLUNTEER",
});
out["2. duplicate email"] = await post({
  name: "dupe", email, password: "hunter2000", role: "VOLUNTEER",
});
out["3. organizer w/ orgName"] = await post({
  name: "probe organizer",
  email: `org+${suffix}@fazaa.sa`,
  password: "hunter2000",
  role: "ORGANIZER",
  orgName: "  Jordan Cleanup Collective  ",
});
out["4. organizer, no orgName"] = await post({
  name: "no org", email: `noorg+${suffix}@fazaa.sa`, password: "hunter2000", role: "ORGANIZER",
});
out["5. short password"] = await post({
  name: "x", email: `short+${suffix}@fazaa.sa`, password: "abc", role: "VOLUNTEER",
});
out["6. bad email"] = await post({
  name: "x", email: "not-an-email", password: "hunter2000", role: "VOLUNTEER",
});
out["7. bad role"] = await post({
  name: "x", email: `badrole+${suffix}@fazaa.sa`, password: "hunter2000", role: "ADMIN",
});
out["8. invalid json"] = await post(null, "not json");
out["9. missing fields"] = await post({ name: "x" });

for (const [k, v] of Object.entries(out)) {
  console.log(`${k} -> ${JSON.stringify(v).slice(0, 200)}`);
}

// Verify the two created users actually landed with the right shape.
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
const vol = await db.user.findUnique({
  where: { email },
  select: { id: true, role: true, organizerProfile: { select: { orgName: true } } },
});
const org = await db.user.findUnique({
  where: { email: `org+${suffix}@fazaa.sa` },
  select: { id: true, role: true, name: true, organizerProfile: { select: { orgName: true } } },
});
console.log("\nDB volunteer:", JSON.stringify(vol));
console.log("DB organizer :", JSON.stringify(org));
// confirm bcrypt hash is not plaintext
const pw = await db.user.findUnique({ where: { email }, select: { passwordHash: true } });
console.log("hash looks like bcrypt:", pw ? pw.passwordHash.startsWith("$2") : null);
await db.$disconnect();
