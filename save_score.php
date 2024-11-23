<?php
session_start();
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

include 'db_connect.php';

// Get the raw POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Debug log
error_log("Received data: " . print_r($data, true));

// Validate session and data
if (!isset($_SESSION['username']) || !$data) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Not logged in or invalid data"
    ]);
    exit;
}

try {
    // Get user_id from username
    $username = $_SESSION['username'];
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $user_id = $row['id'];
    } else {
        throw new Exception("User not found");
    }
    $stmt->close();
    
    // Insert score into leaderboard
    $stmt = $conn->prepare("INSERT INTO leaderboard (user_id, difficulty_name, time_taken) VALUES (?, ?, ?)"); // Removed extra parameter
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $difficultyName = $data['difficultyName'];
    $timeTaken = $data['timeTaken'];
    
    // Validate the data
    if (!isset($difficultyName) || !isset($timeTaken)) {
        throw new Exception("Missing required fields");
    }
    
    $stmt->bind_param("isd", $user_id, $difficultyName, $timeTaken); // Fixed bind_param to match columns
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Score saved successfully"
    ]);
    
} catch (Exception $e) {
    error_log("Error saving score: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
// Remove closing PHP tag to prevent accidental whitespace