const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// ── DB Connection ─────────────────────────────────────────────────────────────

const db = mysql.createPool({
  host: "35.50.104.14",
  port: 3006,
  user: "root",
  password: "password",
  database: "village_app",
});

// ── Health Check ──────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.send("Village backend is running 🚀");
});

// ── Users ─────────────────────────────────────────────────────────────────────

app.post("/api/users/register", async (req, res) => {
  const { name, email, password_hash, is_mentor, zipcode } = req.body;

  try {
    const hashed = await bcrypt.hash(password_hash, 10);

    const [result] = await db.query(
      "INSERT INTO Users (name, email, password_hash, is_mentor, zipcode) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashed, is_mentor ?? false, zipcode ?? ""]
    );

    res.status(201).json({ user_id: result.insertId, message: "User created" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  const { email, password_hash } = req.body;

  try {
    const [results] = await db.query(
      "SELECT user_id, name, email, password_hash AS stored_hash, is_mentor, zipcode FROM Users WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password_hash, user.stored_hash);

    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { stored_hash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT user_id, name, email, is_mentor, zipcode FROM Users WHERE user_id = ?",
      [req.params.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { name, zipcode, is_mentor } = req.body;

  try {
    await db.query(
      "UPDATE Users SET name = ?, zipcode = ?, is_mentor = ? WHERE user_id = ?",
      [name, zipcode, is_mentor, req.params.id]
    );

    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, name, email, is_mentor, zipcode FROM Users"
    );

    res.json({
      message: "All users fetched successfully",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ── Questions & Answers ───────────────────────────────────────────────────────

app.get("/api/questions", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM Questions");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/questions", async (req, res) => {
  const { question_text, question_type, category, options_json, required } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Questions (question_text, question_type, category, options_json, required) VALUES (?, ?, ?, ?, ?)",
      [question_text, question_type, category, options_json ?? null, required ?? 1]
    );

    res.status(201).json({ question_id: result.insertId, message: "Question created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/answers", async (req, res) => {
  const { user_id, answers } = req.body;

  try {
    const values = answers.map((a) => [user_id, a.question_id, a.answer_text]);

    const [result] = await db.query(
      "INSERT INTO Answers (user_id, question_id, answer_text) VALUES ?",
      [values]
    );

    res.status(201).json({ message: "Answers saved", count: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/answers/:user_id", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT a.*, q.question_text, q.category
       FROM Answers a
       JOIN Questions q ON a.question_id = q.question_id
       WHERE a.user_id = ?`,
      [req.params.user_id]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Posts ─────────────────────────────────────────────────────────────────────

app.get("/api/posts", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT p.*, u.name AS author_name
       FROM Posts p
       LEFT JOIN Users u ON p.user_id = u.user_id
       ORDER BY p.created_at DESC`
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/posts", async (req, res) => {
  const { user_id, content, image_url, is_anonymous, prompt_id } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Posts (user_id, content, image_url, is_anonymous, prompt_id) VALUES (?, ?, ?, ?, ?)",
      [user_id, content, image_url ?? null, is_anonymous ?? false, prompt_id ?? null]
    );

    res.status(201).json({ post_id: result.insertId, message: "Post created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/posts/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM Posts WHERE post_id = ?", [req.params.id]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Comments ──────────────────────────────────────────────────────────────────

app.get("/api/posts/:id/comments", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT c.*, u.name AS author_name
       FROM Comments c
       LEFT JOIN Users u ON c.user_id = u.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/posts/:id/comments", async (req, res) => {
  const { user_id, content } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [req.params.id, user_id, content]
    );

    res.status(201).json({ comment_id: result.insertId, message: "Comment added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reactions ─────────────────────────────────────────────────────────────────

app.post("/api/posts/:id/reactions", async (req, res) => {
  const { user_id, reaction_type } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Reactions (user_id, post_id, reaction_type) VALUES (?, ?, ?)",
      [user_id, req.params.id, reaction_type]
    );

    res.status(201).json({ reaction_id: result.insertId, message: "Reaction added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Chats & Messages ──────────────────────────────────────────────────────────

app.get("/api/chats/:user_id", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT c.*
       FROM Chats c
       JOIN ChatMembers cm ON c.chat_id = cm.chat_id
       WHERE cm.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.user_id]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chats", async (req, res) => {
  const { user_ids, is_group } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Chats (is_group) VALUES (?)",
      [is_group ?? false]
    );

    const chat_id = result.insertId;
    const members = user_ids.map((id) => [chat_id, id]);

    await db.query("INSERT INTO ChatMembers (chat_id, user_id) VALUES ?", [members]);

    res.status(201).json({ chat_id, message: "Chat created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/chats/:chat_id/messages", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT m.*, u.name AS sender_name
       FROM Messages m
       JOIN Users u ON m.sender_id = u.user_id
       WHERE m.chat_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.chat_id]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chats/:chat_id/messages", async (req, res) => {
  const { sender_id, content } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Messages (chat_id, sender_id, content) VALUES (?, ?, ?)",
      [req.params.chat_id, sender_id, content]
    );

    res.status(201).json({ message_id: result.insertId, message: "Message sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Donations ─────────────────────────────────────────────────────────────────

app.get("/api/donations", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT d.*, u.name AS donor_name
       FROM Donations d
       JOIN Users u ON d.user_id = u.user_id
       ORDER BY d.created_at DESC`
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/donations", async (req, res) => {
  const { user_id, item, quantity, status } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Donations (user_id, item, quantity, status) VALUES (?, ?, ?, ?)",
      [user_id, item, quantity, status ?? "pending"]
    );

    res.status(201).json({ donation_id: result.insertId, message: "Donation created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/donations/:id", async (req, res) => {
  const { status } = req.body;

  try {
    await db.query(
      "UPDATE Donations SET status = ? WHERE donation_id = ?",
      [status, req.params.id]
    );

    res.json({ message: "Donation status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Matches ───────────────────────────────────────────────────────────────────

app.get("/api/matches/:user_id", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT m.*, u.name AS matched_user_name
       FROM Matches m
       JOIN Users u ON (
         CASE
           WHEN m.user1_id = ? THEN m.user2_id
           ELSE m.user1_id
         END = u.user_id
       )
       WHERE m.user1_id = ? OR m.user2_id = ?`,
      [req.params.user_id, req.params.user_id, req.params.user_id]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/matches", async (req, res) => {
  const { user1_id, user2_id, match_type } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Matches (user1_id, user2_id, match_type) VALUES (?, ?, ?)",
      [user1_id, user2_id, match_type]
    );

    res.status(201).json({ match_id: result.insertId, message: "Match created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(3001, () => {
 console.log("🚀 Server running on port 3001");
});


app.get("/api/admin/users", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, name, email, is_mentor, zipcode FROM Users"
    );

    res.json({
      message: "All users fetched successfully",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});