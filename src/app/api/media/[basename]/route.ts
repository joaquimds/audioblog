import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ForbiddenError, NotFoundError } from "@/errors";
import { remove } from "@/media";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export const DELETE = async (
  request: Request,
  { params }: { params: { basename: string } }
) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.emailHash) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { basename } = params;
  try {
    await remove(basename, session.emailHash);
    return new NextResponse("OK", { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ForbiddenError) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (e instanceof NotFoundError) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse("Error", { status: 500 });
  }
};
