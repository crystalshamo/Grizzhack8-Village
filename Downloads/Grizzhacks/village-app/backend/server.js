const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "village_app"
});

db.connect(err => {
  if (err) {
    console.log("DB error:", err);
  } else {
    console.log("MySQL connected!");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Example API
app.get("/posts", (req, res) => {
  db.query("SELECT * FROM posts", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});