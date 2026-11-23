<?php
require __DIR__ . '/helpers.php';

cors();
startSession();

header('X-Content-Type-Options: nosniff');

$method = $_SERVER['REQUEST_METHOD'];
$path = '/' . trim($_GET['route'] ?? ($_SERVER['PATH_INFO'] ?? ''), '/');

$routes = [];

function route(string $m, string $p, callable $fn) {
    global $routes;
    $routes[] = [$m, '#^' . $p . '$#', $fn];
}

const FIELDS = [
    'name', 'birth_date', 'death_date', 'bio', 'family_info',
    'wake_location', 'wake_address', 'wake_date', 'viewing_hours',
    'funeral_church', 'funeral_date', 'funeral_time', 'presider',
    'cemetery_type', 'cemetery_name', 'cemetery_address',
    'grave_id', 'map_link', 'visibility', 'status'
];

const SCHEDULE = [
    'wake_date', 'viewing_hours', 'wake_location',
    'funeral_church', 'funeral_date', 'funeral_time', 'presider'
];

// CLEAN NULL VALUES
function nul($v) {
    $v = trim((string)$v);
    return $v === '' ? null : $v;
}

// MEMORIAL DATA VALIDATION
function memorialData(array $in, bool $partial = false): array {
    $d = [];

    foreach (FIELDS as $f) {
        if (!$partial || array_key_exists($f, $in)) {
            $d[$f] = nul($in[$f] ?? '');
        }
    }

    foreach (['allow_candles', 'allow_prayers', 'allow_memories'] as $f) {
        if (!$partial || array_key_exists($f, $in)) {
            $d[$f] = !empty($in[$f])
                && $in[$f] !== 'false'
                && $in[$f] !== '0' ? 1 : 0;
        }
    }

    if (!$partial || array_key_exists('name', $d)) {
        if (empty($d['name'])) {
            fail('Name is required.');
        }
    }

    if (
        !empty($d['birth_date']) &&
        !empty($d['death_date']) &&
        $d['death_date'] < $d['birth_date']
    ) {
        fail('The passing date must be after the birth date.');
    }

    if (
        !empty($d['wake_date']) &&
        !empty($d['funeral_date']) &&
        $d['funeral_date'] < $d['wake_date']
    ) {
        fail('The funeral date cannot be before the wake date.');
    }

    if (
        isset($d['cemetery_type']) &&
        !in_array($d['cemetery_type'], ['catholic', 'private', 'public'], true)
    ) {
        fail('Invalid cemetery type.');
    }

    if (
        isset($d['visibility']) &&
        !in_array($d['visibility'], ['public', 'private'], true)
    ) {
        fail('Invalid visibility.');
    }

    if (
        isset($d['status']) &&
        !in_array($d['status'], ['draft', 'published'], true)
    ) {
        fail('Invalid status.');
    }

    if (
        !empty($d['map_link']) &&
        !preg_match('#^https?://#i', $d['map_link'])
    ) {
        fail('Map link must start with http:// or https://');
    }

    return $d;
}

// CHECK MEMORIAL ACCESS
function canOpen(array $m): bool {
    $u = me();

    return $m['visibility'] === 'public'
        || ($u !== null && $u['role'] === 'admin');
}

// LOAD MEMORIAL
function loadMemorial(int $id, bool $needPublished = true): array {
    $m = q(
        'SELECT * FROM memorials WHERE id = ?',
        [$id]
    )->fetch();

    if (
        !$m ||
        ($needPublished && $m['status'] !== 'published' && !me())
    ) {
        fail('Memorial not found.', 404);
    }

    return $m;
}

// CHECK GUEST PERMISSIONS
function guestMemorial(int $id, string $flag): array {
    $m = loadMemorial($id);

    if (!canOpen($m)) {
        fail('This memorial is private.', 403);
    }

    if (!$m[$flag]) {
        fail('The administrator has turned this off for this memorial.', 403);
    }

    return $m;
}

