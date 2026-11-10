/**
 * Tests Production Fail-Closed Verification Behavior via HTTP
 * Confirms that when the real provider (HyperVerge) is targeted in production
 * without configured API credentials:
 * 1. Document verification fails closed (PROVIDER_NOT_CONFIGURED).
 * 2. Selfie verification fails closed (never auto-approves or marks VERIFIED).
 * 3. User account remains unverified.
 * 4. Protected creation categories remain locked.
 */

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";

let testCookie = "";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(testCookie ? { Cookie: testCookie } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (typeof res.headers.getSetCookie === "function") {
    const all = res.headers.getSetCookie();
    for (const c of all) {
      if (c.includes("travally_session=")) {
        testCookie = c.split(";")[0];
      }
    }
  } else {
    const sc = res.headers.get("set-cookie");
    if (sc && sc.includes("travally_session=")) {
      testCookie = sc.split(";")[0];
    }
  }

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}

  return { status: res.status, json, text, headers: res.headers };
}

async function runFailClosedHttpTests() {
  console.log("=================================================================");
  console.log("  TESTING PRODUCTION FAIL-CLOSED VERIFICATION SECURITY           ");
  console.log(`  Target: ${BASE_URL}                                           `);
  console.log("=================================================================\n");

  // 1. Register temporary user
  const email = `failclosed_test_${Date.now()}@travally.app`;
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password123!",
      displayName: "FailClosed Tester",
      city: "Mumbai",
      pincode: "400001",
    }),
  });
  assert(regRes.status === 200 || regRes.status === 201, "Test user registered");
  assert(regRes.json?.user?.isVerified === false, "User starts as unverified");

  // 2. Start session targeting production provider HyperVerge (which lacks API credentials)
  const sessRes = await request("/api/verification/session", {
    method: "POST",
    headers: {
      "x-verification-provider": "hyperverge",
    },
    body: JSON.stringify({}),
  });

  // Since credentials are not configured, session returns 500 / error
  assert(
    sessRes.status === 500 || sessRes.status === 400 || sessRes.json?.error,
    "Production session without credentials strictly fails closed"
  );

  // 3. Document submission targeting production provider
  const docRes = await request("/api/verification/document", {
    method: "POST",
    headers: {
      "x-verification-provider": "hyperverge",
    },
    body: JSON.stringify({
      sessionId: "unconfigured_session",
      documentType: "PASSPORT",
      documentFile: {
        mimeType: "image/jpeg",
        sizeBytes: 1024 * 100,
        base64Data: "data:image/jpeg;base64,sample_id",
      },
    }),
  });
  assert(
    docRes.status === 400 || docRes.status === 500,
    "Document verification fails closed without credentials"
  );
  assert(
    docRes.json?.success !== true,
    "Document verification does not grant validity without credentials"
  );

  // 4. Selfie submission targeting production provider
  const selfieRes = await request("/api/verification/selfie", {
    method: "POST",
    headers: {
      "x-verification-provider": "hyperverge",
    },
    body: JSON.stringify({
      sessionId: "unconfigured_session",
      selfieFile: {
        mimeType: "image/jpeg",
        sizeBytes: 1024 * 100,
        base64Data: "data:image/jpeg;base64,sample_selfie",
      },
    }),
  });
  assert(
    selfieRes.json?.status !== "VERIFIED",
    "Selfie verification NEVER marks user VERIFIED when provider credentials are missing"
  );
  assert(
    selfieRes.json?.status === "REVIEW_PENDING" || selfieRes.status === 400 || selfieRes.status === 500,
    "Selfie verification strictly defaults to pending review or rejection without credentials"
  );

  // 5. Verify user remains unverified and protected endpoints remain locked
  const statusRes = await request("/api/verification/status");
  assert(statusRes.json?.isVerified === false, "User isVerified remains false");

  const blockedAct = await request("/api/activities", { method: "POST", body: JSON.stringify({}) });
  assert(blockedAct.status === 403, "Companion Activity remains locked (403)");

  const blockedTravel = await request("/api/travel", { method: "POST", body: JSON.stringify({}) });
  assert(blockedTravel.status === 403, "Travel Trip remains locked (403)");

  // 6. Post remains exempt
  const postRes = await request("/api/home/instants", {
    method: "POST",
    body: JSON.stringify({ content: "Post remains 100% exempt!" }),
  });
  assert(postRes.status === 200 || postRes.status === 201, "Post creation succeeds unconditionally");

  console.log("\n=================================================================");
  console.log("  PRODUCTION FAIL-CLOSED TESTS: ALL PASSED                       ");
  console.log("=================================================================\n");
}

runFailClosedHttpTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
