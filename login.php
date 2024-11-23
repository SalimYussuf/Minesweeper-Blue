<?php
session_start(); // Start the session to store user data
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get user input
    $inputUsername = $_POST['username'];
    $inputPassword = $_POST['password'];

    // Query to check if the username exists in the database
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $inputUsername);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        // Fetch user data
        $user = $result->fetch_assoc();

        // Verify if the entered password matches the hashed password in the database
        if (password_verify($inputPassword, $user['password'])) {
            // Store user information in the session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];

            // Regenerate session ID to prevent session fixation attacks
            session_regenerate_id(true);

            echo "Login successful!";
            header("Location: minesweeper.html"); // Redirect to the game page
            exit();
        } else {
            echo "Invalid password.";
        }
    } else {
        echo "Invalid username.";
    }

    $stmt->close();
}

$conn->close();
?>