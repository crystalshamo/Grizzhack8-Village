const express = require("express");
const cors    = require("cors");


const app = express();
app.use(cors());
app.use(express.json());


// ── DB Connection ─────────────────────────────────────────────────────────────


const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Password",
  database: "village_app",
});


// db.connect((err) => {
//  if (err) {
//    console.log("❌ DB connection failed:", err);
//  } else {
//    console.log("✅ Connected to MySQL!");
//  }
// });


// ── Health Check ──────────────────────────────────────────────────────────────


app.get("/", (req, res) => {
 res.send("Village backend is running 🚀");
});


// ── Users ─────────────────────────────────────────────────────────────────────


// Register
app.post("/api/users/register", (req, res) => {
 const { name, email, password_hash, is_mentor, zipcode } = req.body;
 db.query(
   "INSERT INTO Users (name, email, password_hash, is_mentor, zipcode) VALUES (?, ?, ?, ?, ?)",
   [name, email, password_hash, is_mentor ?? false, zipcode],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ user_id: result.insertId, message: "User created" });
   }
 );
});


// Login
app.post("/api/users/login", (req, res) => {
 const { email, password_hash } = req.body;
 db.query(
   "SELECT user_id, name, email, is_mentor, zipcode FROM Users WHERE email = ? AND password_hash = ?",
   [email, password_hash],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });
     res.json({ user: results[0] });
   }
 );
});


// Get user by ID
app.get("/api/users/:id", (req, res) => {
 db.query(
   "SELECT user_id, name, email, is_mentor, zipcode FROM Users WHERE user_id = ?",
   [req.params.id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     if (results.length === 0) return res.status(404).json({ error: "User not found" });
     res.json(results[0]);
   }
 );
});


// Update user
app.put("/api/users/:id", (req, res) => {
 const { name, zipcode, is_mentor } = req.body;
 db.query(
   "UPDATE Users SET name = ?, zipcode = ?, is_mentor = ? WHERE user_id = ?",
   [name, zipcode, is_mentor, req.params.id],
   (err) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json({ message: "User updated" });
   }
 );
});


// ── Questions & Answers ───────────────────────────────────────────────────────


// Get all questions
app.get("/api/questions", (req, res) => {
 db.query("SELECT * FROM Questions", (err, results) => {
   if (err) return res.status(500).json({ error: err.message });
   res.json(results);
 });
});


// Get questions by category
app.get("/api/questions/category/:category", (req, res) => {
 db.query(
   "SELECT * FROM Questions WHERE category = ?",
   [req.params.category],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Submit answers
app.post("/api/answers", (req, res) => {
 const { user_id, answers } = req.body;
 // answers = [{ question_id, answer_text }, ...]
 const values = answers.map(a => [user_id, a.question_id, a.answer_text]);
 db.query(
   "INSERT INTO Answers (user_id, question_id, answer_text) VALUES ?",
   [values],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ message: "Answers saved", count: result.affectedRows });
   }
 );
});