/* =========================================
   AUTHENTICATION
========================================= */

// LOGIN
route('POST', '/auth/login', function () {
    $b = body();

    $u = q(
        'SELECT * FROM users WHERE email = ?',
        [strtolower(clean($b['email'] ?? '', 160))]
    )->fetch();

    if (
        !$u ||
        !password_verify($b['password'] ?? '', $u['password_hash'])
    ) {
        usleep(400000);
        fail('Email or password is incorrect.', 401);
    }

    session_regenerate_id(true);

    $_SESSION['uid'] = $u['id'];

    out([
        'user' => [
            'id' => $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'role' => $u['role']
        ]
    ]);
});

// LOGOUT
route('POST', '/auth/logout', function () {
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();

    out(['ok' => true]);
});

// CHECK CURRENT USER
route('GET', '/auth/me', fn() => out(['user' => me()]));


/* =========================================
   PUBLIC ROUTES
========================================= */

// WEBSITE SETTINGS
route('GET', '/settings', function () {
    out(array_column(
        q('SELECT k, v FROM settings')->fetchAll(),
        'v',
        'k'
    ));
});

// PUBLIC MEMORIAL LIST
route('GET', '/memorials', function () {
    $sql = "
        SELECT
            m.id,
            m.name,
            m.portrait,
            m.birth_date,
            m.death_date,
            m.cemetery_type,
            m.cemetery_name,
            m.visibility,
            m.allow_candles,
            m.allow_prayers,
            m.allow_memories,
            (
                SELECT COUNT(*)
                FROM candles c
                WHERE c.memorial_id = m.id
            ) AS candle_count
        FROM memorials m
        WHERE m.status = 'published'
    ";

    $p = [];

    if (($s = clean($_GET['q'] ?? '', 100)) !== '') {
        $sql .= ' AND m.name LIKE ?';
        $p[] = "%$s%";
    }

    if (in_array($_GET['type'] ?? '', ['catholic', 'private', 'public'], true)) {
        $sql .= ' AND m.cemetery_type = ?';
        $p[] = $_GET['type'];
    }

    $rows = q(
        $sql . ' ORDER BY m.created_at DESC, m.id DESC',
        $p
    )->fetchAll();

    $open = me() !== null && me()['role'] === 'admin';

    foreach ($rows as &$r) {
        if ($r['visibility'] === 'private' && !$open) {
            $r = [
                'id' => $r['id'],
                'name' => $r['name'],
                'cemetery_type' => $r['cemetery_type'],
                'visibility' => 'private',
                'locked' => true
            ];
        }
    }

    unset($r);

    out($rows);
});

// MEMORIAL DETAILS
route('GET', '/memorials/(\d+)', function ($id) {
    $m = loadMemorial((int)$id);

    if (!canOpen($m)) {
        fail('This memorial is private.', 403);
    }

    $m['gallery'] = q(
        'SELECT id, file, album, caption FROM gallery WHERE memorial_id = ? ORDER BY id DESC',
        [$id]
    )->fetchAll();

    $m['candles'] = q(
        'SELECT id, name, message, design, created_at FROM candles WHERE memorial_id = ? ORDER BY id DESC LIMIT 100',
        [$id]
    )->fetchAll();

    $m['candle_count'] = (int)q(
        'SELECT COUNT(*) FROM candles WHERE memorial_id = ?',
        [$id]
    )->fetchColumn();

    $m['prayers'] = q(
        'SELECT id, name, type, message, created_at FROM prayers WHERE memorial_id = ? ORDER BY id DESC',
        [$id]
    )->fetchAll();

    $m['memories'] = q(
        "SELECT id, name, story, photo, caption, created_at
         FROM memories
         WHERE memorial_id = ? AND status = 'approved'
         ORDER BY id DESC",
        [$id]
    )->fetchAll();

    out($m);
});

