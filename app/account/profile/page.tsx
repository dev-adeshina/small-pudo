"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, type User } from "firebase/auth";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    UserRound,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOutCustomer } from "@/lib/customer-auth";

import Image from "next/image";

export default function CustomerProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [profileName, setProfileName] = useState("");
    const [profilePhone, setProfilePhone] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileMessage, setProfileMessage] = useState("");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (!currentUser) {
                router.replace("/account/sign-in");
                return;
            }

            if (!currentUser.emailVerified) {
                try {
                    await signOutCustomer();
                } finally {
                    router.replace("/account/sign-in");
                }

                return;
            }

            setUser(currentUser);
            setCheckingAuth(false);
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        async function loadProfile() {
            setProfileLoading(true);
            setProfileError("");

            try {
                const token = await user!.getIdToken();

                const response = await fetch("/api/account/profile", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load your profile.");
                }

                const profile = data.profile ?? data;

                if (!cancelled) {
                    setProfileName(profile.displayName ?? user!.displayName ?? "");
                    setProfilePhone(profile.phone ?? "");
                }
            } catch (err) {
                if (!cancelled) {
                    setProfileError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load your profile."
                    );
                }
            } finally {
                if (!cancelled) {
                    setProfileLoading(false);
                }
            }
        }

        void loadProfile();

        return () => {
            cancelled = true;
        };
    }, [user]);

    async function handleSaveProfile(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!user) return;

        setProfileError("");
        setProfileMessage("");
        setProfileSaving(true);

        try {
            const displayName = profileName.trim();
            const phone = profilePhone.trim();

            if (displayName.length < 2 || displayName.length > 80) {
                throw new Error("Your name must be between 2 and 80 characters.");
            }

            if (phone && !/^[+\d\s().-]+$/.test(phone)) {
                throw new Error("Please enter a valid phone number.");
            }

            if (phone && phone.replace(/\D/g, "").length < 7) {
                throw new Error("Your phone number must contain at least 7 digits.");
            }

            if (phone.length > 25) {
                throw new Error("Your phone number cannot exceed 25 characters.");
            }

            const token = await user.getIdToken();

            const response = await fetch("/api/account/profile", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    displayName,
                    phone,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to save your profile.");
            }

            const profile = data.profile ?? data;
            const savedName = profile.displayName ?? displayName;
            const savedPhone = profile.phone ?? phone;

            await updateProfile(user, {
                displayName: savedName,
            });

            setProfileName(savedName);
            setProfilePhone(savedPhone);
            setProfileMessage("Your profile has been updated.");
        } catch (err) {
            setProfileError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while saving your profile."
            );
        } finally {
            setProfileSaving(false);
        }
    }

    if (checkingAuth || !user) {
        return (
            <main className="customer-loading">
                <span>Checking your account...</span>
            </main>
        );
    }

    //   return (
    //     <main className="customer-dashboard">
    //       <div className="customer-dashboard-header">
    //         <div>
    //           <span className="section-label">ACCOUNT SETTINGS</span>
    //           <h1>My profile</h1>
    //           <p>Manage your personal and contact information.</p>
    //         </div>

    //         <Link href="/account" className="customer-action">
    //           <ArrowLeft size={17} />
    //           Back to dashboard
    //         </Link>
    //       </div>

    //       <section className="customer-panel customer-profile-panel">
    //         <div className="customer-panel-heading">
    //           <div>
    //             <span className="section-label">PERSONAL DETAILS</span>
    //             <h2>Profile information</h2>
    //             <p className="customer-panel-description">
    //               Keep your contact details up to date.
    //             </p>
    //           </div>

    //           <UserRound size={22} />
    //         </div>

    //         {profileLoading ? (
    //           <div className="customer-state">
    //             <UserRound size={24} />
    //             <p>Loading your profile...</p>
    //           </div>
    //         ) : (
    //           <form
    //             className="customer-profile-form"
    //             onSubmit={handleSaveProfile}
    //           >
    //             <div className="customer-profile-fields">
    //               <label className="customer-profile-field">
    //                 <span>Full name</span>
    //                 <input
    //                   type="text"
    //                   name="displayName"
    //                   value={profileName}
    //                   onChange={(event) => {
    //                     setProfileName(event.target.value);
    //                     setProfileMessage("");
    //                   }}
    //                   minLength={2}
    //                   maxLength={80}
    //                   autoComplete="name"
    //                   required
    //                   disabled={profileSaving}
    //                 />
    //               </label>

    //               <label className="customer-profile-field">
    //                 <span>Phone number</span>
    //                 <input
    //                   type="tel"
    //                   name="phone"
    //                   value={profilePhone}
    //                   onChange={(event) => {
    //                     setProfilePhone(event.target.value);
    //                     setProfileMessage("");
    //                   }}
    //                   maxLength={25}
    //                   autoComplete="tel"
    //                   placeholder="Enter your phone number"
    //                   disabled={profileSaving}
    //                 />
    //                 <small>
    //                   Optional. Include your country code if applicable.
    //                 </small>
    //               </label>

    //               <label className="customer-profile-field">
    //                 <span>Email address</span>
    //                 <input
    //                   type="email"
    //                   value={user.email ?? ""}
    //                   autoComplete="email"
    //                   readOnly
    //                   disabled
    //                 />
    //                 <small>
    //                   Your verified email address cannot be changed here.
    //                 </small>
    //               </label>
    //             </div>

    //             {profileError && (
    //               <p className="customer-error" role="alert">
    //                 {profileError}
    //               </p>
    //             )}

    //             {profileMessage && (
    //               <p className="customer-profile-success" role="status">
    //                 <CheckCircle2 size={17} />
    //                 {profileMessage}
    //               </p>
    //             )}

    //             <button
    //               type="submit"
    //               className="customer-primary-action customer-profile-save"
    //               disabled={profileSaving}
    //             >
    //               {profileSaving ? "Saving changes..." : "Save changes"}
    //               {!profileSaving && <ArrowRight size={16} />}
    //             </button>
    //           </form>
    //         )}
    //       </section>
    //     </main>
    //   );

    return (
        <main className="customer-page">
            <header className="customer-header">
                <Link href="/" className="customer-logo" aria-label="VeriLyft home">
                    <Image
                        src="/logo.svg"
                        alt="VeriLyft"
                        width={150}
                        height={40}
                        priority
                        style={{ width: "auto", height: "auto" }}
                    />
                </Link>

                <div className="customer-header-right">
                    <div className="customer-identity">
                        <span className="customer-avatar">
                            <UserRound size={17} />
                        </span>

                        <span className="customer-email">{user.email}</span>
                    </div>

                    <button
                        type="button"
                        className="customer-logout"
                        onClick={async () => {
                            await signOutCustomer();
                            router.replace("/account/sign-in");
                        }}
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <ArrowLeft size={17} />
                    </button>
                </div>
            </header>

            <div className="customer-shell">
                <section className="customer-welcome">
                    <div>
                        <span className="eyebrow">VERILYFT / MY ACCOUNT</span>

                        <h1>
                            My
                            <br />
                            <em>profile.</em>
                        </h1>

                        <p>
                            Manage your personal information and keep your contact details
                            up to date.
                        </p>

                        <Link href="/account" className="customer-primary-action">
                            <ArrowLeft size={17} />
                            Back to dashboard
                        </Link>
                    </div>

                    <aside className="customer-welcome-note">
                        <span className="customer-note-icon">
                            <UserRound size={23} />
                        </span>

                        <strong>Your personal details</strong>

                        <p>
                            Keep your name and phone number up to date for your account
                            and orders.
                        </p>

                        <span className="customer-verified-label">
                            <CheckCircle2 size={15} />
                            VERIFIED ACCOUNT
                        </span>
                    </aside>
                </section>

                <section className="customer-panel customer-profile-panel">
                    <div className="customer-panel-heading">
                        <div>
                            <span className="section-label">ACCOUNT SETTINGS</span>
                            <h2>Profile information</h2>
                            <p className="customer-panel-description">
                                Update your personal and contact information.
                            </p>
                        </div>

                        <UserRound size={22} />
                    </div>

                    {profileLoading ? (
                        <div className="customer-state">
                            <UserRound size={24} />
                            <p>Loading your profile...</p>
                        </div>
                    ) : (
                        <form
                            className="customer-profile-form"
                            onSubmit={handleSaveProfile}
                        >
                            <div className="customer-profile-fields">
                                <label className="customer-profile-field">
                                    <span>Full name</span>

                                    <input
                                        type="text"
                                        name="displayName"
                                        value={profileName}
                                        onChange={(event) => {
                                            setProfileName(event.target.value);
                                            setProfileMessage("");
                                        }}
                                        minLength={2}
                                        maxLength={80}
                                        autoComplete="name"
                                        required
                                        disabled={profileSaving}
                                    />
                                </label>

                                <label className="customer-profile-field">
                                    <span>Phone number</span>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profilePhone}
                                        onChange={(event) => {
                                            setProfilePhone(event.target.value);
                                            setProfileMessage("");
                                        }}
                                        maxLength={25}
                                        autoComplete="tel"
                                        placeholder="Enter your phone number"
                                        disabled={profileSaving}
                                    />

                                    <small>
                                        Optional. Include your country code if applicable.
                                    </small>
                                </label>

                                <label className="customer-profile-field">
                                    <span>Email address</span>

                                    <input
                                        type="email"
                                        value={user.email ?? ""}
                                        autoComplete="email"
                                        readOnly
                                        disabled
                                    />

                                    <small>
                                        Your verified email address cannot be changed here.
                                    </small>
                                </label>
                            </div>

                            {profileError && (
                                <p className="customer-error" role="alert">
                                    {profileError}
                                </p>
                            )}

                            {profileMessage && (
                                <p className="customer-profile-success" role="status">
                                    <CheckCircle2 size={17} />
                                    {profileMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="customer-primary-action customer-profile-save"
                                disabled={profileSaving}
                            >
                                {profileSaving ? "Saving changes..." : "Save changes"}

                                {!profileSaving && <ArrowRight size={16} />}
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </main>
    );
}