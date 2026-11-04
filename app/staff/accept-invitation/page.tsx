"use client";
import Link from "next/link";
import { Suspense,useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleAuthProvider,createUserWithEmailAndPassword,reload,sendEmailVerification,signInWithEmailAndPassword,signInWithPopup,signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
function AcceptStaffInvitationContent(){
 const token=useSearchParams().get("token")??"";
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[mode,setMode]=useState<"register"|"sign-in">("register"),[message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function run(action:()=>Promise<void>){setBusy(true);setError("");setMessage("");try{await action();}catch(cause){setError(cause instanceof Error?cause.message:"The request could not be completed.");}finally{setBusy(false);}}
 async function authenticate(){
  if(!token)throw new Error("This invitation link is missing its token.");
  if(mode==="register"){const credential=await createUserWithEmailAndPassword(auth,email.trim(),password);await sendEmailVerification(credential.user);await signOut(auth);setMessage("Account created. Verify the email address from your inbox, then return and sign in to activate staff access.");}
  else{await signInWithEmailAndPassword(auth,email.trim(),password);setMessage("Signed in. If your email is verified, activate your invitation below.");}
 }
 async function googleSignIn(){if(!token)throw new Error("This invitation link is missing its token.");await signInWithPopup(auth,new GoogleAuthProvider());setMessage("Google sign-in completed. Activate your invitation below.");}
 async function refreshVerification(){if(!auth.currentUser)throw new Error("Sign in with the invited account first.");await reload(auth.currentUser);setMessage(auth.currentUser.emailVerified?"Email verified. You can activate staff access.":"Email is not verified yet. Open the verification email and try again.");}
 async function activate(){
  const user=auth.currentUser;if(!user)throw new Error("Sign in with the invited account first.");await reload(user);if(!user.emailVerified)throw new Error("Verify your email address before activating staff access.");
  const response=await fetch("/api/staff/invitations/activate",{method:"POST",headers:{Authorization:`Bearer ${await user.getIdToken(true)}`,"Content-Type":"application/json"},body:JSON.stringify({token})});
  const result=await response.json();if(!response.ok)throw new Error(result.error??"Activation failed.");setMessage(result.message);
 }
 return <main className="admin-page"><div className="admin-shell cost-admin-shell"><div className="cost-page-topline"><Link href="/" className="cost-secondary-button">VeriLyft home</Link><span className="section-label">STAFF INVITATION</span></div>
 <div className="cost-page-heading"><div><h1>Join the <em>team.</em></h1><p>Use the email address that received this invitation. A verified matching email is required. Activation does not automatically assign operational permissions.</p></div></div>
 {!token&&<div className="cost-feedback cost-feedback-error">Invitation token is missing. Open the complete link from your invitation email.</div>}{message&&<div className="cost-feedback cost-feedback-success">{message}</div>}{error&&<div className="cost-feedback cost-feedback-error">{error}</div>}
 <section className="cost-panel"><div className="cost-panel-heading"><h2>{mode==="register"?"Create your staff account":"Sign in to activate"}</h2></div>
 <form className="cost-form-grid" onSubmit={event=>{event.preventDefault();void run(authenticate);}}>
  <label className="cost-field cost-field-wide">Invited email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
  <label className="cost-field cost-field-wide">Password<input type="password" required minLength={6} autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)}/></label>
  <div className="cost-form-actions cost-field-wide"><button className="cost-primary-button" type="submit" disabled={busy||!token}>{mode==="register"?"Create account and verify email":"Sign in"}</button><button className="cost-secondary-button" type="button" onClick={()=>setMode(mode==="register"?"sign-in":"register")}>{mode==="register"?"I already have an account":"Create a new account"}</button></div>
 </form>
 <div className="cost-form-actions"><button className="cost-secondary-button" type="button" disabled={busy||!token} onClick={()=>void run(googleSignIn)}>Continue with Google</button><button className="cost-secondary-button" type="button" disabled={busy||!auth.currentUser} onClick={()=>void run(refreshVerification)}>Refresh email verification</button><button className="cost-primary-button" type="button" disabled={busy||!auth.currentUser||!token} onClick={()=>void run(activate)}>Activate staff access</button></div>
 </section></div></main>;
}

export default function AcceptStaffInvitationPage(){
 return <Suspense fallback={<main className="admin-page"><div className="admin-shell cost-admin-shell">Loading invitation…</div></main>}><AcceptStaffInvitationContent/></Suspense>;
}
