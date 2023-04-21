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
  const content = body.get("content") as Blob;
  const author = body.get("author") as string;
  const parent = body.get("parent") as string | null;
  const title = body.get("title") as string;
  if (!title || !content || !author) {
    return new NextResponse("Invalid request", { status: 400 });
  }
  const audio = await add(content, author, session.emailHash, parent, title);
  return NextResponse.json(audio);
};