// Get answers for a user
app.get("/api/answers/:user_id", (req, res) => {
 db.query(
   `SELECT a.*, q.question_text, q.category
    FROM Answers a
    JOIN Questions q ON a.question_id = q.question_id
    WHERE a.user_id = ?`,
   [req.params.user_id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// ── Posts (Forums) ────────────────────────────────────────────────────────────


// Get all posts
app.get("/api/posts", (req, res) => {
 db.query(
   `SELECT p.*, u.name AS author_name
    FROM Posts p
    LEFT JOIN Users u ON p.user_id = u.user_id
    ORDER BY p.created_at DESC`,
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Get single post
app.get("/api/posts/:id", (req, res) => {
 db.query(
   `SELECT p.*, u.name AS author_name
    FROM Posts p
    LEFT JOIN Users u ON p.user_id = u.user_id
    WHERE p.post_id = ?`,
   [req.params.id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     if (results.length === 0) return res.status(404).json({ error: "Post not found" });
     res.json(results[0]);
   }
 );
});


// Create post
app.post("/api/posts", (req, res) => {
 const { user_id, content, image_url, is_anonymous, prompt_id } = req.body;
 db.query(
   "INSERT INTO Posts (user_id, content, image_url, is_anonymous, prompt_id) VALUES (?, ?, ?, ?, ?)",
   [user_id, content, image_url ?? null, is_anonymous ?? false, prompt_id ?? null],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ post_id: result.insertId, message: "Post created" });
   }
 );
});


// Delete post
app.delete("/api/posts/:id", (req, res) => {
 db.query("DELETE FROM Posts WHERE post_id = ?", [req.params.id], (err) => {
   if (err) return res.status(500).json({ error: err.message });
   res.json({ message: "Post deleted" });
 });
});


// ── Comments ──────────────────────────────────────────────────────────────────


// Get comments for a post
app.get("/api/posts/:id/comments", (req, res) => {
 db.query(
   `SELECT c.*, u.name AS author_name
    FROM Comments c
    LEFT JOIN Users u ON c.user_id = u.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC`,
   [req.params.id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Add a comment
app.post("/api/posts/:id/comments", (req, res) => {
 const { user_id, content } = req.body;
 db.query(
   "INSERT INTO Comments (post_id, user_id, content) VALUES (?, ?, ?)",
   [req.params.id, user_id, content],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ comment_id: result.insertId, message: "Comment added" });
   }
 );
});


// ── Reactions ─────────────────────────────────────────────────────────────────


// Add reaction
app.post("/api/posts/:id/reactions", (req, res) => {
 const { user_id, reaction_type } = req.body;
 db.query(
   "INSERT INTO Reactions (user_id, post_id, reaction_type) VALUES (?, ?, ?)",
   [user_id, req.params.id, reaction_type],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ reaction_id: result.insertId, message: "Reaction added" });
   }
 );
});


// Get reactions for a post
app.get("/api/posts/:id/reactions", (req, res) => {
 db.query(
   "SELECT reaction_type, COUNT(*) as count FROM Reactions WHERE post_id = ? GROUP BY reaction_type",
   [req.params.id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// ── Daily Prompts ─────────────────────────────────────────────────────────────


// Get today's prompt
app.get("/api/prompts/today", (req, res) => {
 const today = new Date().toISOString().slice(0, 10);
 db.query(
   "SELECT * FROM DailyPrompts WHERE date = ?",
   [today],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     if (results.length === 0) return res.status(404).json({ error: "No prompt for today" });
     res.json(results[0]);
   }
 );
});


// Get all prompts
app.get("/api/prompts", (req, res) => {
 db.query("SELECT * FROM DailyPrompts ORDER BY date DESC", (err, results) => {
   if (err) return res.status(500).json({ error: err.message });
   res.json(results);
 });
});


// Create a prompt
app.post("/api/prompts", (req, res) => {
 const { question, date } = req.body;
 db.query(
   "INSERT INTO DailyPrompts (question, date) VALUES (?, ?)",
   [question, date],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ prompt_id: result.insertId, message: "Prompt created" });
   }
 );
});


// ── Groups ────────────────────────────────────────────────────────────────────


// Get all groups
app.get("/api/groups", (req, res) => {
 db.query("SELECT * FROM Groups ORDER BY created_at DESC", (err, results) => {
   if (err) return res.status(500).json({ error: err.message });
   res.json(results);
 });
});


// Get groups by zipcode
app.get("/api/groups/zip/:zipcode", (req, res) => {
 db.query(
   "SELECT * FROM Groups WHERE zipcode = ?",
   [req.params.zipcode],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Create group
app.post("/api/groups", (req, res) => {
 const { name, description, zipcode, created_by } = req.body;
 db.query(
   "INSERT INTO Groups (name, description, zipcode, created_by) VALUES (?, ?, ?, ?)",
   [name, description, zipcode, created_by],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ group_id: result.insertId, message: "Group created" });
   }
 );
});


// Join group
app.post("/api/groups/:id/join", (req, res) => {
 const { user_id, role } = req.body;
 db.query(
   "INSERT INTO GroupMembers (group_id, user_id, role) VALUES (?, ?, ?)",
   [req.params.id, user_id, role ?? "member"],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ id: result.insertId, message: "Joined group" });
   }
 );
});