// TRIBUTES
route('GET', '/tributes', function () {
    $pub = me() && me()['role'] === 'admin'
        ? '1=1'
        : "m.visibility = 'public'";

    out([
        'memories' => q(
            "SELECT t.id, t.name, t.story, t.photo, t.caption,
                    t.created_at, m.name AS memorial
             FROM memories t
             JOIN memorials m ON m.id = t.memorial_id
             WHERE t.status = 'approved'
             AND m.status = 'published'
             AND $pub
             ORDER BY t.id DESC LIMIT 100"
        )->fetchAll(),

        'prayers' => q(
            "SELECT t.id, t.name, t.type, t.message,
                    t.created_at, m.name AS memorial
             FROM prayers t
             JOIN memorials m ON m.id = t.memorial_id
             WHERE m.status = 'published'
             AND $pub
             ORDER BY t.id DESC LIMIT 100"
        )->fetchAll()
    ]);
});

// LIGHT A CANDLE
route('POST', '/memorials/(\d+)/candles', function ($id) {
    guestMemorial((int)$id, 'allow_candles');

    $b = body();

    $name = !empty($b['anonymous'])
        ? 'Anonymous'
        : (clean($b['name'] ?? '', 120) ?: 'Anonymous');

    q(
        'INSERT INTO candles (memorial_id, name, message, design) VALUES (?, ?, ?, ?)',
        [
            $id,
            $name,
            clean($b['message'] ?? '', 500),
            max(1, min(3, (int)($b['design'] ?? 1)))
        ]
    );

    out(['ok' => true], 201);
});

// SUBMIT PRAYER
route('POST', '/memorials/(\d+)/prayers', function ($id) {
    guestMemorial((int)$id, 'allow_prayers');

    $b = body();

    $type = in_array(
        $b['type'] ?? '',
        ['Prayer', 'Condolence', 'Bible verse', 'Words of comfort'],
        true
    ) ? $b['type'] : 'Prayer';

    if (clean($b['message'] ?? '') === '') {
        fail('Please write a message.');
    }

    q(
        'INSERT INTO prayers (memorial_id, name, type, message) VALUES (?, ?, ?, ?)',
        [
            $id,
            clean($b['name'] ?? '', 120) ?: 'Anonymous',
            $type,
            clean($b['message'], 2000)
        ]
    );

    out(['ok' => true], 201);
});

// SUBMIT MEMORY
route('POST', '/memorials/(\d+)/memories', function ($id) {
    guestMemorial((int)$id, 'allow_memories');

    if (clean($_POST['story'] ?? '') === '') {
        fail('Please write your memory.');
    }

    $photo = upload('photo');

    $status = me() && me()['role'] === 'admin'
        ? 'approved'
        : 'pending';

    q(
        'INSERT INTO memories (memorial_id, name, story, photo, caption, status)
         VALUES (?, ?, ?, ?, ?, ?)',
        [
            $id,
            clean($_POST['name'] ?? '', 120) ?: 'Anonymous',
            clean($_POST['story'], 3000),
            $photo,
            clean($_POST['caption'] ?? '', 255),
            $status
        ]
    );

    out([
        'ok' => true,
        'status' => $status
    ], 201);
});

// CONTACT FORM
route('POST', '/contact', function () {
    $b = body();

    if (
        !filter_var($b['email'] ?? '', FILTER_VALIDATE_EMAIL) ||
        clean($b['name'] ?? '') === '' ||
        clean($b['message'] ?? '') === ''
    ) {
        fail('Please complete all fields with a valid email.');
    }

    q(
        'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
        [
            clean($b['name'], 120),
            clean($b['email'], 160),
            clean($b['message'], 3000)
        ]
    );

    out(['ok' => true], 201);
});


/* =========================================
   ADMINISTRATOR ROUTES
========================================= */

