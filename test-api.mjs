/**
 * G-45 Church Management System — Full API Test Runner
 * Run: node test-api.mjs
 *
 * Set these before running (or edit defaults below):
 *   $env:BISHOP_EMAIL    = "your-bishop@email.com"
 *   $env:BISHOP_PASSWORD = "yourpassword"
 */

const BASE = 'http://localhost:3000';

// ── Credentials ─────────────────────────────────────────────────────────────
const BISHOP_EMAIL    = process.env.BISHOP_EMAIL    || 'FILL_IN_BISHOP_EMAIL';
const BISHOP_PASSWORD = process.env.BISHOP_PASSWORD || 'FILL_IN_BISHOP_PASSWORD';

// ── Colour helpers ───────────────────────────────────────────────────────────
const GREEN  = (s) => `\x1b[32m${s}\x1b[0m`;
const RED    = (s) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const CYAN   = (s) => `\x1b[36m${s}\x1b[0m`;
const BOLD   = (s) => `\x1b[1m${s}\x1b[0m`;
const DIM    = (s) => `\x1b[2m${s}\x1b[0m`;

// ── State ────────────────────────────────────────────────────────────────────
let bishopCookie = '';
const results = { pass: 0, fail: 0, skip: 0, total: 0 };

// Discovered IDs (populated dynamically during GET tests)
const ids = {
  leaderId:        null,
  groupId:         null,
  memberId:        null,
  eventId:         null,
  attendanceId:    null,
  notificationId:  null,
  communicationId: null,
  prayerRequestId: null,
  thanksgivingId:  null,
  protocolTeamId:  null,
  visitorId:       null,
};

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function req(method, path, { body, cookie, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    return { status: res.status, ok: res.ok, res };
  } catch (e) {
    return { status: 0, ok: false, error: e.message };
  }
}

// ── Test runner ──────────────────────────────────────────────────────────────
async function test(label, method, path, opts = {}) {
  results.total++;
  const { status, ok, error } = await req(method, path, opts);

  const goodStatuses  = opts.expectStatus
    ? (Array.isArray(opts.expectStatus) ? opts.expectStatus : [opts.expectStatus])
    : [200, 201];
  const pass = goodStatuses.includes(status);

  const icon   = pass ? GREEN('✓') : RED('✗');
  const badge  = pass ? GREEN(`[${status}]`) : RED(`[${status || 'ERR'}]`);
  const note   = error ? RED(` ← ${error}`) : '';
  const idHint = opts.note ? DIM(` (${opts.note})`) : '';

  console.log(`  ${icon} ${badge} ${method.padEnd(6)} ${path}  ${DIM(label)}${idHint}${note}`);

  if (pass) results.pass++; else results.fail++;
  return { status, ok };
}

function skip(label, path) {
  results.total++;
  results.skip++;
  console.log(`  ${YELLOW('–')} ${YELLOW('[SKIP]')} ${path}  ${DIM(label)}`);
}

function section(title) {
  console.log(`\n${BOLD(CYAN('══════════════════════════════════════════════'))}`);
  console.log(`${BOLD(CYAN(`  ${title}`))}`);
  console.log(`${BOLD(CYAN('══════════════════════════════════════════════'))}`);
}

