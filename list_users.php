<?php
// Include the database connection file
require_once 'db_connect.php';

// Query to fetch all users
$query = "SELECT id, username FROM users";
$result = $conn->query($query);

// Check if any users exist
if ($result->num_rows > 0) {
    // Display the list of users
    while ($row = $result->fetch_assoc()) {
        echo "User ID: " . htmlspecialchars($row['id']) . "<br>";
        echo "Username: " . htmlspecialchars($row['username']) . "<br><br>";
    }
} else {
    echo "No users found.";
}

// Close the database connection
$conn->close();
?>
