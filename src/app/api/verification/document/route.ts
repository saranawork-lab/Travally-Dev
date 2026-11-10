import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { VerificationService } from "@/server/verification/verificationService";
import { DocumentType } from "@/server/verification/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId, documentType, documentFile, scenario: bodyScenario, providerOverride: bodyProvider } = body;

    const scenario = bodyScenario || req.headers.get("x-mock-scenario") || undefined;
    const providerOverride = bodyProvider || req.headers.get("x-verification-provider") || undefined;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Verification session ID is required" },
        { status: 400 }
      );
    }

    if (!documentType || !["PASSPORT", "DRIVING_LICENSE", "PAN_CARD", "VOTER_ID", "NATIONAL_ID"].includes(documentType)) {
      return NextResponse.json(
        { error: "Valid document type is required (Passport, Driver's License, PAN Card, Voter ID, National ID)" },
        { status: 400 }
      );
    }

    if (!documentFile || !documentFile.mimeType || !documentFile.sizeBytes) {
      return NextResponse.json(
        { error: "Valid document image data is required" },
        { status: 400 }
      );
    }

    const result = await VerificationService.submitDocument({
      userId: user.id,
      sessionId,
      documentType: documentType as DocumentType,
      documentFile,
      scenario,
      providerOverride,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || "Document verification failed",
          errorCode: result.errorCode || "DOCUMENT_REJECTED",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ...result });
  } catch (error: any) {
    console.error("POST /api/verification/document error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process document verification" },
      { status: 500 }
    );
  }
}
