// Supabase client and every query the app makes.
//
// The client is loaded lazily from the CDN so that an unconfigured checkout —
// or a dead network — degrades to a playable offline game rather than a blank
// page. Everything here returns { data, error } shaped results and never
// throws at the call site.

import {
  SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_METHODS, isConfigured
} from '../config.js';

let client = null;
let loadFailed = false;

export { AUTH_METHODS, isConfigured };

export async function getClient() {
  if (client || loadFailed) return client;
  if (!isConfigured()) return null;
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  } catch (e) {
    loadFailed = true;
    console.warn('Supabase client failed to load; running offline.', e);
    return null;
  }
}

// supabase-js returns { data, error } for most failures, but a dead network or
// a bad host rejects instead. Every call goes through here so callers can rely
// on one shape and never need a try/catch of their own.
async function safe(fn, fallback = null) {
  try {
    const res = await fn();
    return res || { data: fallback, error: null };
  } catch (e) {
    return { data: fallback, error: e };
  }
}

// Auth errors arrive as codes and terse strings. A visitor deciding whether to
// bother with a portfolio game will not debug them, so each one is translated.
export function friendlyError(error) {
  if (!error) return '';
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('invalid login credentials')) return 'That email and password don\'t match.';
  if (msg.includes('email not confirmed')) return 'Check your inbox and confirm your email first.';
  if (msg.includes('user already registered')) return 'That email already has an account — sign in instead.';
  if (msg.includes('password should be')) return 'Password needs to be at least 6 characters.';
  if (msg.includes('otp') && msg.includes('expired')) return 'That link has expired. Send yourself a fresh one.';
  if (msg.includes('expired')) return 'That link has expired. Send yourself a fresh one.';
  // Supabase's built-in email service sends only to organisation team members
  // and caps at 2 messages an hour. Both failures are invisible from the
  // client unless they're named, and both look like "the login is broken".
  if (msg.includes('not authorized') || msg.includes('not authorised')) {
    return 'Email sign-in isn\'t available for this address yet. Try Google or GitHub.';
  }
  if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate')) {
    return 'Email sign-in is rate-limited right now. Try Google or GitHub.';
  }
  if (msg.includes('provider is not enabled')) return 'That sign-in method isn\'t switched on for this project.';
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'Network problem — check your connection.';
  if (msg.includes('redirect')) return 'This URL isn\'t in the project\'s allowed redirects yet.';
  return error.message || 'Something went wrong.';
}

// ---------------------------------------------------------------- session

export async function currentSession() {
  const c = await getClient();
  if (!c) return null;
  const { data } = await safe(() => c.auth.getSession(), null);
  return (data && data.session) || null;
}

export async function onAuthChange(fn) {
  const c = await getClient();
  if (!c) return;
  c.auth.onAuthStateChange((_event, session) => fn(session));
}

export async function signOut() {
  const c = await getClient();
  if (c) await c.auth.signOut();
}

// ---------------------------------------------------------------- sign in

const redirectTo = () => window.location.origin + window.location.pathname;

export async function signInWithMagicLink(email) {
  const c = await getClient();
  if (!c) return { error: { message: 'Not configured' } };
  const { error } = await safe(() => c.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo() }
  }));
  return { error };
}

export async function signInWithProvider(provider) {
  const c = await getClient();
  if (!c) return { error: { message: 'Not configured' } };
  const { error } = await safe(() => c.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo() }
  }));
  return { error };
}

export async function signInWithPassword(email, password) {
  const c = await getClient();
  if (!c) return { error: { message: 'Not configured' } };
  const { error } = await safe(() => c.auth.signInWithPassword({ email, password }));
  return { error };
}

export async function signUpWithPassword(email, password) {
  const c = await getClient();
  if (!c) return { error: { message: 'Not configured' } };
  const { error } = await safe(() => c.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo() }
  }));
  return { error };
}

// ---------------------------------------------------------------- profile

export async function getProfile(userId) {
  const c = await getClient();
  if (!c) return { data: null, error: null };
  // maybeSingle, not single: a missing profile is the expected state on first
  // login, not an error to be caught.
  return safe(() => c.from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle());
}

export async function createProfile(userId, displayName, avatarUrl = null) {
  const c = await getClient();
  if (!c) return { error: { message: 'Not configured' } };
  const { error } = await safe(() => c.from('profiles')
    .insert({ id: userId, display_name: displayName.slice(0, 30), avatar_url: avatarUrl }));
  return { error };
}

// OAuth hands back a name in the user metadata; pre-filling it saves a typing
// step on a phone. The shape differs per provider, hence the fallbacks.
export function suggestedName(user) {
  if (!user) return '';
  const m = user.user_metadata || {};
  return (m.full_name || m.name || m.user_name || m.preferred_username ||
    (user.email ? user.email.split('@')[0] : '')).slice(0, 30);
}

export function suggestedAvatar(user) {
  const m = (user && user.user_metadata) || {};
  return m.avatar_url || m.picture || null;
}

// ---------------------------------------------------------------- scores

export async function submitScore(userId, score, badges, trials, firstTry) {
  const c = await getClient();
  if (!c) return { error: { message: 'Not configured' } };
  const { error } = await safe(() => c.from('scores').insert({
    user_id: userId, score, badges, trials, first_try: firstTry
  }));
  return { error };
}

export async function topScores(limit = 10) {
  const c = await getClient();
  if (!c) return { data: [], error: null };
  const { data, error } = await safe(() => c.from('leaderboard')
    .select('id, score, badges, trials, first_try, completed_at, display_name')
    .limit(limit), []);
  return { data: data || [], error };
}

// ---------------------------------------------------------------- recs

export async function submitRecommendation(userId, message) {
  const c = await getClient();
  if (!c) return { error: { message: 'Not configured' } };
  const { error } = await safe(() => c.from('recommendations')
    .insert({ user_id: userId, message: message.slice(0, 200) }));
  return { error };
}

export async function recentRecommendations(limit = 50) {
  const c = await getClient();
  if (!c) return { data: [], error: null };
  const { data, error } = await safe(() => c.from('recommendations')
    .select('id, message, created_at, user_id, profiles:user_id(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit), []);
  return { data: data || [], error };
}
