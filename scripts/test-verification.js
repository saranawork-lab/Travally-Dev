/**
 * Automated Verification Test Suite for Travally
 * Tests all 17 conditions specified in the requirements.
 */

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";

let testCookie = "";
let testUserEmail = "";
let testUserId = "";

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

  // Extract set-cookie if any
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

async function runTests() {
  console.log("=================================================================");
  console.log("  TRAVALLY IDENTITY VERIFICATION SUITE — EXECUTING TESTS        ");
  console.log(`  Target: ${BASE_URL}                                           `);
  console.log("=================================================================\n");

  const results = { passed: 0, failed: 0 };

  async function step(name, fn) {
    try {
      console.log(`\n▶ [TEST] ${name}`);
      await fn();
      results.passed++;
    } catch (e) {
      results.failed++;
      console.error(`Error in test "${name}":`, e.message);
    }
  }

  // 1. Unauthenticated protected access
  await step("1. Unauthenticated requests to protected endpoints return 401", async () => {
    testCookie = "";
    const actRes = await request("/api/activities", { method: "POST", body: JSON.stringify({}) });
    assert(actRes.status === 401, "POST /api/activities returns 401 for unauthenticated user");

    const travelRes = await request("/api/travel", { method: "POST", body: JSON.stringify({}) });
    assert(travelRes.status === 401, "POST /api/travel returns 401 for unauthenticated user");

    const growRes = await request("/api/home/grow", { method: "POST", body: JSON.stringify({}) });
    assert(growRes.status === 401, "POST /api/home/grow returns 401 for unauthenticated user");

    const treasureRes = await request("/api/home/treasure", { method: "POST", body: JSON.stringify({}) });
    assert(treasureRes.status === 401, "POST /api/home/treasure returns 401 for unauthenticated user");

    const findMeRes = await request("/api/home/find-me", { method: "POST", body: JSON.stringify({}) });
    assert(findMeRes.status === 401, "POST /api/home/find-me returns 401 for unauthenticated user");
  });

  // 2. Register fresh unverified user
  await step("2. Register fresh user who starts as UNVERIFIED", async () => {
    testUserEmail = `test_explorer_${Date.now()}@travally.app`;
    const regRes = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: testUserEmail,
        password: "Password123!",
        displayName: "Test Explorer",
        city: "Bengaluru",
        pincode: "560001",
      }),
    });

    assert(regRes.status === 200 || regRes.status === 201, `Registration returned status ${regRes.status}`);
    assert(regRes.json?.user?.isVerified === false, "User isVerified is false by default");
    assert(regRes.json?.user?.verificationStatus === "UNVERIFIED", "User verificationStatus is UNVERIFIED");
    testUserId = regRes.json?.user?.id;
  });

  // 3. Post Category is EXEMPT from verification
  await step("3. EXEMPT CATEGORY: Unverified user can create a Post without verification", async () => {
    const postRes = await request("/api/home/instants", {
      method: "POST",
      body: JSON.stringify({
        content: "Testing exempt community photo moment from unverified user!",
        locationName: "Cubbon Park, Bengaluru",
      }),
    });

    assert(postRes.status === 200 || postRes.status === 201, "POST /api/home/instants succeeded without verification");
    assert(postRes.json?.success === true, "Post creation response has success: true");
  });

  // 4. All 3 Protected Categories (5 endpoints) blocked with 403
  await step("4. PROTECTED CATEGORIES: Unverified user blocked with 403 IDENTITY_VERIFICATION_REQUIRED", async () => {
    const endpoints = [
      { path: "/api/activities", label: "Activity (Companion Activity)" },
      { path: "/api/travel", label: "Travel Trip" },
      { path: "/api/home/grow", label: "Nature & Humanity (Grow Cause)" },
      { path: "/api/home/treasure", label: "Treasure Quest" },
      { path: "/api/home/find-me", label: "Find Me Clue" },
    ];

    for (const ep of endpoints) {
      const res = await request(ep.path, {
        method: "POST",
        body: JSON.stringify({ title: "Test Blocked Attempt" }),
      });
      assert(res.status === 403, `${ep.label} (${ep.path}) returned 403 Forbidden`);
      assert(
        res.json?.code === "IDENTITY_VERIFICATION_REQUIRED",
        `${ep.label} returns stable error code IDENTITY_VERIFICATION_REQUIRED`
      );
    }
  });

  // 5. Verification status endpoint
  await step("5. GET /api/verification/status returns unverified status", async () => {
    const statusRes = await request("/api/verification/status");
    assert(statusRes.status === 200, "Status endpoint returned 200");
    assert(statusRes.json?.isVerified === false, "isVerified is false");
    assert(statusRes.json?.verificationStatus === "UNVERIFIED", "verificationStatus is UNVERIFIED");
  });

  // 6. Start verification session
  let activeSessionId = "";
  await step("6. POST /api/verification/session initiates a new session", async () => {
    const sessRes = await request("/api/verification/session", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assert(sessRes.status === 200, "Session endpoint returned 200");
    assert(sessRes.json?.session?.sessionId, "Returned session ID");
    assert(sessRes.json?.session?.status === "ID_PENDING", "Session status is ID_PENDING");
    activeSessionId = sessRes.json.session.sessionId;
  });

  // 7. Document validation checks
  await step("7. Document submission validation (MIME, size, error cases)", async () => {
    // A. Invalid MIME type
    const badMimeRes = await request("/api/verification/document", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        documentType: "PASSPORT",
        documentFile: {
          mimeType: "application/pdf",
          sizeBytes: 1024,
          base64Data: "data:application/pdf;base64,123",
        },
      }),
    });
    assert(badMimeRes.status === 400, "Invalid MIME type rejected with 400");
    assert(badMimeRes.json?.errorCode === "INVALID_MIME_TYPE", "Correct error code INVALID_MIME_TYPE");

    // B. Oversized file (> 5MB)
    const bigFileRes = await request("/api/verification/document", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        documentType: "PASSPORT",
        documentFile: {
          mimeType: "image/jpeg",
          sizeBytes: 6 * 1024 * 1024,
          base64Data: "data:image/jpeg;base64,123",
        },
      }),
    });
    assert(bigFileRes.status === 400, "Oversized file (>5MB) rejected with 400");
    assert(bigFileRes.json?.errorCode === "FILE_TOO_LARGE", "Correct error code FILE_TOO_LARGE");

    // C. Simulated ID failure scenario
    const failDocRes = await request("/api/verification/document", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        documentType: "PAN_CARD",
        documentFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 200,
          base64Data: "data:image/jpeg;base64,abc",
        },
        scenario: "id_failed",
      }),
    });
    assert(failDocRes.status === 400, "id_failed scenario rejected with 400");
    assert(failDocRes.json?.errorCode === "DOCUMENT_UNREADABLE", "Safe failure code returned");

    // D. Attempting selfie when document is failed should be rejected
    const blockedSelfie = await request("/api/verification/selfie", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        selfieFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 100,
          base64Data: "data:image/jpeg;base64,xyz",
        },
      }),
    });
    assert(blockedSelfie.status === 400, "Selfie stage blocked before valid ID document");

    // E. Valid document submission
    const validDocRes = await request("/api/verification/document", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        documentType: "PASSPORT",
        documentFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 350,
          base64Data: "data:image/jpeg;base64,valid_document_portrait_photo",
        },
        scenario: "success",
      }),
    });
    assert(validDocRes.status === 200, "Valid document accepted with 200");
    assert(validDocRes.json?.documentValid === true, "documentValid is true");
  });

  // 8. Controlled Selfie Failure & Review Scenarios
  await step("8. Selfie failure scenarios (liveness failure, face mismatch, review pending)", async () => {
    // A. Liveness failure
    const livenessFailRes = await request("/api/verification/selfie", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        selfieFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 150,
          base64Data: "data:image/jpeg;base64,spoofed_or_static_frame",
        },
        scenario: "liveness_failed",
      }),
    });
    assert(livenessFailRes.status === 400, "Liveness failure rejected with 400");
    assert(livenessFailRes.json?.errorCode === "LIVENESS_FAILED", "Returns LIVENESS_FAILED");

    // Verify user is still blocked
    const stillBlocked1 = await request("/api/activities", { method: "POST", body: JSON.stringify({}) });
    assert(stillBlocked1.status === 403, "User remains blocked after liveness failure");

    // B. Face mismatch
    const mismatchRes = await request("/api/verification/selfie", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        selfieFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 150,
          base64Data: "data:image/jpeg;base64,different_person",
        },
        scenario: "face_mismatch",
      }),
    });
    assert(mismatchRes.status === 400, "Face mismatch rejected with 400");
    assert(mismatchRes.json?.errorCode === "FACE_MISMATCH", "Returns FACE_MISMATCH");

    // C. Review pending
    const reviewPendingRes = await request("/api/verification/selfie", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        selfieFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 150,
          base64Data: "data:image/jpeg;base64,needs_human_review",
        },
        scenario: "review_pending",
      }),
    });
    assert(reviewPendingRes.status === 200, "Review pending returns 200");
    assert(reviewPendingRes.json?.status === "REVIEW_PENDING", "Status is REVIEW_PENDING");

    // Verify user remains blocked while under review
    const stillBlocked2 = await request("/api/travel", { method: "POST", body: JSON.stringify({}) });
    assert(stillBlocked2.status === 403, "User remains blocked while verification is in review");
  });

  // 9. Successful Verification (One-Time Unlock)
  await step("9. Successful Verification: Updates user to VERIFIED", async () => {
    // Re-submit document to get to selfie stage
    await request("/api/verification/document", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        documentType: "PASSPORT",
        documentFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 350,
          base64Data: "data:image/jpeg;base64,valid_id",
        },
        scenario: "success",
      }),
    });

    const successSelfie = await request("/api/verification/selfie", {
      method: "POST",
      body: JSON.stringify({
        sessionId: activeSessionId,
        selfieFile: {
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 150,
          base64Data: "data:image/jpeg;base64,genuine_live_selfie",
        },
        scenario: "success",
      }),
    });

    assert(successSelfie.status === 200, "Successful selfie returns 200");
    assert(successSelfie.json?.status === "VERIFIED", "Status is VERIFIED");
    assert(successSelfie.json?.livenessPassed === true, "livenessPassed is true");
    assert(successSelfie.json?.faceMatchPassed === true, "faceMatchPassed is true");

    // Verify status endpoint reflects VERIFIED
    const statusRes = await request("/api/verification/status");
    assert(statusRes.json?.isVerified === true, "GET /api/verification/status returns isVerified: true");
    assert(statusRes.json?.verificationStatus === "VERIFIED", "verificationStatus is VERIFIED");
  });

  // 10. Account-Level Access to All 3 Protected Categories
  await step("10. One-time verification unlocks ALL 3 protected categories and all 5 subcategories", async () => {
    // 1. Companion Activity
    const actRes = await request("/api/activities", {
      method: "POST",
      body: JSON.stringify({
        title: "Sunset Chai & Film Discussion",
        description: "Specialty coffee, indie films, and relaxed city chats.",
        category: "FOOD_CAFES",
        date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        startTime: "18:00",
        locationName: "Cubbon Park, Bengaluru",
      }),
    });
    assert(actRes.status === 201 || actRes.status === 200, "Companion Activity created successfully (Protected Category 1)");

    // 2. Travel Trip
    const tripRes = await request("/api/travel", {
      method: "POST",
      body: JSON.stringify({
        destination: "Spiti Valley",
        departureCity: "Chandigarh",
        startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 12).toISOString(),
        travelStyle: "ADVENTURE",
      }),
    });
    assert(tripRes.status === 201 || tripRes.status === 200, "Travel Trip created successfully (Protected Category 1 subcategory)");

    // 3. Grow Cause
    const growRes = await request("/api/home/grow", {
      method: "POST",
      body: JSON.stringify({
        title: "Cubbon Park Lake Cleanup & Tree Plantation",
        description: "Community cleanup drive for natural pond and planting indigenous saplings.",
        causeCategory: "PLANTATION",
        locationName: "Cubbon Park, Bengaluru",
        date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        volunteersNeeded: 15,
      }),
    });
    assert(growRes.status === 200 || growRes.status === 201, "Grow Cause created successfully (Protected Category 2)");

    // 4. Treasure Quest
    const treasureRes = await request("/api/home/treasure", {
      method: "POST",
      body: JSON.stringify({
        title: "The Copper Coin of Lalbagh",
        hintRiddle: "Look beneath the oldest banyan near the glasshouse rose bed.",
        locationName: "Lalbagh Botanical Garden",
        latitude: 12.9507,
        longitude: 77.5848,
        difficulty: "MEDIUM",
      }),
    });
    assert(treasureRes.status === 200 || treasureRes.status === 201, "Treasure Quest created successfully (Protected Category 3)");

    // 5. Find Me Clue
    const findMeRes = await request("/api/home/find-me", {
      method: "POST",
      body: JSON.stringify({
        clueText: "Reading a vintage yellow paperbook by the French window.",
        hintArea: "Indiranagar 100ft Road, Bangalore",
        vibeTag: "Coffee & Books",
      }),
    });
    assert(findMeRes.status === 200 || findMeRes.status === 201, "Find Me Clue created successfully (Protected Category 3 subcategory)");
  });

  // 11. Idempotency & No Re-verification
  await step("11. Switching categories or re-requesting verification does not prompt again", async () => {
    const sessionRes = await request("/api/verification/session", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assert(sessionRes.status === 200, "Session endpoint returned 200");
    assert(sessionRes.json?.alreadyVerified === true, "Returns alreadyVerified: true");
    assert(sessionRes.json?.status === "VERIFIED", "Status remains VERIFIED");
  });

  // 12. Webhook Authentication & Security
  await step("12. Webhook rejects unauthenticated or invalid signature requests", async () => {
    const unsignedWebhook = await request("/api/verification/webhook", {
      method: "POST",
      body: JSON.stringify({ sessionId: "fake_session", status: "VERIFIED" }),
    });
    assert(unsignedWebhook.status === 401, "Unsigned webhook rejected with 401");
  });

  // 13. Reset Verification in Dev
  await step("13. Development reset endpoint resets user to UNVERIFIED", async () => {
    const resetRes = await request("/api/verification/reset", {
      method: "POST",
    });
    assert(resetRes.status === 200, "Reset endpoint returned 200");

    const statusCheck = await request("/api/verification/status");
    assert(statusCheck.json?.isVerified === false, "User is now UNVERIFIED after reset");

    // Check that protected routes are blocked again
    const reBlocked = await request("/api/activities", { method: "POST", body: JSON.stringify({}) });
    assert(reBlocked.status === 403, "Protected endpoint is blocked again after reset");

    // Check that Post route remains accessible
    const postStillExempt = await request("/api/home/instants", {
      method: "POST",
      body: JSON.stringify({ content: "Post is still completely exempt after reset!" }),
    });
    assert(postStillExempt.status === 200 || postStillExempt.status === 201, "Post remains exempt");
  });

  console.log("\n=================================================================");
  console.log(`  TEST RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log("=================================================================\n");

  if (results.failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
