"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getList, upsertList } from "@/lib/storage";
import { computeNarrowingPlan, getRoleName } from "@/lib/planner";
import { getSession, isPremium } from "@/lib/auth";
import { useSession } from "next-auth/react";
import UpsellModal from "@/components/UpsellModal";
import type { ChoosieList } from "@/components/ListForm";
import ProcessSection from "@/components/ProcessSection";

export default function VirtualInvitesPage() {
    // Reset invitees and notes, and clear event.invitees from the list
    function handleReset() {
      if (!list) return;
      if (!window.confirm('Reset all invitees and links? This will clear all narrowing links and allow you to start over.')) return;
      const updated: ChoosieList = {
        ...list,
        event: {
          export default function VirtualInvitesPage() {
            return (
              <main className="min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
                  <h1 className="text-3xl font-bold mb-4">Narrow Virtually (coming soon)</h1>
                  <p className="text-lg text-zinc-700 mb-6">This feature is coming soon!</p>
                  <p className="text-zinc-500 mb-8">We’re working hard to bring virtual narrowing to Choosie. Stay tuned for updates.</p>
                  <button
                    onClick={() => window.history.back()}
                    className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </main>
            );
          }
              className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back to list
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveAndSend}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Preparing…" : "Send email invites"}
            </button>
            <button
              onClick={() => {
                if (!list) return;
                export default function VirtualInvitesPage() {
                  return (
                    <main className="min-h-screen flex items-center justify-center">
                      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
                        <h1 className="text-3xl font-bold mb-4">Narrow Virtually (coming soon)</h1>
                        <p className="text-lg text-zinc-700 mb-6">This feature is coming soon!</p>
                        <p className="text-zinc-500 mb-8">We’re working hard to bring virtual narrowing to Choosie. Stay tuned for updates.</p>
                        <button
                          onClick={() => window.history.back()}
                          className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </main>
                  );
                }
