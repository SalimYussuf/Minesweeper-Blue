<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $inputUsername = $_POST['new-username'];
    $inputPassword = $_POST['new-password'];

    // Check if username exists
    $checkStmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $checkStmt->bind_param("s", $inputUsername);
    $checkStmt->execute();
    $checkStmt->store_result(); // Store the result to check the number of rows

    if ($checkStmt->num_rows > 0) {
        echo "Username already exists. Please choose another username.";
    } else {
        // Hash the password and insert the new user
        $hashedPassword = password_hash($inputPassword, PASSWORD_DEFAULT);
        $insertStmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        $insertStmt->bind_param("ss", $inputUsername, $hashedPassword);

        if ($insertStmt->execute()) {
            header("Location: login.html"); // Redirect to login page
            exit();
        } else {
            error_log("Error: " . $insertStmt->error); // Log detailed errors for debugging
            echo "Something went wrong. Please try again later.";
        }

        $insertStmt->close();
    }

    $checkStmt->close();
}

$conn->close();
?>