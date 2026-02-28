"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE_NAME,
  AdminSessionError,
  assertAdminSession,
  createSignedAdminSessionCookieValue,
  getAdminSessionCookieOptions,
  verifyAdminPassword
} from "@/lib/admin-auth";
import {
  loadClientRegistry,
  saveClientRegistry,
  type ClientAccess,
  type ClientRegistryEntry
} from "@/lib/client-content";
import { ensureClientScaffold, getDefaultClientCoverImage } from "@/lib/client-scaffold";
import { setClientPassword } from "@/lib/client-secrets";
import { assertValidClientId } from "@/lib/server-runtime";

function toAccess(value: FormDataEntryValue | null): ClientAccess {
  return value === "password" ? "password" : "public";
}

function touchRegistryEntry(
  entry: Omit<ClientRegistryEntry, "updatedAt"> & { updatedAt?: string }
): ClientRegistryEntry {
  return {
    ...entry,
    updatedAt: new Date().toISOString()
  };
}

async function requireAdminForMutation() {
  try {
    await assertAdminSession();
  } catch (error) {
    if (error instanceof AdminSessionError) {
      redirect("/home/login?error=session");
    }

    throw error;
  }
}

export async function loginAdmin(formData: FormData) {
  const submittedPassword = String(formData.get("password") || "");
  const valid = await verifyAdminPassword(submittedPassword);

  if (!valid) {
    redirect("/home/login?error=invalid");
  }

  cookies().set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: await createSignedAdminSessionCookieValue(),
    ...getAdminSessionCookieOptions()
  });

  redirect("/home");
}

export async function logoutAdmin() {
  cookies().set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: "",
    ...getAdminSessionCookieOptions(),
    maxAge: 0
  });

  redirect("/home/login");
}

export async function saveClientSettings(formData: FormData) {
  await requireAdminForMutation();

  const clientId = assertValidClientId(String(formData.get("clientId") || ""));
  const title = String(formData.get("title") || "").trim();
  const access = toAccess(formData.get("access"));
  const newPassword = String(formData.get("newPassword") || "");
  const submittedCoverImage = String(formData.get("coverImage") || "").trim();
  const coverImage = submittedCoverImage || getDefaultClientCoverImage(clientId);

  if (!title) {
    redirect(`/home?error=missing-title&clientId=${clientId}`);
  }

  const registry = await loadClientRegistry();
  const existingEntry = registry.find((entry) => entry.clientId === clientId);

  if (!existingEntry) {
    redirect(`/home?error=client-not-found&clientId=${clientId}`);
  }

  await saveClientRegistry(
    registry.map((entry) =>
      entry.clientId === clientId
        ? touchRegistryEntry({
            ...entry,
            title,
            access,
            coverImage
          })
        : entry
    )
  );

  if (newPassword) {
    await setClientPassword(clientId, newPassword);
  }

  revalidatePath("/home");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/home?updated=${clientId}`);
}

export async function addClient(formData: FormData) {
  await requireAdminForMutation();

  const clientId = assertValidClientId(String(formData.get("clientId") || ""));
  const title = String(formData.get("title") || "").trim();
  const access = toAccess(formData.get("access"));
  const newPassword = String(formData.get("newPassword") || "");
  const submittedCoverImage = String(formData.get("coverImage") || "").trim();

  if (!title) {
    redirect("/home?error=missing-title");
  }

  const registry = await loadClientRegistry();
  if (registry.some((entry) => entry.clientId === clientId)) {
    redirect(`/home?error=duplicate-client&clientId=${clientId}`);
  }

  const scaffold = await ensureClientScaffold({
    clientId,
    title,
    access,
    coverImage: submittedCoverImage || undefined
  });

  await saveClientRegistry([
    ...registry,
    touchRegistryEntry({
      clientId,
      title,
      access,
      coverImage: submittedCoverImage || scaffold.coverImage
    })
  ]);

  if (newPassword) {
    await setClientPassword(clientId, newPassword);
  }

  revalidatePath("/home");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/home?created=${clientId}`);
}
