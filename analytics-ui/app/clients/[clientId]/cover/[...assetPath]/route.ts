import { NextResponse } from "next/server";
import {
  getClientMetadata,
  getRegistryCoverAssetPath,
  readClientImageAsset
} from "@/lib/client-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CoverRouteContext = {
  params: {
    clientId: string;
    assetPath: string[];
  };
};

export async function GET(_request: Request, { params }: CoverRouteContext) {
  const metadata = await getClientMetadata(params.clientId);

  if (!metadata) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const expectedAssetPath = getRegistryCoverAssetPath(metadata);
  const requestedAssetPath = params.assetPath.join("/");

  if (!expectedAssetPath || requestedAssetPath !== expectedAssetPath) {
    return new NextResponse("Not found.", { status: 404 });
  }

  try {
    const file = await readClientImageAsset(metadata.clientId, requestedAssetPath);

    return new NextResponse(file.body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
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
