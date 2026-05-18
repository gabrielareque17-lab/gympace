import { NextResponse } from "next/server";
import { sendGymPaceUpdate } from "@/lib/send-gympace-update";

const MAX_TITLE_LEN = 120;
const MAX_MSG_LEN = 500;

export async function POST(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || !secret || secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, message } = body as { title?: string; message?: string };

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LEN) {
    return NextResponse.json(
      { error: `title too long (max ${MAX_TITLE_LEN} chars)` },
      { status: 400 }
    );
  }
  if (message.length > MAX_MSG_LEN) {
    return NextResponse.json(
      { error: `message too long (max ${MAX_MSG_LEN} chars)` },
      { status: 400 }
    );
  }

  const result = await sendGymPaceUpdate({
    title: title.trim(),
    message: message.trim(),
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: result.sent });
}
