import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  ClientAccessError,
  assertClientAccess,
  buildClientAssetHref,
  getClientMetadata,
  loadClientContent
} from "@/lib/client-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ClientPageProps = {
  params: {
    clientId: string;
  };
};

function redirectToUnlock(clientId: string) {
  redirect(`/clients/${clientId}/unlock`);
}

export default async function ClientPage({ params }: ClientPageProps) {
  noStore();

  const metadata = await getClientMetadata(params.clientId);
  if (!metadata) {
    notFound();
  }

  if (metadata.access === "password") {
    try {
      await assertClientAccess(metadata.clientId, metadata);
    } catch (error) {
      if (
        error instanceof ClientAccessError &&
        (error.code === "unlock-required" || error.code === "password-not-configured")
      ) {
        redirectToUnlock(metadata.clientId);
      }

      throw error;
    }
  }

  const content = await loadClientContent(metadata.clientId);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <div className="overflow-hidden rounded-[30px] border border-border/80 bg-white shadow-card">
        <div className="border-b border-border/80 bg-[linear-gradient(135deg,#f7faf8_0%,#e4efe8_60%,#d7e9e1_100%)] px-6 py-8 md:px-10 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-inkSoft">
                {content.clientId}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-ink md:text-5xl">{content.title}</h1>
              {content.summary && (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-inkSoft md:text-base">
                  {content.summary}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  content.access === "password"
                    ? "bg-[#f7e1d8] text-[#8b4a34]"
                    : "bg-accentSoft text-accent"
                }`.trim()}
              >
                {content.access}
              </span>
              {content.updatedAt && (
                <p className="text-xs uppercase tracking-[0.18em] text-inkSoft">
                  Updated {content.updatedAt}
                </p>
              )}
              <Link
                href="/clients"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
              >
                All clients
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 md:px-10 md:py-8">
          {content.slides.map((slide, index) => (
            <section
              key={slide.id}
              className="grid gap-6 rounded-[28px] border border-border/80 bg-[#fcfdfc] p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] md:p-7"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-inkSoft">
                  {slide.eyebrow || `Slide ${index + 1}`}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">{slide.title}</h2>

                {slide.body && (
                  <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-inkSoft md:text-base">
                    {slide.body}
                  </p>
                )}

                {slide.bullets && slide.bullets.length > 0 && (
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-ink md:text-base">
                    {slide.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-accent" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {slide.image ? (
                <figure className="overflow-hidden rounded-[24px] border border-border/80 bg-white">
                  <img
                    src={buildClientAssetHref(content.clientId, slide.image.asset)}
                    alt={slide.image.alt || slide.title}
                    className="h-full min-h-[220px] w-full object-cover"
                  />
                  {slide.image.caption && (
                    <figcaption className="border-t border-border/80 px-4 py-3 text-xs uppercase tracking-[0.14em] text-inkSoft">
                      {slide.image.caption}
                    </figcaption>
                  )}
                </figure>
              ) : (
                <div className="rounded-[24px] border border-dashed border-border bg-white/70 p-5 text-sm leading-6 text-inkSoft">
                  Add an image file under <code>/clients/{content.clientId}/images</code> and reference
                  it with <code>"image.asset"</code> in <code>content.json</code>.
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
