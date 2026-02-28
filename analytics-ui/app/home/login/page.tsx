import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { loginAdmin } from "@/app/home/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomeLoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

function getErrorMessage(errorCode: string | undefined) {
  if (errorCode === "invalid") {
    return "The admin password was incorrect.";
  }

  if (errorCode === "session") {
    return "Admin session expired. Sign in again.";
  }

  return "";
}

export default async function HomeLoginPage({ searchParams }: HomeLoginPageProps) {
  noStore();

  const alreadyAuthenticated = await hasValidAdminSession();
  if (alreadyAuthenticated) {
    redirect("/home");
  }

  const errorMessage = getErrorMessage(searchParams?.error);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10 md:px-10 md:py-14">
      <div className="grid w-full overflow-hidden rounded-[32px] border border-border/80 bg-white shadow-card md:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="border-b border-border/80 bg-[linear-gradient(140deg,#102f33_0%,#19534d_52%,#8dc0b3_100%)] p-7 text-white md:border-b-0 md:border-r md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
            Admin access
          </p>
          <h1 className="mt-4 text-3xl font-semibold md:text-5xl">Client registry control room.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/84 md:text-base">
            This route manages non-secret registry data plus write-only password resets. Stored
            client passwords are never shown back to the browser.
          </p>
          <div className="mt-8 rounded-[24px] border border-white/15 bg-white/8 p-5 text-sm leading-7 text-white/82">
            Admin route: <code>/home</code>
            <br />
            External URL with this app&apos;s base path: <code>/analytics/home</code>
          </div>
        </div>

        <div className="p-7 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-inkSoft">Sign in</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Enter the admin password</h2>
          <p className="mt-3 text-sm leading-7 text-inkSoft">
            Successful login sets a signed <code>httpOnly</code> <code>admin_session</code> cookie
            for 12 hours.
          </p>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-[#f1d3cb] bg-[#fff4ef] p-4 text-sm leading-6 text-[#8b4a34]">
              {errorMessage}
            </div>
          )}

          <form action={loginAdmin} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-ink">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-white px-4 text-base text-ink outline-none ring-accent/20 transition focus:ring"
                placeholder="Enter admin password"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Open admin dashboard
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
