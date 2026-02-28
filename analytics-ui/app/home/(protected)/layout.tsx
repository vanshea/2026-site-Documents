import { unstable_noStore as noStore } from "next/cache";
import { requireAdminSessionOrRedirect } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomeProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  noStore();
  await requireAdminSessionOrRedirect();

  return children;
}