// DASHBOARD STATISTICS
route('GET', '/admin/stats', function () {
    admin();

    out([
        'memorials' => (int)q(
            'SELECT COUNT(*) FROM memorials'
        )->fetchColumn(),

        'candles' => (int)q(
            'SELECT COUNT(*) FROM candles'
        )->fetchColumn(),

        'prayers' => (int)q(
            'SELECT COUNT(*) FROM prayers'
        )->fetchColumn(),

        'pending' => (int)q(
            "SELECT COUNT(*) FROM memories WHERE status = 'pending'"
        )->fetchColumn(),

        'memories' => (int)q(
            'SELECT COUNT(*) FROM memories'
        )->fetchColumn(),

        'messages' => (int)q(
            'SELECT COUNT(*) FROM messages'
        )->fetchColumn(),

        'by_cemetery' => q(
            'SELECT cemetery_type AS k, COUNT(*) AS n
             FROM memorials GROUP BY cemetery_type'
        )->fetchAll(),

        'by_visibility' => q(
            'SELECT visibility AS k, COUNT(*) AS n
             FROM memorials GROUP BY visibility'
        )->fetchAll()
    ]);
});

// ADMIN MEMORIAL LIST
route('GET', '/admin/memorials', function () {
    admin();

    out(q(
        'SELECT m.*,
            (SELECT COUNT(*) FROM gallery g
             WHERE g.memorial_id = m.id) AS photo_count
         FROM memorials m
         ORDER BY funeral_date IS NULL, funeral_date, id DESC'
    )->fetchAll());
});

// ADMIN CONTENT
route('GET', '/admin/content', function () {
    admin();

    out([
        'memories' => q(
            "SELECT t.*, m.name AS memorial
             FROM memories t
             JOIN memorials m ON m.id = t.memorial_id
             ORDER BY t.status = 'pending' DESC, t.id DESC"
        )->fetchAll(),

        'candles' => q(
            'SELECT t.*, m.name AS memorial
             FROM candles t
             JOIN memorials m ON m.id = t.memorial_id
             ORDER BY t.id DESC'
        )->fetchAll(),

        'prayers' => q(
            'SELECT t.*, m.name AS memorial
             FROM prayers t
             JOIN memorials m ON m.id = t.memorial_id
             ORDER BY t.id DESC'
        )->fetchAll(),

        'messages' => q(
            'SELECT * FROM messages ORDER BY id DESC'
        )->fetchAll(),

        'gallery' => q(
            'SELECT g.*, m.name AS memorial
             FROM gallery g
             JOIN memorials m ON m.id = g.memorial_id
             ORDER BY g.id DESC'
        )->fetchAll()
    ]);
});

// CREATE MEMORIAL
route('POST', '/memorials', function () {
    admin();

    $d = memorialData($_POST);

    if (empty($d['birth_date']) || empty($d['death_date'])) {
        fail('Birth date and passing date are required.');
    }

    $d['portrait'] = upload('portrait');
    $d['grave_photo'] = upload('grave_photo');

    $cols = array_keys($d);

    q(
        'INSERT INTO memorials (' . implode(',', $cols) . ')
         VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')',
        array_values($d)
    );

    $id = (int)db()->lastInsertId();

    foreach ($_FILES['gallery']['name'] ?? [] as $i => $_) {
        if ($f = upload('gallery', $i)) {
            q(
                'INSERT INTO gallery (memorial_id, file, album)
                 VALUES (?, ?, ?)',
                [$id, $f, 'Wake']
            );
        }
    }

    out(['id' => $id], 201);
});

