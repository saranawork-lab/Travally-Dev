import { NextRequest, NextResponse } from "next/server";
import { VerificationService } from "@/server/verification/verificationService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = await VerificationService.handleWebhook({
      headers,
      rawBody,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ received: true, result: result.result });
  } catch (error: any) {
    console.error("POST /api/verification/webhook error:", error);
    return NextResponse.json(
      { error: error?.message || "Webhook handling error" },
      { status: 500 }
    );
  }
}
