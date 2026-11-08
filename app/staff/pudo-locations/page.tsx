"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Candidate = {
    locationId: string;
    name?: string;
    address?: string;
    lifecycle?: "draft" | "submitted";
    updatedAt?: unknown;
};

export default function PudoLocationsPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<User | null>(null);

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
                                                {candidate.lifecycle === "submitted" ? "Submitted" : "Draft"}
                                            </strong>
                                        </p>
                                    </div>

                                    <Link
                                        className="admin-action"
                                        href={`/staff/pudo-locations/${candidate.locationId}`}
                                    >
                                        {candidate.lifecycle === "submitted" ? "View candidate" : "Open draft"}
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
