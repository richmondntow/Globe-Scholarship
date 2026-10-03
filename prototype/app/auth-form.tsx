'use client';
import {useState,type FormEvent} from 'react';
import {Globe2,Mail,LockKeyhole,UserRound,Eye,EyeOff,LoaderCircle,ShieldCheck,Bookmark,Search,Check} from 'lucide-react';
export default function AuthForm({mode}:{mode:'login'|'signup'}){
 const signup=mode==='signup';
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;setError('');
  if(signup&&password!==confirm){setError('Your passwords do not match.');return;}
  setBusy(true);
  try{
   const r=await fetch('/api/auth/'+(signup?'sign-up/email':'sign-in/email'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({email:email.trim().toLowerCase(),password,...(signup?{name:name.trim()}:{})})});
   const data=await r.json() as {user?:{id:string}};
   if(!r.ok){setError(r.status===429?'Too many attempts. Please wait a minute and try again.':r.status>=500?'Account access is temporarily unavailable. Please try again.':signup?'Could not create an account. Check your details, or log in if you already have an account.':'The email or password is incorrect. Please try again.');return;}
   if(!data.user){setError('Account access could not be confirmed. Please try again.');return;}
   window.location.assign('/');
  }catch{setError('Could not connect. Check your connection and try again.');}finally{setBusy(false);}
 }
 return <div className="auth-shell">
  <header className="auth-header"><a className="brand" href="/login"><span className="brand-icon"><Globe2 size={23}/></span><span>GlobeScholarship<span className="brand-ai">AI</span></span></a><div><span>{signup?'Already have an account?':'New here?'}</span><a href={signup?'/login':'/signup'}>{signup?'Log in':'Create an account'}</a></div></header>
  <main className="auth-layout">
   <aside className="auth-story"><span className="eyebrow">YOUR SCHOLARSHIP JOURNEY</span><h1>A world of possibility.<br/><span>A place to begin.</span></h1><p>Find scholarships that could shape your next chapter.</p><div className="auth-globe-symbol" aria-hidden="true"><Globe2 strokeWidth={.65}/></div><ul><li><Globe2 size={20}/><span>Explore study destinations around the world</span></li><li><Search size={20}/><span>Search opportunities in your own words</span></li><li><Bookmark size={20}/><span>Keep your saved scholarships in one place</span></li></ul><p className="auth-story-footer">Your opportunities. Your account. Your next chapter.</p></aside>
   <section className="auth-form-panel"><div className="auth-form-wrap"><span className="section-eyebrow">{signup?'NEW USER':'WELCOME BACK'}</span><h2>{signup?'Create your account.':'Your next chapter awaits.'}</h2><p>{signup?'Join GlobeScholarship to explore and save your possibilities.':'Log in to explore scholarships and pick up where you left off.'}</p>
    <div className="auth-tabs" aria-label="Account pages"><a className={!signup?'active':''} href="/login" aria-current={!signup?'page':undefined}>Log in</a><a className={signup?'active':''} href="/signup" aria-current={signup?'page':undefined}>New user</a></div>
    <form onSubmit={submit} className="auth-form"><fieldset disabled={busy}>
     {signup&&<label htmlFor="signup-name">Full name<div className="auth-input"><UserRound size={18}/><input id="signup-name" name="name" autoComplete="name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div></label>}
     <label htmlFor="auth-email">Email address<div className="auth-input"><Mail size={18}/><input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
     <label htmlFor="auth-password">Password<div className="auth-input"><LockKeyhole size={18}/><input id="auth-password" name="password" type={show?'text':'password'} autoComplete={signup?'new-password':'current-password'} required minLength={signup?12:1} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} placeholder={signup?'Create a password':'Enter your password'}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>{signup&&<span className="field-hint">Use at least 12 characters.</span>}</label>
     {signup&&<label htmlFor="auth-confirm">Confirm password<div className="auth-input"><LockKeyhole size={18}/><input id="auth-confirm" name="confirmPassword" type={show?'text':'password'} autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Enter your password again"/></div></label>}
     {error&&<p className="auth-error" role="alert">{error}</p>}
     <button className="primary auth-submit" type="submit">{busy?<LoaderCircle size={18} className="spin"/>:signup?<UserRound size={18}/>:<LockKeyhole size={18}/>} {busy?(signup?'Creating account…':'Logging in…'):(signup?'Create account':'Log in')}</button>
    </fieldset></form>
    <p className="auth-switch">{signup?'Already have an account?':'Don’t have an account?'} <a href={signup?'/login':'/signup'}>{signup?'Log in':'Create one'}</a></p><div className="auth-privacy"><ShieldCheck size={18}/><span>Your profile and saved scholarships stay in your account.</span></div>{signup&&<p className="auth-open-signup"><Check size={15}/> Registration is open. No invitation needed.</p>}
   </div></section>
  </main><footer className="auth-footer">GlobeScholarship AI · Possibility has no borders.</footer>
 </div>;
}
