<?php

$CFG = require __DIR__ . '/config.php';

// CORS CONFIGURATION
function cors() {
    global $CFG;

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin && in_array($origin, $CFG['origins'], true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// DATABASE CONNECTION
function db(): PDO {
    static $pdo = null;
    global $CFG;

    if (!$pdo) {
        $d = $CFG['db'];

        $pdo = new PDO(
            "mysql:host={$d['host']};dbname={$d['name']};charset=utf8mb4",
            $d['user'],
            $d['pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    }

    return $pdo;
}

// DATABASE QUERY
function q(string $sql, array $p = []): PDOStatement {
    $s = db()->prepare($sql);
    $s->execute($p);

    return $s;
}

// JSON RESPONSE
function out($data, int $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode($data);
    exit;
}

// ERROR RESPONSE
function fail(string $msg, int $code = 400) {
    out(['error' => $msg], $code);
}

// READ JSON REQUEST BODY
function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}

// CLEAN INPUT
function clean($v, int $max = 500): string {
    return mb_substr(trim((string)$v), 0, $max);
}

// SESSION MANAGEMENT
function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'path' => '/'
        ]);

        session_start();
    }
}

// GET LOGGED-IN USER
function me(): ?array {
    if (empty($_SESSION['uid'])) {
        return null;
    }

    return q(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [$_SESSION['uid']]
    )->fetch() ?: null;
}

// ADMIN AUTHENTICATION
function admin(): array {
    $u = me();

    if (!$u) {
        fail('Please log in as administrator.', 401);
    }

    return $u;
}

/**
 * Save an uploaded image.
 * Returns stored file name or null.
 */
function upload(string $key, ?int $index = null): ?string {
    global $CFG;

    if (!isset($_FILES[$key])) {
        return null;
    }

    $f = $_FILES[$key];

    $err = $index === null
        ? $f['error']
        : ($f['error'][$index] ?? UPLOAD_ERR_NO_FILE);

    $tmp = $index === null
        ? $f['tmp_name']
        : ($f['tmp_name'][$index] ?? '');

    $size = $index === null
        ? $f['size']
        : ($f['size'][$index] ?? 0);

    if ($err === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($err !== UPLOAD_ERR_OK || $size > $CFG['max_upload']) {
        fail('Image upload failed or is larger than 3 MB.');
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);

    $ext = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ][$mime] ?? null;

    if (!$ext) {
        fail('Only JPG, PNG or WEBP images are allowed.');
    }

    $name = bin2hex(random_bytes(12)) . '.' . $ext;

    if (!is_dir($CFG['upload_dir'])) {
        mkdir($CFG['upload_dir'], 0755, true);
    }

    if (!move_uploaded_file($tmp, $CFG['upload_dir'] . '/' . $name)) {
        fail('Could not save the image.', 500);
    }

    return $name;
}

// DELETE UPLOADED IMAGE
function delFile(?string $f) {
    global $CFG;

    if (
        $f &&
        preg_match('/^[a-f0-9]+\.(jpg|png|webp)$/i', $f)
    ) {
        @unlink($CFG['upload_dir'] . '/' . $f);
    }
}