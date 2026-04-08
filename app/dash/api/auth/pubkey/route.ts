import { NextResponse } from "next/server";
import { getRsaPublicKeyPem } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ code: 200, data: { publicKey: getRsaPublicKeyPem() } });
}
