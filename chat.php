<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$OPENAI_API_KEY = '
if (!$OPENAI_API_KEY) {
    echo json_encode([
        'reply' => 'Server configuration error.'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    echo json_encode([
        'reply' => 'Invalid request.'
    ]);
    exit;
}

$message = trim($data['message'] ?? '');
$history = $data['history'] ?? [];

if ($message === '') {
    echo json_encode([
        'reply' => 'Empty message.'
    ]);
    exit;
}

$messages = [
    [
        'role' => 'system',
        'content' =>
            'Du er Gaming Balance AI. Du hjelper ungdom med sunne spillvaner og svarer på norsk.'
    ]
];

foreach ($history as $msg) {

    if (
        isset($msg['role']) &&
        isset($msg['content'])
    ) {
        $messages[] = [
            'role' => $msg['role'],
            'content' => $msg['content']
        ];
    }
}

$messages[] = [
    'role' => 'user',
    'content' => $message
];

$payload = [
    'model' => 'gpt-4.1-mini',
    'messages' => $messages,
    'temperature' => 0.7
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $OPENAI_API_KEY
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 10
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {

    echo json_encode([
        'reply' => 'Connection error: ' . curl_error($ch)
    ]);

    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

$result = json_decode($response, true);

if ($httpCode < 200 || $httpCode >= 300) {

    echo json_encode([
        'reply' => 'OpenAI API error',
        'details' => $result
    ]);

    exit;
}

$reply =
    $result['choices'][0]['message']['content']
    ?? 'No response.';

$history[] = [
    'role' => 'user',
    'content' => $message
];

$history[] = [
    'role' => 'assistant',
    'content' => $reply
];

echo json_encode([
    'reply' => $reply,
    'history' => $history
]);
