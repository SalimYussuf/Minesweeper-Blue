<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

include 'db_connect.php';

try {
    $sql = "SELECT l.id, u.username, l.difficulty_name, l.time_taken
            FROM leaderboard l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.time_taken ASC";

    $result = $conn->query($sql);
    
    $leaderboard = [];
    while ($row = $result->fetch_assoc()) {
        // Add debug logging
        error_log("Processing row: " . print_r($row, true));
        
        $leaderboard[] = [
            'username' => $row['username'],
            'difficulty_name' => $row['difficulty_name'],  // Keep the original database column name
            'timeTaken' => $row['time_taken'],
        ];
    }
    
    // Debug log the final array
    error_log("Final leaderboard data: " . print_r($leaderboard, true));
    
    echo json_encode($leaderboard);
    
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>