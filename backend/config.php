<?php
// TriCore Memorial - WAMP Database Configuration

return [
    // Database Configuration
    'db' => [
        'host' => 'localhost',
        'name' => 'tricore_memorial',
        'user' => 'root',
        'pass' => ''
    ],

    // Allowed Origins for React + PHP API
    'origins' => [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:5177',
    'http://localhost',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5177'
    ],

    // Image Upload Configuration
    'upload_dir' => __DIR__ . '/uploads',

    // Maximum Upload Size: 3 MB per image
    'max_upload' => 3 * 1024 * 1024
];
