"use client";

import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Send,
  Mail,
  User,
  Phone,
  MessageSquare,
  Zap,
  Loader2,
} from "lucide-react";
import { NotificationPopup } from "./NotificationPopup";

export const ConnectSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const SERVICE_ID =
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_t9dwwep";
  const TEMPLATE_ID =
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_lecnff3";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim() || !cleanPhone) {
      setStatus({
        type: "error",
        message: "Please fill in all mandatory fields including your 10-digit phone number.",
      });
      return;
    }

    if (cleanPhone.length !== 10) {
      setStatus({
        type: "error",
        message: "Please enter a valid 10-digit phone number.",
      });
      return;
    }

    setIsSubmitting(true);

    const templateParams = {
      from_name: formData.name.trim(),
      name: formData.name.trim(),
      from_email: formData.email.trim(),
      email: formData.email.trim(),
      reply_to: formData.email.trim(),
      phone: formData.phone.trim() || "Not specified",
      subject: formData.subject,
      message: formData.message.trim(),
    };

    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

    try {
      if (publicKey) {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, publicKey);
      } else {
        // Fallback to backend route /api/connect
        const res = await fetch("/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to deliver message.");
        }
      }

      setStatus({
        type: "success",
        message: "Your message has been sent successfully! Our team will get back to you shortly.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err: any) {
      console.error("[Connect] Error:", err);
      setStatus({
        type: "error",
        message:
          err?.text ||
          err?.message ||
          "Could not send email right now. Please try again or reach out to support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="connect"
      className="scroll-mt-28 py-16 sm:py-24 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-emerald-950/70"
    >
      {/* Toast popup */}
      <NotificationPopup
        show={Boolean(status)}
        type={status?.type || "success"}
        message={status?.message || ""}
        onClose={() => setStatus(null)}
      />

      {/* ── BIG OUTER BOX ── */}
      <div className="w-full bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-emerald-500/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl space-y-8">
        
        {/* Header INSIDE the big box */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800/60 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>DIRECT CONNECT • REACH OUR TEAM</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Let’s Connect &amp; Explore Together
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Have an inquiry, partnership proposal, or travel question? Send a message directly to our team.
          </p>
        </div>

        {/* ── CLEAN FULL-WIDTH MESSAGE FORM WITH DIRECT CHANNEL HEADER ── */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="bg-white dark:bg-[#0c1410] border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-md">
            
            {/* Header Above the Inputs */}
            <div className="mb-6 pb-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">
                    <Mail className="w-4 h-4" />
                  </span>
                  Send Us a Message
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We love hearing from travelers, activity organizers, and partners. Messages arrive directly in our inbox.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                        })
                      }
                      placeholder="10-digit mobile number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Subject / Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                  >
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="General Inquiry">General Inquiry</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Partnership & Sponsorship">Partnership &amp; Sponsorship</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Travel Companion Feedback">Travel Companion Feedback</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Safety & Verification Support">Safety &amp; Verification Support</option>
                    <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="Feature Request">Feature Request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="How can we help? Share your trip ideas, questions, or collaboration details..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full font-bold text-xs sm:text-sm text-slate-900 bg-gradient-to-r from-emerald-400 via-emerald-300 to-white hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-50 border border-emerald-400/50 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transmitting Message...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

