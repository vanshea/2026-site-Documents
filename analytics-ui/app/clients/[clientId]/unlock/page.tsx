import Link from "next/link";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  CLIENT_ACCESS_COOKIE_NAME,
  ClientAccessError,
  assertClientAccess,
  createSignedClientAccessCookieValue,
  getClientAccessCookieOptions,
  getClientMetadata,
  isClientPasswordConfigured,
  verifySubmittedClientPassword
} from "@/lib/client-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ClientUnlockPageProps = {
  params: {
    clientId: string;
  };
  searchParams?: {
    error?: string;
  };
};

function getUnlockErrorCopy(errorCode: string | undefined): string {
  if (errorCode === "invalid") {
    return "That password did not match the configured client secret.";
  }

  if (errorCode === "not-configured") {
    return "This client is marked as password-protected, but its environment variable is not configured yet.";
  }

  return "";
}

export default async function ClientUnlockPage({
  params,
  searchParams
}: ClientUnlockPageProps) {
  noStore();

  const metadata = await getClientMetadata(params.clientId);
  if (!metadata) {
    notFound();
  }

  if (metadata.access !== "password") {
    redirect(`/clients/${metadata.clientId}`);
  }

  const clientId = metadata.clientId;
  const passwordEnvLabel = `CLIENT_PASSWORD_${clientId.replaceAll("-", "_").toUpperCase()}`;

  try {
    await assertClientAccess(clientId, metadata);
    redirect(`/clients/${clientId}`);
  } catch (error) {
    if (!(error instanceof ClientAccessError)) {
      throw error;
    }
  }

  const passwordConfigured = await isClientPasswordConfigured(clientId);

  async function unlockClient(formData: FormData) {
    "use server";

    const submittedPassword = String(formData.get("password") || "");
    const verification = await verifySubmittedClientPassword(clientId, submittedPassword);

    if (verification !== "ok") {
      redirect(`/clients/${clientId}/unlock?error=${verification}`);
    }

    const cookieStore = cookies();
    cookieStore.set({
      name: CLIENT_ACCESS_COOKIE_NAME,
      value: await createSignedClientAccessCookieValue(clientId),
      ...getClientAccessCookieOptions(clientId)
    });

    redirect(`/clients/${clientId}`);
  }

  const errorMessage = getUnlockErrorCopy(searchParams?.error);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 md:px-10 md:py-14">
      <div className="grid w-full overflow-hidden rounded-[32px] border border-border/80 bg-white shadow-card md:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="border-b border-border/80 bg-[linear-gradient(140deg,#173c39_0%,#1f6f5f_56%,#8dc0b3_100%)] p-6 text-white md:border-b-0 md:border-r md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            Password-protected client
          </p>
          <h1 className="mt-4 text-3xl font-semibold md:text-5xl">{metadata.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/82 md:text-base">
            The page checks for a valid signed cookie before it reads <code>content.json</code>. If
            the cookie is missing or invalid, rendering stops here.
          </p>

          <img
            src={metadata.coverImage}
            alt={`${metadata.title} cover`}
            className="mt-8 h-72 w-full rounded-[24px] border border-white/15 object-cover shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
          />
        </div>

        <div className="p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-inkSoft">Unlock</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Enter client password</h2>
          <p className="mt-3 text-sm leading-7 text-inkSoft">
            Expected env var: <code>{passwordEnvLabel}</code>
          </p>

          {!passwordConfigured && (
            <div className="mt-5 rounded-2xl border border-[#f1d3cb] bg-[#fff4ef] p-4 text-sm leading-6 text-[#8b4a34]">
              This client cannot be unlocked until its password env var is configured.
            </div>
          )}

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-[#f1d3cb] bg-[#fff4ef] p-4 text-sm leading-6 text-[#8b4a34]">
              {errorMessage}
            </div>
          )}

          <form action={unlockClient} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-ink">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-white px-4 text-base text-ink outline-none ring-accent/20 transition focus:ring"
                placeholder="Enter password"
                required
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!passwordConfigured}
            >
              Unlock client room
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/clients"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            >
              Back to clients
            </Link>

            <form
              action={async () => {
                "use server";
                cookies().set({
                  name: CLIENT_ACCESS_COOKIE_NAME,
                  value: "",
                  ...getClientAccessCookieOptions(clientId),
                  maxAge: 0
                });
                redirect(`/clients/${clientId}/unlock`);
              }}
            >
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
              >
                Clear client cookie
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
