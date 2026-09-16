// Step 4 — publishing. AT Protocol is two HTTP calls: trade the app password
// for a token, then write a post record to the account's repo.
import './env.mjs';

const PDS = 'https://bsky.social';

async function xrpc(method, body, token) {
  const res = await fetch(`${PDS}/xrpc/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function post(text) {
  const identifier = process.env.BSKY_HANDLE;
  const password = process.env.BSKY_APP_PASSWORD;
  if (!identifier || !password) {
    throw new Error('Missing BSKY_HANDLE or BSKY_APP_PASSWORD. See .env.example.');
  }
  if ([...text].length > 300) {
    throw new Error(`Post is ${[...text].length} characters; the limit is 300.`);
  }

  const session = await xrpc('com.atproto.server.createSession', { identifier, password });
  const record = await xrpc(
    'com.atproto.repo.createRecord',
    {
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record: { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString() },
    },
    session.accessJwt,
  );

  const rkey = record.uri.split('/').pop();
  return { uri: record.uri, url: `https://bsky.app/profile/${session.handle}/post/${rkey}` };
}
