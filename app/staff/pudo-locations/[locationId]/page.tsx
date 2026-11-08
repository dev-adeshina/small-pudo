"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type CaptureMethod = "device" | "manual";

type Candidate = {
  locationId: string;
  name?: string;
  address?: string;
  registrationNote?: string;
  lifecycle?: "draft" | "submitted";
  geo?: {
    latitude?: number;
    longitude?: number;
    captureMethod?: CaptureMethod;
    accuracyMeters?: number;
  } | null;
};

export default function PudoLocationEditorPage() {
  const params = useParams<{ locationId: string }>();
  const locationId = params.locationId;
  const isNew = locationId === "new";
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [registrationNote, setRegistrationNote] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>("manual");
  const [accuracyMeters, setAccuracyMeters] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // if (!currentUser) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || isNew)
      return;

    let cancelled = false;

    async function loadCandidate() {
      setLoading(true);
      setError("");

      try {
        const token = await user!.getIdToken();
        const result = await fetch(
          `/api/staff/pudo-locations/${encodeURIComponent(locationId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        const data = await result.json();

        if (!result.ok) {
          throw new Error(data.error || "Unable to retrieve candidate.");
        }

        const item = data.candidate as Candidate;

        if (!cancelled) {
          setCandidate(item);
          setName(item.name ?? "");
          setAddress(item.address ?? "");
          setRegistrationNote(item.registrationNote ?? "");
          setLatitude(item.geo?.latitude?.toString() ?? "");
          setLongitude(item.geo?.longitude?.toString() ?? "");
          setCaptureMethod(item.geo?.captureMethod ?? "manual");
          setAccuracyMeters(item.geo?.accuracyMeters?.toString() ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to retrieve candidate.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCandidate();

    return () => {
      cancelled = true;
    };
  }, [user, locationId, isNew]);

  async function getToken() {
    if (!user) throw new Error("Please sign in again.");
    return user.getIdToken();
  }

  function buildPayload() {
    const hasLatitude = latitude.trim() !== "";
    const hasLongitude = longitude.trim() !== "";

    if (hasLatitude !== hasLongitude) {
      throw new Error("Enter both latitude and longitude, or leave both empty.");
    }

    const payload: Record<string, unknown> = {
      name,
      address,
      registrationNote,
    };

    if (hasLatitude && hasLongitude) {
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Latitude and longitude must be valid numbers.");
      }

      const geo: Record<string, unknown> = {
        latitude: lat,
        longitude: lng,
        captureMethod,
      };

      if (captureMethod === "device" && accuracyMeters.trim() !== "") {
        const accuracy = Number(accuracyMeters);

        if (!Number.isFinite(accuracy) || accuracy < 0) {
          throw new Error("Device accuracy must be a valid non-negative number.");
        }

        geo.accuracyMeters = accuracy;
      }

      payload.geo = geo;
    } else {
      payload.geo = null;
    }

    return payload;
  }

  async function saveDraft(): Promise<Candidate> {
    const token = await getToken();
    const payload = buildPayload();

    const endpoint = isNew
      ? "/api/staff/pudo-locations"
      : `/api/staff/pudo-locations/${encodeURIComponent(locationId)}`;

    const result = await fetch(endpoint, {
      method: isNew ? "POST" : "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await result.json();

    if (!result.ok) {
      throw new Error(data.error || "Unable to save candidate.");
    }

    return data.candidate as Candidate;
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const saved = await saveDraft();
      setCandidate(saved);
      setMessage("Draft saved successfully.");

      if (isNew && saved.locationId) {
        router.replace(`/staff/pudo-locations/${saved.locationId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save candidate.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      // Persist the latest form values before submitting.
      const saved = await saveDraft();

      if (!saved.locationId) {
        throw new Error("The saved candidate ID was not returned. Save again before submitting.");
      }

      const token = await getToken();
      const result = await fetch(
        `/api/staff/pudo-locations/${encodeURIComponent(saved.locationId)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || "Unable to submit candidate.");
      }

      setCandidate(data.candidate as Candidate);
      setMessage("Candidate submitted. It is awaiting the separate verification process.");

      if (isNew) {
        router.replace(`/staff/pudo-locations/${saved.locationId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit candidate.");
    } finally {
      setSaving(false);
    }
  }

  function captureDeviceLocation() {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("Device location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setCaptureMethod("device");
        setAccuracyMeters(position.coords.accuracy.toString());
        setMessage("Device coordinates captured. Save the draft to record them.");
      },
      (geoError) => {
        setError(`Unable to capture device location: ${geoError.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
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

  if (loading) {
    return <main className="admin-page"><p>Loading candidate…</p></main>;
  }

  if (!isNew && error && !candidate) {
    return (
      <main className="admin-page">
        <p className="cost-feedback" role="alert">{error}</p>
        <Link href="/staff/pudo-locations">Back to candidates</Link>
      </main>
    );
  }

  const isSubmitted = candidate?.lifecycle === "submitted";

  return (
    <main className="admin-page">
      <div className="admin-shell cost-admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-label">OPERATIONS / LOCATION REGISTRY</p>
            <h1 className="cost-page-heading">
              {isNew ? "Register PUDO candidate" : "PUDO candidate"}
            </h1>
            <p>
              {isSubmitted
                ? "This candidate has been submitted and is not yet verified or operational."
                : "Save an incomplete draft and return to complete it later."}
            </p>
          </div>

          <Link className="admin-action" href="/staff/pudo-locations">
            Back to candidates
          </Link>
        </header>

        {error && <p className="cost-feedback" role="alert">{error}</p>}
        {message && <p className="cost-feedback" role="status">{message}</p>}

        {isSubmitted && (
          <section className="cost-panel">
            <strong>Submitted — awaiting verification</strong>
            <p>
              Submission does not activate this location or make it available
              for customer selection or operations.
            </p>
          </section>
        )}

        <form className="cost-panel" onSubmit={handleSave}>
          <div className="cost-form-grid">
            <div className="cost-field">
              <label htmlFor="pudo-name">Location name</label>
              <input
                id="pudo-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSubmitted || saving}
                placeholder="Enter proposed location name"
              />
            </div>

            <div className="cost-field">
              <label htmlFor="pudo-address">Physical address</label>
              <textarea
                id="pudo-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                disabled={isSubmitted || saving}
                rows={3}
                placeholder="Enter the physical address"
              />
            </div>

            <div className="cost-field">
              <label htmlFor="pudo-note">Registration note</label>
              <textarea
                id="pudo-note"
                value={registrationNote}
                onChange={(event) => setRegistrationNote(event.target.value)}
                disabled={isSubmitted || saving}
                rows={3}
                placeholder="Optional notes about this candidate"
              />
            </div>
          </div>

          <hr />

          <div>
            <h2>Geographic coordinates</h2>
            <p>
              Coordinates use WGS84 decimal degrees. They do not establish
              that a location has been verified or approved.
            </p>

            <button
              className="admin-action"
              type="button"
              onClick={captureDeviceLocation}
              disabled={isSubmitted || saving}
            >
              Capture device location
            </button>
          </div>

          <div className="cost-form-grid">
            <div className="cost-field">
              <label htmlFor="pudo-latitude">Latitude</label>
              <input
                id="pudo-latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => {
                  setLatitude(event.target.value);
                  setCaptureMethod("manual");
                  setAccuracyMeters("");
                }}
                disabled={isSubmitted || saving}
                placeholder="e.g. 6.5244"
              />
            </div>

            <div className="cost-field">
              <label htmlFor="pudo-longitude">Longitude</label>
              <input
                id="pudo-longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => {
                  setLongitude(event.target.value);
                  setCaptureMethod("manual");
                  setAccuracyMeters("");
                }}
                disabled={isSubmitted || saving}
                placeholder="e.g. 3.3792"
              />
            </div>

            <div className="cost-field">
              <label htmlFor="pudo-capture-method">Capture method</label>
              <p id="pudo-capture-method">
                {!latitude.trim() || !longitude.trim()
                  ? "Not captured"
                  : captureMethod === "device"
                    ? "Device (browser geolocation)"
                    : "Manual"}
              </p>
            </div>

            <div className="cost-field">
              <label htmlFor="pudo-accuracy">Device accuracy (metres, optional)</label>
              <input
                id="pudo-accuracy"
                type="number"
                min="0"
                step="any"
                value={accuracyMeters}
                onChange={(event) => setAccuracyMeters(event.target.value)}
                disabled={isSubmitted || saving}
                placeholder="Device-reported accuracy"
              />
            </div>
          </div>

          {!isSubmitted && (
            <div className="cost-form-grid">
              <button
                className="cost-primary-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save draft"}
              </button>

              <button
                className="admin-action"
                type="button"
                onClick={handleSubmit}
                disabled={saving || isNew}
              >
                {saving ? "Processing…" : "Submit candidate"}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}