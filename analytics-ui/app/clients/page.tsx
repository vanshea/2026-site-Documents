import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { loadClientRegistry } from "@/lib/client-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientsIndexPage() {
  noStore();

  const clients = await loadClientRegistry();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <div className="rounded-[28px] border border-border/80 bg-white/90 p-6 shadow-card backdrop-blur md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-inkSoft">
          Client Rooms
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-ink md:text-5xl">
              Presentation content served from Documents.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-inkSoft md:text-base">
              The registry lives in <code>/content/clients/index.json</code>. Each client keeps its
              own canonical slide JSON, images, and future website code in <code>/clients/&lt;id&gt;</code>.
            </p>
          </div>
          <Link
            href="/overview"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
          >
            Analytics dashboard
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {clients.map((client) => (
          <article
            key={client.clientId}
            className="overflow-hidden rounded-[28px] border border-border/80 bg-white shadow-card"
          >
            {client.coverImage ? (
              <img
                src={client.coverImage}
                alt={`${client.title} cover`}
                className="h-56 w-full border-b border-border/80 object-cover"
              />
            ) : (
              <div className="flex h-56 w-full items-end border-b border-border/80 bg-[linear-gradient(135deg,#173c39_0%,#1f6f5f_55%,#b8dacf_100%)] p-6 text-white">
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">No cover image</span>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-inkSoft">
                    {client.clientId}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">{client.title}</h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    client.access === "password"
                      ? "bg-[#f7e1d8] text-[#8b4a34]"
                      : "bg-accentSoft text-accent"
                  }`.trim()}
                >
                  {client.access}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-inkSoft">
                {client.access === "password"
                  ? "This client room checks the signed cookie before any slide JSON is read."
                  : "This client room loads from the same file system structure without a password gate."}
              </p>

              <Link
                href={`/clients/${client.clientId}`}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Open client room
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
