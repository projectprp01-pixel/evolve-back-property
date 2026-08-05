import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

// In Railway, set this to the private hostname (e.g. http://lume-backend.railway.internal:<PORT>)
// so dashboard traffic never leaves Railway's network. Falls back to the public URL for local dev.
const BACKEND_URL = process.env.BACKEND_URL || 'https://lume-backend-production.up.railway.app';

const COOKIE_NAME = 'staff_token';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const app = express();

app.use(cookieParser());

// ─── Session endpoints (handled locally, never proxied) ───────────────────────

app.post('/session/login', express.json(), async (req, res) => {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return res.status(backendRes.status).json(data);
    }

    res.cookie(COOKIE_NAME, data.token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Token never leaves this response — browser only gets the non-sensitive staff record.
    res.status(200).json({ success: true, staff: data.staff });
  } catch (err) {
    console.error('[session/login] error:', err);
    res.status(502).json({ success: false, message: 'Failed to reach backend' });
  }
});

app.post('/session/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(200).json({ success: true });
});

app.get('/session/me', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  } catch (err) {
    console.error('[session/me] error:', err);
    res.status(502).json({ success: false, message: 'Failed to reach backend' });
  }
});

// ─── Generic authenticated proxy — everything else under /api ─────────────────
// Body is captured raw (not parsed) so JSON, urlencoded, and multipart/form-data
// (image uploads) all pass through untouched, including the multipart boundary.

app.all('/api/*', express.raw({ type: () => true, limit: '20mb' }), async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const headers = { Authorization: `Bearer ${token}` };
  const contentType = req.headers['content-type'];
  if (contentType) headers['Content-Type'] = contentType;

  const hasBody = !['GET', 'HEAD'].includes(req.method) && req.body && req.body.length > 0;

  try {
    const backendRes = await fetch(`${BACKEND_URL}${req.originalUrl}`, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
    });

    const buf = Buffer.from(await backendRes.arrayBuffer());
    const responseContentType = backendRes.headers.get('content-type');
    if (responseContentType) res.setHeader('Content-Type', responseContentType);
    res.status(backendRes.status).send(buf);
  } catch (err) {
    console.error('[api proxy] error:', err);
    res.status(502).json({ success: false, message: 'Failed to reach backend' });
  }
});

// ─── Static build + SPA fallback ───────────────────────────────────────────────

app.use(express.static(DIST_DIR));

app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Defaults to 8081 (not 8080) so it doesn't collide with the Vite dev server
// when both run locally side by side. Railway always sets PORT explicitly.
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`property server listening on ${PORT} (backend: ${BACKEND_URL})`);
});
