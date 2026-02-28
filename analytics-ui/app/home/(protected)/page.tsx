import { unstable_noStore as noStore } from "next/cache";
import { addClient, logoutAdmin, saveClientSettings } from "@/app/home/actions";
import { loadClientRegistry } from "@/lib/client-content";
import { loadClientPasswordStatuses } from "@/lib/client-secrets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomePageProps = {
  searchParams?: {
    created?: string;
    updated?: string;
    error?: string;
    clientId?: string;
  };
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function getBannerCopy(searchParams: HomePageProps["searchParams"]) {
  if (!searchParams) {
    return "";
  }

  if (searchParams.created) {
    return `Created client ${searchParams.created}.`;
  }

  if (searchParams.updated) {
    return `Saved client ${searchParams.updated}.`;
  }

  if (searchParams.error === "duplicate-client") {
    return `Client ${searchParams.clientId || ""} already exists.`;
  }

  if (searchParams.error === "missing-title") {
    return "Title is required.";
  }

  if (searchParams.error === "client-not-found") {
    return `Client ${searchParams.clientId || ""} was not found.`;
  }

  return "";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  noStore();

  const registry = await loadClientRegistry();
  const passwordStatuses = await loadClientPasswordStatuses(
    registry.map((entry) => entry.clientId)
  );
  const bannerMessage = getBannerCopy(searchParams);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 md:px-10 md:py-12">
      <div className="rounded-[30px] border border-border/80 bg-white shadow-card">
        <div className="border-b border-border/80 bg-[linear-gradient(135deg,#f7faf8_0%,#e7f1eb_58%,#d9ebe3_100%)] px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-inkSoft">
                /home admin
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-ink md:text-5xl">
                Manage the client registry and write-only password resets.
              </h1>
              <p className="mt-4 text-sm leading-7 text-inkSoft md:text-base">
                Registry data stays in <code>/content/clients/index.json</code>. Passwords are stored
                only as Argon2 hashes in SQLite and are never rendered back to the UI.
              </p>
            </div>

            <form action={logoutAdmin}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>

          {bannerMessage && (
            <div className="mt-5 rounded-2xl border border-border bg-white/85 px-4 py-3 text-sm text-inkSoft">
              {bannerMessage}
            </div>
          )}
        </div>

        <div className="grid gap-6 px-6 py-6 md:px-10 md:py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            {registry.map((client) => {
              const status = passwordStatuses[client.clientId];

              return (
                <form
                  key={client.clientId}
                  action={saveClientSettings}
                  className="rounded-[24px] border border-border/80 bg-[#fbfcfb] p-5"
                >
                  <input type="hidden" name="clientId" value={client.clientId} />

                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-inkSoft">
                        {client.clientId}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-inkSoft">
                        Password set: <strong className="text-ink">{status?.hasPassword ? "yes" : "no"}</strong>
                        {" · "}Last updated:{" "}
                        <strong className="text-ink">{formatTimestamp(status?.updatedAt)}</strong>
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.16em] text-inkSoft">
                      Registry updated {formatTimestamp(client.updatedAt)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-ink">
                      Title
                      <input
                        name="title"
                        defaultValue={client.title}
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                      />
                    </label>

                    <label className="text-sm font-medium text-ink">
                      Access
                      <select
                        name="access"
                        defaultValue={client.access}
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                      >
                        <option value="public">public</option>
                        <option value="password">password</option>
                      </select>
                    </label>

                    <label className="text-sm font-medium text-ink md:col-span-2">
                      Cover image
                      <input
                        name="coverImage"
                        defaultValue={client.coverImage}
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                        placeholder="/analytics/clients/example/cover/cover.svg"
                      />
                    </label>

                    <label className="text-sm font-medium text-ink md:col-span-2">
                      Reset password
                      <input
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                        placeholder="Set new password"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-inkSoft">
                    <span>SQLite hash only</span>
                    <span>No plaintext echo</span>
                    <span>/content/clients/{client.clientId}.json</span>
                  </div>

                  <button
                    type="submit"
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Save client
                  </button>
                </form>
              );
            })}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[24px] border border-border/80 bg-[#fbfcfb] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-inkSoft">
                Add client
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Create a new client scaffold</h2>
              <p className="mt-3 text-sm leading-7 text-inkSoft">
                Creates the registry entry, <code>/clients/&lt;id&gt;/http/README.md</code>,
                <code> /clients/&lt;id&gt;/images/</code>, and starter
                <code> /content/clients/&lt;id&gt;.json</code> with an empty slide array.
              </p>

              <form action={addClient} className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-ink">
                  Client ID
                  <input
                    name="clientId"
                    required
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                    placeholder="acme"
                  />
                </label>

                <label className="block text-sm font-medium text-ink">
                  Title
                  <input
                    name="title"
                    required
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                    placeholder="ACME"
                  />
                </label>

                <label className="block text-sm font-medium text-ink">
                  Access
                  <select
                    name="access"
                    defaultValue="public"
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                  >
                    <option value="public">public</option>
                    <option value="password">password</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-ink">
                  Cover image
                  <input
                    name="coverImage"
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                    placeholder="Optional override"
                  />
                </label>

                <label className="block text-sm font-medium text-ink">
                  Initial password
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className="mt-2 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none ring-accent/20 transition focus:ring"
                    placeholder="Optional write-only password"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Add client
                </button>
              </form>
            </section>

            <section className="rounded-[24px] border border-border/80 bg-[#fff8f2] p-5 text-sm leading-7 text-[#8b4a34]">
              <strong className="block text-xs font-semibold uppercase tracking-[0.18em]">
                Warnings
              </strong>
              Passwords are write-only here.
              <br />
              JSON files never store secrets.
              <br />
              Changing a client password invalidates existing unlock cookies because signatures are
              derived from the stored hash.
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