// Get group members
app.get("/api/groups/:id/members", (req, res) => {
 db.query(
   `SELECT gm.*, u.name, u.email FROM GroupMembers gm
    JOIN Users u ON gm.user_id = u.user_id
    WHERE gm.group_id = ?`,
   [req.params.id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// ── Events ────────────────────────────────────────────────────────────────────


// Get events for a group
app.get("/api/groups/:id/events", (req, res) => {
 db.query(
   "SELECT * FROM Events WHERE group_id = ? ORDER BY event_date ASC",
   [req.params.id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Create event
app.post("/api/events", (req, res) => {
 const { group_id, title, description, location, event_date, created_by } = req.body;
 db.query(
   "INSERT INTO Events (group_id, title, description, location, event_date, created_by) VALUES (?, ?, ?, ?, ?, ?)",
   [group_id, title, description, location, event_date, created_by],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ event_id: result.insertId, message: "Event created" });
   }
 );
});


// RSVP to event
app.post("/api/events/:id/rsvp", (req, res) => {
 const { user_id, status } = req.body;
 db.query(
   "INSERT INTO EventAttendees (event_id, user_id, status) VALUES (?, ?, ?)",
   [req.params.id, user_id, status],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ id: result.insertId, message: "RSVP recorded" });
   }
 );
});


// ── Chats & Messages ──────────────────────────────────────────────────────────


// Get chats for a user
app.get("/api/chats/:user_id", (req, res) => {
 db.query(
   `SELECT c.* FROM Chats c
    JOIN ChatMembers cm ON c.chat_id = cm.chat_id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC`,
   [req.params.user_id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Create a chat
app.post("/api/chats", (req, res) => {
 const { user_ids, is_group } = req.body;
 db.query(
   "INSERT INTO Chats (is_group) VALUES (?)",
   [is_group ?? false],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     const chat_id = result.insertId;
     const members = user_ids.map(id => [chat_id, id]);
     db.query("INSERT INTO ChatMembers (chat_id, user_id) VALUES ?", [members], (err2) => {
       if (err2) return res.status(500).json({ error: err2.message });
       res.status(201).json({ chat_id, message: "Chat created" });
     });
   }
 );
});


// Get messages in a chat
app.get("/api/chats/:chat_id/messages", (req, res) => {
 db.query(
   `SELECT m.*, u.name AS sender_name FROM Messages m
    JOIN Users u ON m.sender_id = u.user_id
    WHERE m.chat_id = ?
    ORDER BY m.created_at ASC`,
   [req.params.chat_id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Send a message
app.post("/api/chats/:chat_id/messages", (req, res) => {
 const { sender_id, content } = req.body;
 db.query(
   "INSERT INTO Messages (chat_id, sender_id, content) VALUES (?, ?, ?)",
   [req.params.chat_id, sender_id, content],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ message_id: result.insertId, message: "Message sent" });
   }
 );
});


// ── Matches ───────────────────────────────────────────────────────────────────


// Get matches for a user
app.get("/api/matches/:user_id", (req, res) => {
 db.query(
   `SELECT m.*, u.name AS matched_user_name FROM Matches m
    JOIN Users u ON (
      CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END = u.user_id
    )
    WHERE m.user1_id = ? OR m.user2_id = ?`,
   [req.params.user_id, req.params.user_id, req.params.user_id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Create a match
app.post("/api/matches", (req, res) => {
 const { user1_id, user2_id, match_type } = req.body;
 db.query(
   "INSERT INTO Matches (user1_id, user2_id, match_type) VALUES (?, ?, ?)",
   [user1_id, user2_id, match_type],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ match_id: result.insertId, message: "Match created" });
   }
 );
});


// ── Points & Badges ───────────────────────────────────────────────────────────


// Get user points
app.get("/api/points/:user_id", (req, res) => {
 db.query(
   "SELECT * FROM UserPoints WHERE user_id = ?",
   [req.params.user_id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results[0] ?? { points: 0, level: 1 });
   }
 );
});


// Add points
app.post("/api/points/:user_id", (req, res) => {
 const { points } = req.body;
 db.query(
   `INSERT INTO UserPoints (user_id, points) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE points = points + ?`,
   [req.params.user_id, points, points],
   (err) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json({ message: "Points updated" });
   }
 );
});


// Get all badges
app.get("/api/badges", (req, res) => {
 db.query("SELECT * FROM Badges", (err, results) => {
   if (err) return res.status(500).json({ error: err.message });
   res.json(results);
 });
});


// Get badges for a user
app.get("/api/badges/:user_id", (req, res) => {
 db.query(
   `SELECT b.*, ub.awarded_at FROM UserBadges ub
    JOIN Badges b ON ub.badge_id = b.badge_id
    WHERE ub.user_id = ?`,
   [req.params.user_id],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Award a badge
app.post("/api/badges/:user_id", (req, res) => {
 const { badge_id } = req.body;
 db.query(
   "INSERT INTO UserBadges (user_id, badge_id) VALUES (?, ?)",
   [req.params.user_id, badge_id],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ id: result.insertId, message: "Badge awarded" });
   }
 );
});


// ── Donations ─────────────────────────────────────────────────────────────────


// Get all donations
app.get("/api/donations", (req, res) => {
 db.query(
   `SELECT d.*, u.name AS donor_name FROM Donations d
    JOIN Users u ON d.user_id = u.user_id
    ORDER BY d.created_at DESC`,
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Create donation
app.post("/api/donations", (req, res) => {
 const { user_id, item, quantity, status } = req.body;
 db.query(
   "INSERT INTO Donations (user_id, item, quantity, status) VALUES (?, ?, ?, ?)",
   [user_id, item, quantity, status ?? "pending"],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ donation_id: result.insertId, message: "Donation created" });
   }
 );
});


// Update donation status
app.put("/api/donations/:id", (req, res) => {
 const { status } = req.body;
 db.query(
   "UPDATE Donations SET status = ? WHERE donation_id = ?",
   [status, req.params.id],
   (err) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json({ message: "Donation status updated" });
   }
 );
});


// ── Product Reviews ───────────────────────────────────────────────────────────


// Get all reviews
app.get("/api/reviews", (req, res) => {
 db.query(
   `SELECT r.*, u.name AS reviewer_name FROM ProductReviews r
    JOIN Users u ON r.user_id = u.user_id
    ORDER BY r.Created_at DESC`,
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Get reviews for a product
app.get("/api/reviews/:product_name", (req, res) => {
 db.query(
   "SELECT * FROM ProductReviews WHERE product_name = ? ORDER BY Created_at DESC",
   [req.params.product_name],
   (err, results) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(results);
   }
 );
});


// Create review
app.post("/api/reviews", (req, res) => {
 const { user_id, product_name, rating, review_text } = req.body;
 db.query(
   "INSERT INTO ProductReviews (user_id, product_name, rating, review_text) VALUES (?, ?, ?, ?)",
   [user_id, product_name, rating, review_text],
   (err, result) => {
     if (err) return res.status(500).json({ error: err.message });
     res.status(201).json({ review_id: result.insertId, message: "Review submitted" });
   }
 );
});


// ── Start Server ──────────────────────────────────────────────────────────────


app.listen(3001, () => {
 console.log("🚀 Server running on port 3001");
});



app.get("/api/admin/users", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM users");
  res.json(rows);
});