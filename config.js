// ============================================================
// Fill these in, then reload. Nothing else needs editing.
//
// Project URL   Dashboard -> Project Settings -> Data API
//               (it's just https://<your-project-id>.supabase.co)
//
// Anon key      Dashboard -> Project Settings -> API Keys
//               Newer projects show a "publishable key" (sb_publishable_...)
//               instead of the legacy anon JWT. Either works.
//
// This key is meant to be public — it ships in every Supabase browser app, and
// RLS is what actually protects the data. Never put the service_role / secret
// key here. Rowena would have words.
// ============================================================

export const SUPABASE_URL = 'https://wxqvnoyidquwausmqnob.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_OAu98Qr3fjzeLdwitKnTDg_ex1w0D70';

// Which sign-in methods to offer. Turn a provider off here if it isn't
// configured in Dashboard -> Authentication -> Sign In / Providers; the button
// disappears rather than failing when tapped.
export const AUTH_METHODS = {
  // Off: Supabase's built-in email service only delivers to organisation
  // members, so a magic link is a dead end for every visitor. Restore the
  // block in index.html and the handler in landing.js once custom SMTP exists.
  magicLink: false,
  google: true,
  github: true,
  // Off until custom SMTP exists. Signing in to an existing account needs no
  // email, but creating one sends a confirmation through the same built-in
  // service that only delivers to organisation members — so nobody outside the
  // org can get an account to sign in with.
  password: false
};

// Unlisted YouTube video id for the landing page. Leave empty to hide the
// player until the video exists.
export const YOUTUBE_ID = 'g70b_OH6dtc';

export const isConfigured = () =>
  SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
