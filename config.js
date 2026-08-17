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
  magicLink: true,
  google: false,
  github: false,
  password: true
};

// Unlisted YouTube video id for the landing page. Leave empty to hide the
// player until the video exists.
export const YOUTUBE_ID = 'g70b_OH6dtc';

export const isConfigured = () =>
  SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
