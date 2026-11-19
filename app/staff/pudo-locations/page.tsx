"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Candidate = {
    locationId: string;
    name?: string;
    address?: string;
    lifecycle?: "draft" | "submitted" | "active";
    updatedAt?: unknown;
};

export default function PudoLocationsPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
            }
        });
    }, []);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        async function loadCandidates() {
            setLoading(true);
            setError("");

            try {
                const token = await user!.getIdToken();
                const result = await fetch("/api/staff/pudo-locations", {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });

                const data = await result.json();

                if (!result.ok) {
                    throw new Error(data.error || "Unable to load candidates.");
                }

                if (!cancelled) {
                    setCandidates(data.candidates ?? []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Unable to load candidates.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadCandidates();

        return () => {
            cancelled = true;
        };
    }, [user]);

    async function handleDelete(candidate: Candidate) {
        const label = candidate.name || "this PUDO candidate";
        const confirmed = window.confirm(
            `Remove ${label}? It will disappear from the candidate registry. Its verification and audit history will be retained. Active locations cannot be removed.`,
        );
        if (!confirmed || !user) return;

        setDeletingId(candidate.locationId);
        setError("");

        try {
            const token = await user.getIdToken();
            const result = await fetch(
                `/api/staff/pudo-locations/${encodeURIComponent(candidate.locationId)}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                },
            );
            const data = await result.json();
            if (!result.ok) {
                throw new Error(data.error || "Unable to remove candidate.");
            }
            setCandidates((current) =>
                current.filter((item) => item.locationId !== candidate.locationId),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to remove candidate.");
        } finally {
            setDeletingId(null);
        }
    }

    if (!user && loading) {
        return <main className="admin-page"><p>Loading staff session…</p></main>;
    }

    if (!user) {
        return (
            <main className="admin-page">
                <p>Please sign in through the staff workspace to continue.</p>
                <Link href="/staff/sign-in">Staff sign in</Link>
            </main>
        );
    }

    return (
        <main className="admin-page">
            <div className="admin-shell cost-admin-shell">
                <header className="admin-header">
                    <div>
                        <p className="section-label">OPERATIONS / LOCATION REGISTRY</p>
                        <h1 className="cost-page-heading">PUDO location candidates</h1>
                        <p>Register and maintain proposed PUDO locations.</p>
                    </div>
                    <Link className="admin-action" href="/staff/pudo-locations/new">
                        Register a location
                    </Link>
                </header>

                <section className="cost-panel">
                    <div className="cost-page-topline">
                        <h2>Registered candidates</h2>
                        <span>{candidates.length} records</span>
                    </div>

                    {loading && <p>Loading candidates…</p>}

                    {error && <p className="cost-feedback" role="alert">{error}</p>}

                    {!loading && !error && candidates.length === 0 && (
                        <p>No PUDO candidates have been registered yet.</p>
                    )}

                    {!loading && candidates.length > 0 && (
                        <div className="cost-form-grid">
                            {candidates.map((candidate) => (
                                <article className="cost-panel" key={candidate.locationId}>
                                    <div>
                                        <h3>{candidate.name || "Untitled location"}</h3>
                                        <p>{candidate.address || "Address not yet provided"}</p>
                                        <p>
                                            Status:{" "}
                                            <strong>
                                                {candidate.lifecycle === "submitted" ? "Submitted" : candidate.lifecycle === "active" ? "Active" : "Draft"}
                                            </strong>
                                        </p>
                                    </div>

                                    <div className="cost-form-grid">
                                        <Link
                                            className="admin-action"
                                            href={`/staff/pudo-locations/${candidate.locationId}`}
                                        >
                                            {candidate.lifecycle === "submitted" ? "View candidate" : "Open draft"}
                                        </Link>
                                        {candidate.lifecycle !== "active" && (
                                            <button
                                                className="admin-action"
                                                type="button"
                                                onClick={() => void handleDelete(candidate)}
                                                disabled={deletingId !== null}
                                                aria-label={`Delete ${candidate.name || "PUDO candidate"}`}
                                            >
                                                {deletingId === candidate.locationId ? "Removing…" : "Delete record"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