// UPDATE MEMORIAL
route('POST', '/memorials/(\d+)', function ($id) {
    admin();

    $old = loadMemorial((int)$id, false);
    $d = memorialData($_POST);

    foreach (['portrait', 'grave_photo'] as $k) {
        if ($f = upload($k)) {
            delFile($old[$k]);
            $d[$k] = $f;
        }
    }

    $set = implode(
        ',',
        array_map(fn($c) => "$c = ?", array_keys($d))
    );

    q(
        "UPDATE memorials SET $set WHERE id = ?",
        [...array_values($d), $id]
    );

    foreach ($_FILES['gallery']['name'] ?? [] as $i => $_) {
        if ($f = upload('gallery', $i)) {
            q(
                'INSERT INTO gallery (memorial_id, file, album)
                 VALUES (?, ?, ?)',
                [$id, $f, 'Wake']
            );
        }
    }

    out(['ok' => true]);
});

// DELETE MEMORIAL
route('DELETE', '/memorials/(\d+)', function ($id) {
    admin();

    $m = loadMemorial((int)$id, false);

    foreach (q(
        'SELECT file FROM gallery WHERE memorial_id = ?',
        [$id]
    )->fetchAll() as $g) {
        delFile($g['file']);
    }

    foreach (q(
        'SELECT photo FROM memories WHERE memorial_id = ?',
        [$id]
    )->fetchAll() as $g) {
        delFile($g['photo']);
    }

    delFile($m['portrait']);
    delFile($m['grave_photo']);

    q('DELETE FROM memorials WHERE id = ?', [$id]);

    out(['ok' => true]);
});

// UPDATE SCHEDULE
route('PUT', '/memorials/(\d+)/schedule', function ($id) {
    admin();

    $old = loadMemorial((int)$id, false);
    $b = body();
    $in = [];

    foreach (SCHEDULE as $f) {
        $in[$f] = $b[$f] ?? '';
    }

    $in['name'] = $old['name'];

    $d = memorialData($in, true);
    unset($d['name']);

    q(
        'UPDATE memorials SET ' .
        implode(',', array_map(fn($c) => "$c = ?", array_keys($d))) .
        ' WHERE id = ?',
        [...array_values($d), $id]
    );

    out(['ok' => true]);
});

// DELETE SCHEDULE
route('DELETE', '/memorials/(\d+)/schedule', function ($id) {
    admin();

    q(
        'UPDATE memorials SET
         wake_date = NULL,
         viewing_hours = NULL,
         funeral_church = NULL,
         funeral_date = NULL,
         funeral_time = NULL,
         presider = NULL
         WHERE id = ?',
        [$id]
    );

    out(['ok' => true]);
});

// UPDATE PRIVACY
route('PUT', '/memorials/(\d+)/privacy', function ($id) {
    admin();

    $d = memorialData(
        array_intersect_key(
            body(),
            array_flip([
                'visibility',
                'allow_candles',
                'allow_prayers',
                'allow_memories'
            ])
        ),
        true
    );

    if (!$d) {
        fail('Nothing to update.');
    }

    q(
        'UPDATE memorials SET ' .
        implode(',', array_map(fn($c) => "$c = ?", array_keys($d))) .
        ' WHERE id = ?',
        [...array_values($d), $id]
    );

    out(['ok' => true]);
});

// UPLOAD GALLERY
route('POST', '/memorials/(\d+)/gallery', function ($id) {
    admin();

    loadMemorial((int)$id, false);

    $n = 0;

    $album = in_array(
        $_POST['album'] ?? '',
        ['Wake', 'Funeral', 'Burial', 'Family'],
        true
    ) ? $_POST['album'] : 'Wake';

    foreach ($_FILES['photos']['name'] ?? [] as $i => $_) {
        if ($f = upload('photos', $i)) {
            q(
                'INSERT INTO gallery (memorial_id, file, album, caption)
                 VALUES (?, ?, ?, ?)',
                [
                    $id,
                    $f,
                    $album,
                    clean($_POST['caption'] ?? '', 255)
                ]
            );

            $n++;
        }
    }

    out(['uploaded' => $n], 201);
});

