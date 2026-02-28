import { NextResponse } from "next/server";
import {
  ClientAccessError,
  assertClientAccess,
  getClientMetadata,
  readClientImageAsset
} from "@/lib/client-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AssetRouteContext = {
  params: {
    clientId: string;
    assetPath: string[];
  };
};

export async function GET(_request: Request, { params }: AssetRouteContext) {
  const metadata = await getClientMetadata(params.clientId);

  if (!metadata) {
    return new NextResponse("Not found.", { status: 404 });
  }

  try {
    await assertClientAccess(metadata.clientId, metadata);
  } catch (error) {
    if (error instanceof ClientAccessError) {
      return new NextResponse("Not authorized.", {
        status: 401,
        headers: {
          "Cache-Control": "private, no-store, max-age=0"
        }
      });
    }

    throw error;
  }

  try {
    const file = await readClientImageAsset(metadata.clientId, params.assetPath.join("/"));

    return new NextResponse(file.body, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": file.contentType
      }
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return new NextResponse("Not found.", { status: 404 });
    }

    throw error;
  }
}