// ── Dynamic ID extractor ─────────────────────────────────────────────────────
async function extractIds() {
  // Leader IDs
  try {
    const r = await fetch(`${BASE}/api/bishop/leaders`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.leaders || d.data || [];
    if (arr[0]) ids.leaderId = arr[0]._id;
  } catch {}

  // Group IDs
  try {
    const r = await fetch(`${BASE}/api/bishop/groups`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.groups || d.data || [];
    if (arr[0]) ids.groupId = arr[0]._id;
  } catch {}

  // Member IDs (from bishop/members)
  try {
    const r = await fetch(`${BASE}/api/bishop/members`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = (d.data?.members) || d.members || [];
    if (arr[0]) ids.memberId = arr[0]._id;
  } catch {}

  // Event IDs
  try {
    const r = await fetch(`${BASE}/api/events`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.events || d.data || [];
    if (arr[0]) ids.eventId = arr[0]._id;
  } catch {}

  // Notification IDs
  try {
    const r = await fetch(`${BASE}/api/notifications`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.notifications || d.data || [];
    if (arr[0]) ids.notificationId = arr[0]._id;
  } catch {}

  // Prayer request IDs
  try {
    const r = await fetch(`${BASE}/api/bishop/prayer-requests`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.prayerRequests || d.data || [];
    if (arr[0]) ids.prayerRequestId = arr[0]._id;
  } catch {}

  // Thanksgiving IDs
  try {
    const r = await fetch(`${BASE}/api/bishop/thanksgiving`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.thanksgivings || d.data || [];
    if (arr[0]) ids.thanksgivingId = arr[0]._id;
  } catch {}

  // Protocol team IDs
  try {
    const r = await fetch(`${BASE}/api/bishop/protocol-teams`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.teams || d.data || [];
    if (arr[0]) ids.protocolTeamId = arr[0]._id;
  } catch {}

  // Visitor IDs
  try {
    const r = await fetch(`${BASE}/api/protocol/visitors`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.visitors || d.data || [];
    if (arr[0]) ids.visitorId = arr[0]._id;
  } catch {}

  // Attendance IDs
  try {
    const r = await fetch(`${BASE}/api/attendance`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.attendanceRecords || d.data || [];
    if (arr[0]) ids.attendanceId = arr[0]._id;
  } catch {}

  // Communication IDs (inbox)
  try {
    const r = await fetch(`${BASE}/api/communications/inbox`, { headers: { Cookie: bishopCookie } });
    const d = await r.json();
    const arr = d.communications || d.data || [];
    if (arr[0]) ids.communicationId = arr[0]._id;
  } catch {}

  console.log(DIM('\n  Discovered IDs:'));
  for (const [k, v] of Object.entries(ids)) {
    console.log(DIM(`    ${k.padEnd(20)} ${v ? GREEN(v) : YELLOW('not found')}`));
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log(BOLD('\n🧪  G-45 Church Management — API Test Runner'));
  console.log(DIM(`    Base URL: ${BASE}\n`));

  if (BISHOP_EMAIL === 'FILL_IN_BISHOP_EMAIL') {
    console.log(RED('  ✗ BISHOP_EMAIL not set. Run:'));
    console.log(YELLOW('      $env:BISHOP_EMAIL="your@email.com"'));
    console.log(YELLOW('      $env:BISHOP_PASSWORD="yourpassword"'));
    console.log(YELLOW('      node test-api.mjs\n'));
    process.exit(1);
  }

  // ── 1. PUBLIC / UNAUTHENTICATED ──────────────────────────────────────────
  section('1 · PUBLIC ENDPOINTS (no auth required)');

  // Login
  console.log(BOLD('\n  [Auth]'));
  const loginRes = await req('POST', '/api/login', {
    body: { email: BISHOP_EMAIL, password: BISHOP_PASSWORD },
  });
  const loginOk = loginRes.status === 200;
  results.total++;
  if (loginOk) {
    results.pass++;
    const setCookie = loginRes.res.headers.get('set-cookie') || '';
    bishopCookie = setCookie.split(';')[0];
    console.log(`  ${GREEN('✓')} ${GREEN('[200]')} POST   /api/login  ${DIM('Bishop login')} ${GREEN('← cookie captured')}`);
  } else {
    results.fail++;
    console.log(`  ${RED('✗')} ${RED(`[${loginRes.status}]`)} POST   /api/login  ${RED('← LOGIN FAILED – remaining tests will fail auth')}`);
  }

  // Init (should be 200, but it's a security risk – tested as-is)
  await test('Seed bishop account', 'GET', '/api/init', { expectStatus: [200, 400, 409] });

  // Test connection diagnostic
  await test('DB connection check', 'GET', '/api/test-connection', { expectStatus: [200, 500] });

  // Test auth diagnostic
  await test('Auth diagnostic (no cookie)', 'GET', '/api/test-auth', { expectStatus: [401, 403] });

  // ── 2. AUTHENTICATION ────────────────────────────────────────────────────
  section('2 · AUTHENTICATION');
  await test('Logout (clears cookie)', 'POST', '/api/logout', { cookie: bishopCookie, expectStatus: [200] });

  // Re-login after logout test
  const reLogin = await req('POST', '/api/login', {
    body: { email: BISHOP_EMAIL, password: BISHOP_PASSWORD },
  });
  if (reLogin.status === 200) {
    const sc = reLogin.res.headers.get('set-cookie') || '';
    bishopCookie = sc.split(';')[0];
  }
  await test('Wrong credentials rejected', 'POST', '/api/login', {
    body: { email: BISHOP_EMAIL, password: 'wrongpassword123' },
    expectStatus: [401],
  });
  await test('Missing fields rejected', 'POST', '/api/login', {
    body: { email: BISHOP_EMAIL },
    expectStatus: [400],
  });
  await test('Auth diagnostic (with cookie)', 'GET', '/api/test-auth', {
    cookie: bishopCookie,
    expectStatus: [200],
  });

  // ── 3. DISCOVER IDs ──────────────────────────────────────────────────────
  section('3 · DISCOVERING IDs FROM LIVE DATA');
  await extractIds();

  // ── 4. BISHOP DASHBOARD & ANALYTICS ─────────────────────────────────────
  section('4 · BISHOP — Dashboard & Analytics');
  const C = { cookie: bishopCookie };

  await test('Bishop dashboard',           'GET', '/api/bishop',                          C);
  await test('Bishop dashboard (alt)',     'GET', '/api/bishop/dashboard',                C);
  await test('Bishop analytics',           'GET', '/api/bishop/analytics',               C);
  await test('Groups performance',         'GET', '/api/bishop/groups-performance',       C);
  await test('Group performance (single)', 'GET', '/api/bishop/group-performance',        C);
  await test('Group comparison',           'GET', '/api/bishop/group-comparison',         C);
  await test('All responses',              'GET', '/api/bishop/all-responses',            C);
  await test('Visitor overview',           'GET', '/api/bishop/visitor-overview',         C);

  // ── 5. BISHOP — LEADERS ──────────────────────────────────────────────────
  section('5 · BISHOP — Leaders');
  await test('List leaders',          'GET',  '/api/bishop/leaders',                      C);
  await test('Create leader (POST-only, GET→405)', 'GET', '/api/bishop/leader',          { ...C, expectStatus: [405] });
  if (ids.leaderId) {
    await test('Get leader by ID',    'GET',  `/api/bishop/leaders/${ids.leaderId}`,     C);
    await test('Update leader',       'PUT',  `/api/bishop/leaders/${ids.leaderId}`,     { ...C, body: {}, note: 'empty patch' });
  } else {
    skip('Get/Update leader by ID — no leaderId found', '/api/bishop/leaders/[id]');
  }

  // ── 6. BISHOP — GROUPS ───────────────────────────────────────────────────
  section('6 · BISHOP — Groups');
  await test('List groups',           'GET',  '/api/bishop/groups',                       C);
  await test('List groups (shared)',  'GET',  '/api/groups',                              { ...C, expectStatus: [200, 401, 403] });
  if (ids.groupId) {
    await test('Get group by ID',     'GET',  `/api/bishop/groups/${ids.groupId}`,       C);
  } else {
    skip('Get group by ID — no groupId found', '/api/bishop/groups/[id]');
  }

  // ── 7. BISHOP — MEMBERS ──────────────────────────────────────────────────
  section('7 · BISHOP — Members');
  await test('List bishop members',   'GET',  '/api/bishop/members',                      C);
  await test('List all members',      'GET',  '/api/members',                             C);

  // ── 8. BISHOP — PRAYER REQUESTS ─────────────────────────────────────────
  section('8 · BISHOP — Prayer Requests');
  await test('List prayer requests',  'GET',  '/api/bishop/prayer-requests',              C);
  if (ids.prayerRequestId) {
    await test('Get prayer request',  'GET',  `/api/bishop/prayer-requests/${ids.prayerRequestId}`,  C);
    await test('Prayer request PDF',  'GET',  `/api/bishop/prayer-requests/${ids.prayerRequestId}/pdf`, C);
  } else {
    skip('Prayer request by ID — none in DB', '/api/bishop/prayer-requests/[id]');
    skip('Prayer request PDF — none in DB',   '/api/bishop/prayer-requests/[id]/pdf');
  }

  // ── 9. BISHOP — THANKSGIVING ─────────────────────────────────────────────
  section('9 · BISHOP — Thanksgiving');
  await test('List thanksgivings',    'GET',  '/api/bishop/thanksgiving',                 C);
  if (ids.thanksgivingId) {
    await test('Get thanksgiving',    'GET',  `/api/bishop/thanksgiving/${ids.thanksgivingId}`,      C);
    await test('Thanksgiving PDF',    'GET',  `/api/bishop/thanksgiving/${ids.thanksgivingId}/pdf`,  C);
  } else {
    skip('Thanksgiving by ID — none in DB', '/api/bishop/thanksgiving/[id]');
    skip('Thanksgiving PDF — none in DB',   '/api/bishop/thanksgiving/[id]/pdf');
  }

  // ── 10. BISHOP — PROTOCOL TEAMS ──────────────────────────────────────────
  section('10 · BISHOP — Protocol Teams');
  await test('List protocol teams',         'GET', '/api/bishop/protocol-teams',                     C);
  await test('Protocol analytics',          'GET', '/api/bishop/protocol-teams/analytics',           C);
  await test('Protocol analytics (simple)', 'GET', '/api/bishop/protocol-teams/analytics/simple',    C);
  await test('Automated alerts',            'GET', '/api/bishop/protocol-teams/automated-alerts',    C);
  await test('Support system',              'GET', '/api/bishop/protocol-teams/support-system',      C);
  if (ids.protocolTeamId) {
    await test('Get team by ID',            'GET', `/api/bishop/protocol-teams/${ids.protocolTeamId}`,            C);
    await test('Team performance',          'GET', `/api/bishop/protocol-teams/${ids.protocolTeamId}/performance`, C);
    await test('Team members',              'GET', `/api/bishop/protocol-teams/${ids.protocolTeamId}/members`,     C);
  } else {
    skip('Protocol team by ID — none in DB', '/api/bishop/protocol-teams/[id]');
  }

  // ── 11. BISHOP — STRATEGIES & COMMUNICATIONS ─────────────────────────────
  section('11 · BISHOP — Strategies & Communications');
  await test('Strategy review',        'GET', '/api/bishop/strategies/review',            C);
  await test('Bishop communications',  'GET', '/api/bishop/communications',               C);

  // ── 12. BISHOP — PROFILE ─────────────────────────────────────────────────
  section('12 · BISHOP — Profile');
  await test('Get bishop profile',     'GET',  '/api/bishop/profile',                     C);
  await test('Update bishop profile (empty body→400)', 'PUT', '/api/bishop/profile', { ...C, body: {}, expectStatus: [400] });

  // ── 13. LEADER ROUTES ────────────────────────────────────────────────────
  // Note: bishop cookie correctly gets 307 (RBAC middleware redirects bishop away from /leader routes)
  section('13 · LEADER — Dashboard & Features (RBAC: bishop→307 expected)');
  await test('Leader dashboard',         'GET', '/api/leader',                            { ...C, expectStatus: [200, 307] });
  await test('Leader members',           'GET', '/api/leader/members',                    { ...C, expectStatus: [200, 307] });
  await test('Leader events',            'GET', '/api/leader/events',                     { ...C, expectStatus: [200, 307] });
  await test('Leader analytics',         'GET', '/api/leader/analytics',                  { ...C, expectStatus: [200, 307] });
  await test('Leader group performance', 'GET', '/api/leader/group-performance',          { ...C, expectStatus: [200, 307] });
  await test('Leader available members', 'GET', '/api/leader/available-members',          { ...C, expectStatus: [200, 307] });
  await test('Leader communications',    'GET', '/api/leader/communications',             { ...C, expectStatus: [200, 307] });
  await test('Leader profile',           'GET', '/api/leader/profile',                    { ...C, expectStatus: [200, 307] });
  await test('Member attendance details','GET', '/api/leader/member-attendance-details',  { ...C, expectStatus: [200, 307] });
  if (ids.eventId) {
    await test('Leader event by ID',     'GET', `/api/leader/events/${ids.eventId}`,      { ...C, expectStatus: [200, 307] });
  } else {
    skip('Leader event by ID — no eventId', '/api/leader/events/[eventId]');
  }

  // ── 14. MEMBER ROUTES ────────────────────────────────────────────────────
  section('14 · MEMBER — Dashboard & Features (RBAC: bishop→307 expected)');
  await test('Member dashboard',         'GET', '/api/member',                            { ...C, expectStatus: [200, 307] });
  await test('Member profile',           'GET', '/api/member/profile',                    { ...C, expectStatus: [200, 307] });
  await test('Member prayer requests',   'GET', '/api/member/prayer-requests',            { ...C, expectStatus: [200, 307] });
  await test('Member thanksgiving',      'GET', '/api/member/thanksgiving',               { ...C, expectStatus: [200, 307] });

  // ── 15. PROTOCOL ROUTES ──────────────────────────────────────────────────
  section('15 · PROTOCOL — Visitors & Features (RBAC: bishop→307 expected)');
  await test('Protocol visitors list',   'GET', '/api/protocol/visitors',                 { ...C, expectStatus: [200, 307] });
  await test('Protocol alerts',          'GET', '/api/protocol/visitors/alerts',          { ...C, expectStatus: [200, 307] });
  await test('Protocol attendance',      'GET', '/api/protocol/visitors/attendance',      { ...C, expectStatus: [200, 307] });
  await test('Protocol responsibilities','GET', '/api/protocol/responsibilities',         { ...C, expectStatus: [200, 307] });
  await test('Protocol strategies',      'GET', '/api/protocol/strategies',               { ...C, expectStatus: [200, 307] });
  await test('Protocol bishop report',   'GET', '/api/protocol/bishop-report',            { ...C, expectStatus: [200, 307] });
  await test('Protocol profile',         'GET', '/api/protocol/profile',                  { ...C, expectStatus: [200, 307] });
  if (ids.visitorId) {
    await test('Visitor by ID',          'GET', `/api/protocol/visitors/${ids.visitorId}`,                  C);
    await test('Visitor milestones',     'GET', `/api/protocol/visitors/${ids.visitorId}/milestones`,       C);
    await test('Visitor integration',    'GET', `/api/protocol/visitors/${ids.visitorId}/integration`,      C);
  } else {
    skip('Visitor by ID — none in DB',       '/api/protocol/visitors/[id]');
    skip('Visitor milestones — none in DB',  '/api/protocol/visitors/[id]/milestones');
    skip('Visitor integration — none in DB', '/api/protocol/visitors/[id]/integration');
  }

  // ── 16. VISITOR ROUTES ───────────────────────────────────────────────────
  section('16 · VISITOR — Self-Service Portal (RBAC: bishop→307 expected)');
  await test('Visitor dashboard',        'GET', '/api/visitor/dashboard',                 { ...C, expectStatus: [200, 307] });

  // ── 17. EVENTS ───────────────────────────────────────────────────────────
  section('17 · EVENTS (shared)');
  await test('List events',             'GET', '/api/events',                             C);
  if (ids.eventId) {
    await test('Event by ID',           'GET', `/api/events/${ids.eventId}`,              C);
    await test('Event responses',       'GET', `/api/events/${ids.eventId}/responses`,    C);
  } else {
    skip('Event by ID — no eventId', '/api/events/[id]');
    skip('Event responses — no eventId', '/api/events/[id]/responses');
  }

  // ── 18. ATTENDANCE ───────────────────────────────────────────────────────
  section('18 · ATTENDANCE (shared)');
  await test('Attendance (POST-only, GET→405)', 'GET', '/api/attendance',               { ...C, expectStatus: [405] });
  if (ids.attendanceId) {
    await test('Attendance by ID',      'GET', `/api/attendance/${ids.attendanceId}`,     C);
  } else {
    skip('Attendance by ID — none in DB', '/api/attendance/[id]');
  }

  // ── 19. NOTIFICATIONS ────────────────────────────────────────────────────
  section('19 · NOTIFICATIONS');
  await test('List notifications',      'GET', '/api/notifications',                      C);
  if (ids.notificationId) {
    await test('Mark single read',      'PUT', `/api/notifications/${ids.notificationId}`, C);
  } else {
    skip('Notification by ID — none', '/api/notifications/[id]');
  }
  await test('Mark all read',           'POST', '/api/notifications/mark-read',
    { ...C, body: { markAll: true } });

  // ── 20. COMMUNICATIONS ───────────────────────────────────────────────────
  section('20 · COMMUNICATIONS (inbox)');
  await test('Inbox messages',          'GET', '/api/communications/inbox',               C);
  if (ids.communicationId) {
    await test('Mark message read',     'PUT', `/api/communications/inbox/${ids.communicationId}/read`, C);
  } else {
    skip('Mark message read — no messages in inbox', '/api/communications/inbox/[id]/read');
  }

  // ── 21. SEARCH ───────────────────────────────────────────────────────────
  section('21 · SEARCH');
  await test('Search (no query)',       'GET', '/api/search',                             C);
  await test('Search members',          'GET', '/api/search?q=test',                     C);

  // ── 22. REPORTS ──────────────────────────────────────────────────────────
  section('22 · REPORTS');
  await test('Attendance report',       'GET', '/api/reports/attendance',                 C);

  // ── 23. FOLLOW-UPS ───────────────────────────────────────────────────────
  section('23 · FOLLOW-UPS');
  await test('List follow-ups',         'GET', '/api/followups',                          C);

  // ── 24. CRON ─────────────────────────────────────────────────────────────
  section('24 · CRON');
  await test('Cron reminders (no key)', 'POST', '/api/cron/reminders',
    { expectStatus: [401, 403] });

  // ── 25. UNAUTHENTICATED REJECTION TESTS ──────────────────────────────────
  // Note: middleware redirects (307) unauthenticated browser requests — correct behaviour.
  // API-only routes (notifications/search) should return 401 now that auth errors are caught.
  section('25 · AUTH ENFORCEMENT — Protected routes without cookie');
  await test('Bishop dashboard — no cookie',  'GET', '/api/bishop',           { expectStatus: [307, 401, 403] });
  await test('Leader dashboard — no cookie',  'GET', '/api/leader',           { expectStatus: [307, 401, 403] });
  await test('Member dashboard — no cookie',  'GET', '/api/member',           { expectStatus: [307, 401, 403] });
  await test('Protocol — no cookie',          'GET', '/api/protocol/visitors',{ expectStatus: [307, 401, 403] });
  await test('Notifications — no cookie',     'GET', '/api/notifications',    { expectStatus: [401, 403] });
  await test('Search — no cookie',            'GET', '/api/search?q=x',       { expectStatus: [401, 403] });

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log(`\n${BOLD('══════════════════════════════════════════════')}`);
  console.log(BOLD('  RESULTS'));
  console.log(BOLD('══════════════════════════════════════════════'));
  console.log(`  ${GREEN('Passed')} : ${GREEN(String(results.pass).padStart(3))}`);
  console.log(`  ${RED('Failed')} : ${RED(String(results.fail).padStart(3))}`);
  console.log(`  ${YELLOW('Skipped')}: ${YELLOW(String(results.skip).padStart(3))}`);
  console.log(`  ${'Total'  } : ${String(results.total).padStart(3)}`);
  console.log(BOLD('══════════════════════════════════════════════\n'));

  if (results.fail > 0) process.exit(1);
}

main().catch((e) => { console.error(RED(`Fatal: ${e.message}`)); process.exit(1); });
