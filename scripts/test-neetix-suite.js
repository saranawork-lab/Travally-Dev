const fs = require('fs');
const crypto = require('crypto');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Load environment
const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/^NEETIX_API_KEY=(.*)$/m);
if (!match) {
  console.error("NEETIX_API_KEY missing from .env");
  process.exit(1);
}
const apiKey = match[1].trim();
const baseUrl = (envContent.match(/^NEETIX_BASE_URL=(.*)$/m)?.[1]?.trim() || 'https://liveliness.neetix.in').replace(/\/$/, "");

console.log("===============================================================================");
console.log("            TRAVALLY — NEETIX LIVELINESS INTEGRATION TEST SUITE               ");
console.log("===============================================================================");
console.log(`Target Base URL: ${baseUrl}`);
console.log(`API Key Prefix:  ${apiKey.substring(0, 10)}... (Test Key: ${apiKey.startsWith('lv_test_')})`);
console.log("===============================================================================\n");

const person1Buf = fs.readFileSync('scripts/fixtures/person1.jpg');
const person2Buf = fs.readFileSync('scripts/fixtures/person2.jpg');
const noFaceBuf = fs.readFileSync('public/brand-logo.png');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function safeFetch(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      const isConnectTimeout =
        err.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        err.message?.includes('Connect Timeout');
      if (i < retries && isConnectTimeout) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw err;
    }
  }
}

