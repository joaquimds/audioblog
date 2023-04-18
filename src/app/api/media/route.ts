import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { add } from "@/media";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.emailHash) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const body = await request.formData();
  const author = body.get("author") as string;
  const title = body.get("title") as string;
  const content = body.get("content") as Blob;
  if (!title || !content) {
    return new NextResponse("Invalid request", { status: 400 });
  }
  await add(author, title, session.emailHash, content);
  return new NextResponse("OK");
};