// DELETE GALLERY PHOTO
route('DELETE', '/gallery/(\d+)', function ($id) {
    admin();

    if ($g = q(
        'SELECT file FROM gallery WHERE id = ?',
        [$id]
    )->fetch()) {
        delFile($g['file']);
        q('DELETE FROM gallery WHERE id = ?', [$id]);
    }

    out(['ok' => true]);
});

// UPDATE MEMORY STATUS
route('PUT', '/memories/(\d+)', function ($id) {
    admin();

    $s = body()['status'] ?? '';

    if (!in_array($s, ['approved', 'rejected', 'pending'], true)) {
        fail('Invalid status.');
    }

    q(
        'UPDATE memories SET status = ? WHERE id = ?',
        [$s, $id]
    );

    out(['ok' => true]);
});

// DELETE MEMORY
route('DELETE', '/memories/(\d+)', function ($id) {
    admin();

    if ($r = q(
        'SELECT photo FROM memories WHERE id = ?',
        [$id]
    )->fetch()) {
        delFile($r['photo']);
    }

    q('DELETE FROM memories WHERE id = ?', [$id]);

    out(['ok' => true]);
});

// DELETE CANDLE
route('DELETE', '/candles/(\d+)', function ($id) {
    admin();
    q('DELETE FROM candles WHERE id = ?', [$id]);
    out(['ok' => true]);
});

// DELETE PRAYER
route('DELETE', '/prayers/(\d+)', function ($id) {
    admin();
    q('DELETE FROM prayers WHERE id = ?', [$id]);
    out(['ok' => true]);
});

// DELETE MESSAGE
route('DELETE', '/messages/(\d+)', function ($id) {
    admin();
    q('DELETE FROM messages WHERE id = ?', [$id]);
    out(['ok' => true]);
});

// LIST USERS
route('GET', '/users', function () {
    admin();

    out(q(
        'SELECT id, name, email, role, created_at
         FROM users ORDER BY id'
    )->fetchAll());
});

// CREATE ADMIN USER
route('POST', '/users', function () {
    admin();

    $b = body();

    $email = strtolower(clean($b['email'] ?? '', 160));

    if (
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        clean($b['name'] ?? '') === ''
    ) {
        fail('Enter a name and a valid email.');
    }

    if (strlen($b['password'] ?? '') < 8) {
        fail('Password must be at least 8 characters.');
    }

    if (q(
        'SELECT id FROM users WHERE email = ?',
        [$email]
    )->fetch()) {
        fail('That email is already registered.', 409);
    }

    q(
        'INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, ?, ?)',
        [
            clean($b['name'], 120),
            $email,
            password_hash($b['password'], PASSWORD_DEFAULT),
            'admin'
        ]
    );

    out(['ok' => true], 201);
});

// DELETE USER
route('DELETE', '/users/(\d+)', function ($id) {
    $u = admin();

    if ((int)$id === (int)$u['id']) {
        fail('You cannot delete your own account.');
    }

    q('DELETE FROM users WHERE id = ?', [$id]);

    out(['ok' => true]);
});

// UPDATE WEBSITE SETTINGS
route('PUT', '/settings', function () {
    admin();

    $b = body();

    foreach (['site_name', 'hero_title', 'tagline'] as $k) {
        if (isset($b[$k]) && clean($b[$k]) !== '') {
            q(
                'REPLACE INTO settings (k, v) VALUES (?, ?)',
                [$k, clean($b[$k])]
            );
        }
    }

    out(['ok' => true]);
});


/* =========================================
   ROUTE DISPATCH
========================================= */

try {
    foreach ($routes as [$m, $re, $fn]) {
        if ($m === $method && preg_match($re, $path, $mt)) {
            array_shift($mt);
            $fn(...$mt);
            exit;
        }
    }

    fail('Not found.', 404);

} catch (PDOException $e) {

    error_log($e->getMessage());

    fail(
        'Database error. Check config.php and that the database is imported.',
        500
    );

} catch (Throwable $e) {

    error_log($e->getMessage());

    fail('An unexpected server error occurred.', 500);
}