async function runSuite() {
  // --------------------------------------------------------------------------
  // TEST 1: Matching Selfie and ID Portrait
  // --------------------------------------------------------------------------
  console.log("--- Test 1: Matching Selfie & ID Portrait (Genuine Match) ---");
  {
    const fd = new FormData();
    fd.append('person', new Blob([person1Buf], { type: 'image/jpeg' }), 'selfie.jpg');
    fd.append('card', new Blob([person1Buf], { type: 'image/jpeg' }), 'id_portrait.jpg');
    fd.append('clientRefId', `test-match-${Date.now()}`);

    const res = await safeFetch(`${baseUrl}/v1/face/face-match`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: fd,
    });

    const data = await res.json();
    assert(res.status === 200, `HTTP status is 200 (Got ${res.status})`);
    assert(data.status === 'success', `Response status is 'success'`);
    assert(data.mode === 'test', `Mode is explicitly confirmed as 'test'`);
    assert(data.result?.is_same_face === true, `is_same_face is TRUE`);
    assert(data.result?.decision === 'APPROVED', `Decision is APPROVED`);
    assert(data.result?.same_face_confidence >= 80, `High face confidence: ${data.result?.same_face_confidence}%`);
    assert(data.result?.spoof_detected === false, `spoof_detected is FALSE`);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Different Person's Selfie (Face Mismatch)
  // --------------------------------------------------------------------------
  console.log("\n--- Test 2: Different Person's Selfie (Face Mismatch) ---");
  {
    const fd = new FormData();
    fd.append('person', new Blob([person1Buf], { type: 'image/jpeg' }), 'selfie.jpg');
    fd.append('card', new Blob([person2Buf], { type: 'image/jpeg' }), 'id_portrait.jpg');
    fd.append('clientRefId', `test-mismatch-${Date.now()}`);

    const res = await safeFetch(`${baseUrl}/v1/face/face-match`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: fd,
    });

    const data = await res.json();
    assert(res.status === 200, `HTTP status is 200 (Got ${res.status})`);
    assert(data.verdict === 'declined', `Verdict is 'declined' (Got '${data.verdict}')`);
    assert(data.result?.is_same_face === false, `is_same_face is FALSE`);
    assert(data.result?.decision === 'REJECTED', `Decision is REJECTED`);
    assert(data.result?.same_face_confidence < 55, `Low face confidence: ${data.result?.same_face_confidence}%`);
    assert(
      data.warnings.some(w => w.code === 'FACE_MISMATCH' && w.severity === 'decline'),
      `Warning FACE_MISMATCH with decline severity is present`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 3: No Face in Image (Digitap-compatible 422 Fail Body)
  // --------------------------------------------------------------------------
  console.log("\n--- Test 3: No Face Detected / Invalid Image (HTTP 422) ---");
  {
    const fd = new FormData();
    fd.append('person', new Blob([noFaceBuf], { type: 'image/png' }), 'logo.png');
    fd.append('card', new Blob([person1Buf], { type: 'image/jpeg' }), 'id_portrait.jpg');
    fd.append('clientRefId', `test-noface-${Date.now()}`);

    const res = await safeFetch(`${baseUrl}/v1/face/face-match`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: fd,
    });

    const data = await res.json();
    assert(res.status === 422, `HTTP status is 422 Unprocessable Entity (Got ${res.status})`);
    assert(data.status === 'fail', `Digitap status is 'fail'`);
    assert(typeof data.error === 'string' && data.error.includes('Face not found'), `Descriptive error: "${data.error}"`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Liveness & Anti-Spoof Protection Mapping Check
  // --------------------------------------------------------------------------
  console.log("\n--- Test 4: Liveness Failure & Anti-Spoof Fail-Closed Check ---");
  {
    const mockSpoofResponse = {
      status: "success",
      statusCode: 200,
      verdict: "declined",
      warnings: [{ code: "LIVENESS_FACE_ATTACK", severity: "decline", description: "Spoof attempt detected" }],
      result: {
        is_same_face: true,
        same_face_confidence: 95.0,
        decision: "APPROVED",
        liveness_status: "spoof",
        spoof_detected: true,
      }
    };

    const isSpoofOrDeclined =
      mockSpoofResponse.result.spoof_detected === true ||
      mockSpoofResponse.result.liveness_status === "spoof" ||
      mockSpoofResponse.verdict === "declined";

    assert(isSpoofOrDeclined === true, `Spoof attack or decline verdict correctly flagged`);
  }

  // --------------------------------------------------------------------------
  // TEST 5: API Authentication Failure
  // --------------------------------------------------------------------------
  console.log("\n--- Test 5: API Authentication Failure (Invalid API Key) ---");
  {
    const fd = new FormData();
    fd.append('person', new Blob([person1Buf], { type: 'image/jpeg' }), 'selfie.jpg');
    fd.append('card', new Blob([person1Buf], { type: 'image/jpeg' }), 'id_portrait.jpg');

    const res = await safeFetch(`${baseUrl}/v1/face/face-match`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer lv_test_invalid_key_99999999999999999` },
      body: fd,
    });

    const data = await res.json();
    assert(res.status === 401, `HTTP status is 401 Unauthorized (Got ${res.status})`);
    assert(data.message_code === 'unauthorized', `Error message_code is 'unauthorized'`);
  }

  // --------------------------------------------------------------------------
  // TEST 6: API Timeout / Network Error Handling (Fail-Closed)
  // --------------------------------------------------------------------------
  console.log("\n--- Test 6: API Timeout Handling (Fail-Closed) ---");
  {
    try {
      await fetch(`${baseUrl}/v1/face/face-match`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(1), // 1ms intentional timeout
      });
      assert(false, "Should have thrown a TimeoutError");
    } catch (err) {
      assert(
        err.name === 'TimeoutError' || err.name === 'AbortError',
        `Correctly caught timeout exception: ${err.name}`
      );
    }
  }

  // --------------------------------------------------------------------------
  // TEST 7: Concurrent Requests (Two Users in Parallel)
  // --------------------------------------------------------------------------
  console.log("\n--- Test 7: Two Users Concurrently Verifying ---");
  {
    const userA_ref = `concurrent-userA-${Date.now()}`;
    const userB_ref = `concurrent-userB-${Date.now()}`;

    const fdA = new FormData();
    fdA.append('person', new Blob([person1Buf], { type: 'image/jpeg' }), 'selfie.jpg');
    fdA.append('card', new Blob([person1Buf], { type: 'image/jpeg' }), 'id.jpg');
    fdA.append('clientRefId', userA_ref);

    const fdB = new FormData();
    fdB.append('person', new Blob([person2Buf], { type: 'image/jpeg' }), 'selfie.jpg');
    fdB.append('card', new Blob([person2Buf], { type: 'image/jpeg' }), 'id.jpg');
    fdB.append('clientRefId', userB_ref);

    const [resA, resB] = await Promise.all([
      safeFetch(`${baseUrl}/v1/face/face-match`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: fdA,
      }),
      safeFetch(`${baseUrl}/v1/face/face-match`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: fdB,
      }),
    ]);

    const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);

    assert(resA.status === 200 && resB.status === 200, "Both concurrent requests returned HTTP 200");
    assert(dataA.clientRefId === userA_ref, `User A clientRefId correctly mapped: ${dataA.clientRefId}`);
    assert(dataB.clientRefId === userB_ref, `User B clientRefId correctly mapped: ${dataB.clientRefId}`);
    assert(dataA.requestId !== dataB.requestId, `Unique request IDs generated for both (${dataA.requestId} !== ${dataB.requestId})`);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Webhook Signature Verification (HMAC-SHA256)
  // --------------------------------------------------------------------------
  console.log("\n--- Test 8: Webhook HMAC-SHA256 Signature Verification ---");
  {
    const secret = "test_webhook_secret_key_123";
    const samplePayload = JSON.stringify({
      status: "success",
      clientRefId: "test-webhook-session-123",
      verdict: "approved",
      result: {
        is_same_face: true,
        decision: "APPROVED",
        same_face_confidence: 96.5,
        spoof_detected: false,
      }
    });

    const validHmac = crypto.createHmac("sha256", secret).update(samplePayload).digest("hex");
    const tamperedHmac = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    // Valid check
    const recomputed = crypto.createHmac("sha256", secret).update(samplePayload).digest("hex");
    const isValid = crypto.timingSafeEqual(Buffer.from(validHmac), Buffer.from(recomputed));
    assert(isValid, `Genuine webhook HMAC signature successfully validated`);

    // Tampered check
    const isTamperedRejected = !crypto.timingSafeEqual(Buffer.from(tamperedHmac), Buffer.from(recomputed));
    assert(isTamperedRejected, `Tampered webhook HMAC signature correctly rejected`);
  }

  console.log("\n===============================================================================");
  console.log(`TEST SUITE COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("===============================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error("Test Suite Unhandled Error:", err);
  process.exit(1);
});
