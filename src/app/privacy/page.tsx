import React from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  UserCheck,
  Bell,
  Scale,
  Mail,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Travally",
  description:
    "Travally's Comprehensive Privacy Policy. Learn how we protect your personal data, identity verification, ephemeral content, real-time geolocation safety, and user rights under the DPDP Act 2023 and global standards.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 23, 2026";
  const effectiveDate = "November 23, 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1310] text-slate-900 dark:text-slate-100 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link & Header */}
        <div className="space-y-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Registration</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-emerald-950/70 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-200 dark:border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Legally Binding Privacy & Data Protection Policy</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Travally Privacy Policy
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Effective: <span className="font-semibold text-slate-700 dark:text-slate-300">{effectiveDate}</span> • Last Updated: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastUpdated}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/safety"
                className="px-4 py-2 rounded-2xl bg-white dark:bg-[#14201a] border border-slate-200 dark:border-emerald-950/80 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 shadow-2xs transition"
              >
                Safety Center
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>

        {/* Executive Summary Card (Strategist & Lawyer Note) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
            <Scale className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-black tracking-tight">
              Executive Privacy Summary — Our Uncompromising Commitments
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            At <strong>Travally</strong>, privacy is not a compliance afterthought; it is our core architectural foundation. We believe genuine real-world companionship thrives only when individuals retain total sovereignty over their personal information. Here is our plain-language promise to you:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-white/80 dark:bg-[#111c16]/80 border border-emerald-900/10 dark:border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Zero Data Monetization</strong>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">We never sell, rent, broker, or trade your personal data or phone number to data aggregators or advertisers.</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-white/80 dark:bg-[#111c16]/80 border border-emerald-900/10 dark:border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Ephemeral Content Purging</strong>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Find Me beacons permanently self-destruct upon countdown expiry. Group event chats auto-delete 7 days post-event.</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-white/80 dark:bg-[#111c16]/80 border border-emerald-900/10 dark:border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Strict Contact Privacy</strong>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Your phone number, street address, and exact location are shielded from public discovery feeds.</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-white/80 dark:bg-[#111c16]/80 border border-emerald-900/10 dark:border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white">Total Self-Service Control</strong>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Download your entire JSON profile data or permanently delete your account with immediate, irreversible effect in Settings.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Legal Clauses */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">1</span>
              <span>Information We Collect and Why</span>
            </h3>
            <p>
              Under India&apos;s <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the EU General Data Protection Regulation (GDPR), and applicable privacy statutes, Travally operates as a Data Fiduciary / Controller. We collect data solely to provide, verify, and safeguard your companion discovery experience:
            </p>
            <ul className="space-y-2 list-disc list-inside pl-2 text-xs">
              <li>
                <strong className="text-slate-900 dark:text-white">Account Registration:</strong> Name / Display Name, Email address, Encrypted Password hash (bcrypt, 10 salt rounds), 10-digit Mobile Phone Number, Residential Pincode, City, State/Region, Date of Birth (Age calculation), and Gender identity.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Profile &amp; Lifestyle Attributes:</strong> Bio, Interests, Preferred Activities, Dietary preferences, and Lifestyle badges (Smoking &amp; Drinking habits). These enable mutual compatibility matching and are publicly visible unless toggled otherwise in Settings.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">User-Generated Social Content:</strong> Activity postings, travel itineraries, community feed posts, hangout photos, comments, reposts, and direct messages.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Device &amp; Telemetry Data:</strong> IP address, device user agent, session timestamps, and encrypted HttpOnly session cookies utilized solely for session persistence and fraud prevention.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">2</span>
              <span>Identity &amp; Biometric Liveliness Verification Safeguards</span>
            </h3>
            <p>
              To protect our community against impersonation, catfishing, and bad actors, Travally offers voluntary government ID and live facial selfie liveliness verification through ISO-27001 and SOC-2 compliant verification partners (including <strong>Neetix</strong> and <strong>HyperVerge</strong>):
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#15201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <UserCheck className="w-4 h-4" />
                <span>Explicit Biometric Consent &amp; Zero Raw Storage</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                1. Facial selfie frames are processed ephemerally in volatile memory strictly to calculate a mathematical 3D liveliness score and face-match index.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                2. Travally <strong>never</strong> stores raw facial geometry, biometric templates, or unmasked national identification numbers on our persistent application servers.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                3. Once verification succeeds or fails, verification sessions are sealed, and our database retains only a cryptographic status boolean (<code className="text-emerald-600 dark:text-emerald-400 font-mono">isVerified: true</code>) and a hashed session reference.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">3</span>
              <span>Real-Time Geolocation &amp; Live Safety Tracking</span>
            </h3>
            <p>
              Travally does not perform continuous ambient location tracking in the background. Geolocation is invoked strictly under user-directed actions:
            </p>
            <ul className="space-y-2 list-disc list-inside pl-2 text-xs">
              <li>
                <strong className="text-slate-900 dark:text-white">City &amp; Postal Area Matching:</strong> Your postal PIN code is converted to a municipal city/neighborhood to display localized companion opportunities without exposing your street address.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Emergency Live Companion Sharing (<code className="font-mono text-emerald-600">/safety/live/[token]</code>):</strong> When you initiate a temporary live location link, encrypted coordinates are broadcasted only to holders of your cryptographic URL token. You may revoke access at any second. Once expired or concluded, coordinate telemetry is irreversibly purged from our database.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">4</span>
              <span>Ephemeral Content &amp; Automatic Hard Deletion</span>
            </h3>
            <p>
              Digital footprints should not last forever. Travally implements automated database lifecycle routines:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Find Me Beacons (12h - 48h)</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Find Me clue cards automatically expire according to the user-selected timer. Upon expiration, all related records and saved cards across other accounts are hard-deleted.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#16201b] border border-slate-200/70 dark:border-emerald-950/60 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Post-Event Chat Purging (7 Days)</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Activity group chats and mutual event room transcripts are systematically hard-purged 7 days following the event date, leaving no residual logs on disk.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">5</span>
              <span>Direct Messaging &amp; Confidentiality</span>
            </h3>
            <p>
              Travally 1-to-1 direct chats are private communications. We do not inspect message contents to construct advertising dossiers or commercial profiles. Access to communications is strictly restricted to sender and recipient participants, protected by cryptographic session tokens and TLS 1.3 in-transit encryption.
            </p>
          </section>

          {/* Section 6 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">6</span>
              <span>Your Statutory Rights (DPDP Act, GDPR, CCPA)</span>
            </h3>
            <p>
              Regardless of your geographic location, Travally guarantees universal user rights:
            </p>
            <ul className="space-y-1.5 list-disc list-inside pl-2 text-xs">
              <li><strong className="text-slate-900 dark:text-white">Right to Access &amp; Portability:</strong> Export a machine-readable JSON copy of your entire account data directly from Settings at any time.</li>
              <li><strong className="text-slate-900 dark:text-white">Right to Correction &amp; Rectification:</strong> Edit your profile details, habits, bio, and social connections instantly.</li>
              <li><strong className="text-slate-900 dark:text-white">Right to Erasure (Right to be Forgotten):</strong> Permanently delete your account. All associated profile data, organized events, comments, and messages will be permanently eliminated.</li>
              <li><strong className="text-slate-900 dark:text-white">Right to Withdraw Consent:</strong> You can withdraw consent for public discovery or optional verification badges at any time.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">7</span>
              <span>Strict 18+ Age Restriction</span>
            </h3>
            <p>
              Travally is exclusively intended for adults aged 18 and older. We do not knowingly solicit or collect personal information from individuals under 18 years of age. Accounts found to be held by minors are terminated immediately.
            </p>
          </section>

          {/* Section 8 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111815] border border-slate-200/90 dark:border-emerald-950/70 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-xs font-black">8</span>
              <span>Data Protection Officer &amp; Grievance Redressal</span>
            </h3>
            <p>
              In compliance with Section 10 of India&apos;s DPDP Act, 2023, Travally has designated a dedicated Grievance Officer and Data Protection Officer (DPO) to handle inquiries, grievances, and exercise of data subject rights:
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
              <p><strong className="text-slate-900 dark:text-white">Grievance Redressal Officer:</strong> Data Protection Office, Travally</p>
              <p><strong className="text-slate-900 dark:text-white">Official Privacy Email:</strong> <a href="mailto:privacy@travally.app" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">privacy@travally.app</a></p>
              <p><strong className="text-slate-900 dark:text-white">Support &amp; Security Desk:</strong> <a href="mailto:support@travally.app" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">support@travally.app</a></p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Statutory Grievance Acknowledgment: Within 24 hours. Full Resolution Timeline: Within 30 days as mandated by applicable law.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-slate-200 dark:border-emerald-950/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Travally Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/register" className="hover:text-emerald-600 font-semibold transition">
              Create Account
            </Link>
            <Link href="/login" className="hover:text-emerald-600 font-semibold transition">
              Sign In
            </Link>
            <Link href="/safety" className="hover:text-emerald-600 font-semibold transition">
              Safety Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
