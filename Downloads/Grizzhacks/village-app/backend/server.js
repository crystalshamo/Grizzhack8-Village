const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Password",
  password: "Password",
  database: "village_app",
});

app.get("/", (req, res) => {
  res.send("Village backend is running 🚀");
});

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
      "SELECT user_id, name, email, password_hash AS stored_hash, is_mentor, zipcode, about_text FROM Users WHERE email = ?",
      "SELECT user_id, name, email, password_hash AS stored_hash, is_mentor, zipcode, about_text FROM Users WHERE email = ?",
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
      "SELECT user_id, name, email, is_mentor, zipcode, about_text FROM Users WHERE user_id = ?",
      "SELECT user_id, name, email, is_mentor, zipcode, about_text FROM Users WHERE user_id = ?",
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
  const { name, zipcode, is_mentor, about_text } = req.body;

  if (!req.params.id) {
    return res.status(400).json({ error: "Missing user id" });
  }

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE Users SET name = ?, zipcode = ?, is_mentor = ?, about_text = ? WHERE user_id = ?",
      [
        name.trim(),
        typeof zipcode === "string" ? zipcode.trim() : "",
        !!is_mentor,
        typeof about_text === "string" ? about_text.trim() : "",
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [rows] = await db.query(
      "SELECT user_id, name, email, is_mentor, zipcode, about_text FROM Users WHERE user_id = ?",
      [req.params.id]
    );

    res.json({ message: "User updated", user: rows[0] });
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Admin ─────────────────────────────────────────────────────────────────────

app.get("/api/admin/users", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, name, email, is_mentor, zipcode, about_text FROM Users"
    );
    res.json({ message: "All users fetched successfully", data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Mentors ───────────────────────────────────────────────────────────────────

async function getUserAnswers(user_id) {
  const [answers] = await db.query(
    `SELECT q.question_text, a.answer_text, q.category
     FROM Answers a
     JOIN Questions q ON a.question_id = q.question_id
     WHERE a.user_id = ?`,
    [user_id]
  );
  return answers;
}

function extractProfile(answers) {
  const stageAnswer  = answers.find(a => a.question_text.toLowerCase().includes("ages or stages"));
  const topicsAnswer = answers.find(a => a.question_text.toLowerCase().includes("topics"));
  return {
    stage:  stageAnswer?.answer_text ?? "",
    topics: topicsAnswer?.answer_text
      ? topicsAnswer.answer_text.split(", ").map(t => t.trim())
      : [],
  };
}

function scoreMatch(user, userProfile, mentor, mentorProfile) {
  let score = 0;

  if (user.zipcode && mentor.zipcode && user.zipcode === mentor.zipcode) score += 3;

  const sharedTopics = userProfile.topics.filter(t => mentorProfile.topics.includes(t));
  score += sharedTopics.length * 2;

  if (userProfile.stage && mentorProfile.stage) {
    const userStages   = userProfile.stage.split(", ");
    const mentorStages = mentorProfile.stage.split(", ");
    if (userStages.some(s => mentorStages.includes(s))) score += 1;
  }

  return score;
}

app.get("/api/mentors", async (req, res) => {
  const { user_id } = req.query;

  try {
    const [mentors] = await db.query(
      "SELECT user_id, name, zipcode, about_text FROM Users WHERE is_mentor = 1"
    );

    let requestingUser = null;
    let userProfile    = { stage: "", topics: [] };
    if (user_id) {
      const [[u]] = await db.query(
        "SELECT user_id, zipcode FROM Users WHERE user_id = ?", [user_id]
      );
      requestingUser = u ?? null;
      if (requestingUser) {
        const answers = await getUserAnswers(user_id);
        userProfile   = extractProfile(answers);
      }
    }

    const mentorData = await Promise.all(
      mentors.map(async (mentor) => {
        if (String(mentor.user_id) === String(user_id)) return null;
        const answers       = await getUserAnswers(mentor.user_id);
        const mentorProfile = extractProfile(answers);
        const score         = requestingUser
          ? scoreMatch(requestingUser, userProfile, mentor, mentorProfile)
          : 0;

        return {
          ...mentor,
          stage:  mentorProfile.stage  || null,
          topics: mentorProfile.topics.slice(0, 3),
          score,
        };
      })
    );

    const filtered = mentorData.filter(Boolean).sort((a, b) => b.score - a.score);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// app.post("/api/mentors/request", async (req, res) => {
//   const { user_id, mentor_id } = req.body;
//   try {
//     await db.query(
//       "INSERT INTO MentorRequests (user_id, mentor_id, status) VALUES (?, ?, 'pending')" +
//       " ON DUPLICATE KEY UPDATE status = 'pending', created_at = NOW()",
//       [user_id, mentor_id]
//     );

//     const [[requester]] = await db.query(
//       "SELECT name FROM Users WHERE user_id = ?", [user_id]
//     );

//     await db.query(
//       "INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, 'mentor_request')",
//       [mentor_id, `${requester?.name ?? "Someone"} wants to connect with you as a mentor`]
//     );

//     res.status(201).json({ message: "Request sent" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// ─────────────────────────────────────────────────────────────────────────────
// Like a post
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/posts/:id/like", async (req, res) => {
  try {
    await db.query(
      "UPDATE Posts SET like_count = like_count + 1 WHERE post_id = ?",
      [req.params.id]
    );

    const [[post]] = await db.query(
      "SELECT like_count FROM Posts WHERE post_id = ?",
      [req.params.id]
    );

    res.json({ like_count: post.like_count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// Unlike a post
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/posts/:id/unlike", async (req, res) => {
  try {
    await db.query(
      "UPDATE Posts SET like_count = GREATEST(like_count - 1, 0) WHERE post_id = ?",
      [req.params.id]
    );

    const [[post]] = await db.query(
      "SELECT like_count FROM Posts WHERE post_id = ?",
      [req.params.id]
    );

    res.json({ like_count: post.like_count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mentors/requests/:user_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT mentor_id FROM MentorRequests WHERE user_id = ?",
      [req.params.user_id]
    );
    res.json(rows.map(r => r.mentor_id));
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Notifications ─────────────────────────────────────────────────────────────

app.get("/api/notifications/:user_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    await db.query("UPDATE Notifications SET is_read = 1 WHERE notification_id = ?", [req.params.id]);
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Organizations ─────────────────────────────────────────────────────────────

app.get("/api/organizations", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Organizations ORDER BY org_id ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/organizations", async (req, res) => {
  const { name, icon, tagline, topics, url, color, text_color } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO Organizations (name, icon, tagline, topics, url, color, text_color) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, icon, tagline, topics, url, color ?? "#EEF2FF", text_color ?? "#4F46E5"]
    );
    res.status(201).json({ org_id: result.insertId, message: "Organization created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ── Forums ────────────────────────────────────────────────────────────────────

app.get("/api/forums", async (req, res) => {
  try {
    const [results] = await db.query("SELECT forum_id, name FROM Forums ORDER BY name ASC");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Posts ─────────────────────────────────────────────────────────────────────

// Get all posts with user name, forum name, comment count, and like count
app.get("/api/posts", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT p.post_id, p.content, p.image_url, p.is_anonymous, p.prompt_id, p.like_count, p.created_at, p.forum_id,
              u.name AS author_name, f.name AS forum_name,
              (SELECT COUNT(*) FROM Comments c WHERE c.post_id = p.post_id) AS comment_count
       FROM Posts p
       LEFT JOIN Users u ON p.user_id = u.user_id
       LEFT JOIN Forums f ON p.forum_id = f.forum_id
       ORDER BY p.created_at DESC`
    );
    const posts = results.map(post => ({
      ...post,
      forum_name: post.forum_name || `Forum #${post.forum_id}`
    }));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/posts", async (req, res) => {
  let { user_id, content, image_url, is_anonymous, prompt_id, forum_id } = req.body;
  forum_id = forum_id !== undefined && forum_id !== null ? parseInt(forum_id, 10) : null;

  try {
    const values = [user_id, content, image_url ?? null, is_anonymous ?? false, prompt_id ?? null, forum_id];
    const [result] = await db.query(
      "INSERT INTO Posts (user_id, content, image_url, is_anonymous, prompt_id, forum_id) VALUES (?, ?, ?, ?, ?, ?)",
      values
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

app.get("/api/posts/:id/comments", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT c.comment_id, c.content, c.created_at, u.name AS author_name
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

app.get("/api/posts/search", async (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  try {
    const search = `%${q}%`
    const [results] = await db.query(
      `SELECT p.post_id, p.content, p.image_url, p.is_anonymous, p.prompt_id, p.like_count, p.created_at, p.forum_id,
              u.name AS author_name, f.name AS forum_name,
              (SELECT COUNT(*) FROM Comments c WHERE c.post_id = p.post_id) AS comment_count
       FROM Posts p
       LEFT JOIN Users u ON p.user_id = u.user_id
       LEFT JOIN Forums f ON p.forum_id = f.forum_id
       WHERE p.content LIKE ? OR f.name LIKE ? OR u.name LIKE ?
       ORDER BY p.created_at DESC`,
      [search, search, search]
    );
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

// ── Chats ─────────────────────────────────────────────────────────────────────

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

// // ── Donations ─────────────────────────────────────────────────────────────────

// app.get("/api/donations", async (req, res) => {
//   try {
//     const [results] = await db.query(
//       `SELECT d.*, u.name AS donor_name
//        FROM Donations d
//        JOIN Users u ON d.user_id = u.user_id
//        ORDER BY d.created_at DESC`
//     );
//     res.json(results);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post("/api/donations", async (req, res) => {
//   const { user_id, item, quantity, status } = req.body;

//   try {
//     const [result] = await db.query(
//       "INSERT INTO Donations (user_id, item, quantity, status) VALUES (?, ?, ?, ?)",
//       [user_id, item, quantity, status ?? "pending"]
//     );
//     res.status(201).json({ donation_id: result.insertId, message: "Donation created" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.put("/api/donations/:id", async (req, res) => {
//   const { status } = req.body;

//   try {
//     await db.query(
//       "UPDATE Donations SET status = ? WHERE donation_id = ?",
//       [status, req.params.id]
//     );
//     res.json({ message: "Donation status updated" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// ── Donations ─────────────────────────────────────────────────────────────────

// Get all donations/requests with donor name
// Optional query params: ?category=Baby  ?urgent=1
app.get("/api/donations", async (req, res) => {
  const { category, urgent } = req.query;

  let query = `
    SELECT d.*, u.name AS donor_name
    FROM Donations d
    JOIN Users u ON d.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += " AND d.category = ?";
    params.push(category);
  }
  if (urgent !== undefined) {
    query += " AND d.urgent = ?";
    params.push(urgent === "1" ? 1 : 0);
  }

  query += " ORDER BY d.urgent DESC, d.created_at DESC";

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single donation by ID
app.get("/api/donations/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT d.*, u.name AS donor_name
       FROM Donations d
       JOIN Users u ON d.user_id = u.user_id
       WHERE d.donation_id = ?`,
      [req.params.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Donation not found" });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new donation request
// Body: { user_id, title, category, goal, urgent, item, quantity }
app.post("/api/donations", async (req, res) => {
  const { user_id, title, category, goal, urgent, item, quantity } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO Donations 
        (user_id, title, category, goal, raised, urgent, item, quantity, status)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'active')`,
      [
        user_id,
        title ?? item ?? "",
        category ?? null,
        goal ?? 0,
        urgent ? 1 : 0,
        item ?? title ?? "",
        quantity ?? 0,
      ]
    );

    res.status(201).json({ donation_id: result.insertId, message: "Donation request created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contribute to a donation (increment raised amount)
// Body: { amount }
app.post("/api/donations/:id/contribute", async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  try {
    await db.query(
      "UPDATE Donations SET raised = raised + ? WHERE donation_id = ?",
      [amount, req.params.id]
    );

    // Auto-fulfill if raised >= goal
    await db.query(
      "UPDATE Donations SET status = 'fulfilled' WHERE donation_id = ? AND goal > 0 AND raised >= goal",
      [req.params.id]
    );

    const [rows] = await db.query(
      "SELECT * FROM Donations WHERE donation_id = ?",
      [req.params.id]
    );

    res.json({ message: "Contribution recorded", donation: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update donation status or urgent flag
// Body: { status?, urgent? }
app.put("/api/donations/:id", async (req, res) => {
  const { status, urgent, title, category, goal } = req.body;

  try {
    const fields = [];
    const params = [];

    if (status !== undefined)   { fields.push("status = ?");   params.push(status); }
    if (urgent !== undefined)   { fields.push("urgent = ?");   params.push(urgent ? 1 : 0); }
    if (title !== undefined)    { fields.push("title = ?");    params.push(title); }
    if (category !== undefined) { fields.push("category = ?"); params.push(category); }
    if (goal !== undefined)     { fields.push("goal = ?");     params.push(goal); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.params.id);
    await db.query(
      `UPDATE Donations SET ${fields.join(", ")} WHERE donation_id = ?`,
      params
    );

    res.json({ message: "Donation updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a donation request
app.delete("/api/donations/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM Donations WHERE donation_id = ?", [req.params.id]);
    res.json({ message: "Donation deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all donations created by a specific user
app.get("/api/users/:id/donations", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM Donations WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── Product Reviews ───────────────────────────────────────────────────────────

// Get all reviews
// Optional query params: ?category=Strollers  ?product_name=Graco
app.get("/api/reviews", async (req, res) => {
  const { category, product_name } = req.query;

  let query = `
    SELECT r.*, u.name AS reviewer_name
    FROM ProductReviews r
    JOIN Users u ON r.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += " AND r.category = ?";
    params.push(category);
  }
  if (product_name) {
    query += " AND r.product_name LIKE ?";
    params.push(`%${product_name}%`);
  }

  query += " ORDER BY r.created_at DESC";

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get top-rated products (aggregated)
app.get("/api/reviews/top-rated", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT product_name, category,
              ROUND(AVG(rating), 1) AS avg_rating,
              COUNT(*) AS review_count
       FROM ProductReviews
       GROUP BY product_name, category
       HAVING review_count >= 1
       ORDER BY avg_rating DESC, review_count DESC
       LIMIT 20`
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all reviews for a specific product
app.get("/api/reviews/product/:product_name", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM ProductReviews r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.product_name = ?
       ORDER BY r.created_at DESC`,
      [req.params.product_name]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single review by ID
app.get("/api/reviews/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM ProductReviews r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.review_id = ?`,
      [req.params.id]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new product review
// Body: { user_id, product_name, category, rating, review_text }
app.post("/api/reviews", async (req, res) => {
  const { user_id, product_name, category, rating, review_text } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  if (!product_name) {
    return res.status(400).json({ error: "Product name is required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO ProductReviews (user_id, product_name, category, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, product_name, category ?? null, rating, review_text ?? ""]
    );

    res.status(201).json({ review_id: result.insertId, message: "Review created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a review
// Body: { rating?, review_text? }
app.put("/api/reviews/:id", async (req, res) => {
  const { rating, review_text } = req.body;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const fields = [];
    const params = [];

    if (rating !== undefined)      { fields.push("rating = ?");      params.push(rating); }
    if (review_text !== undefined) { fields.push("review_text = ?"); params.push(review_text); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.params.id);
    await db.query(
      `UPDATE ProductReviews SET ${fields.join(", ")} WHERE review_id = ?`,
      params
    );

    res.json({ message: "Review updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a review
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM ProductReviews WHERE review_id = ?", [req.params.id]);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all reviews by a specific user
app.get("/api/users/:id/reviews", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM ProductReviews WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(results);
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

app.delete("/api/mentors/request", async (req, res) => {
  const { user_id, mentor_id } = req.body;
  try {
    await db.query(
      "DELETE FROM MentorRequests WHERE user_id = ? AND mentor_id = ?",
      [user_id, mentor_id]
    );
    res.json({ message: "Request cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mentors/requests/:user_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT mentor_id FROM MentorRequests WHERE user_id = ?",
      [req.params.user_id]
    );
    res.json(rows.map(r => r.mentor_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ── Start server ──────────────────────────────────────────────────────────────

app.listen(3001, () => {
  console.log("🚀 Server running on port 3001");
});