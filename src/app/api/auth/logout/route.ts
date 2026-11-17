import { NextRequest, NextResponse } from "next/server";
import { session } from "@/lib/auth/session";
import { fail, safeMutation } from "@/lib/http";
export async function POST(request: NextRequest) { try { safeMutation(request); (await session()).destroy(); return NextResponse.json({ ok: true }); } catch (error) { return fail(error); } }
