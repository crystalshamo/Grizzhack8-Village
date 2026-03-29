const BASE_URL = 'https://nonobligatorily-likeable-oneida.ngrok-free.dev'

const headers = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

// ── Auth / Users ──────────────────────────────────────────────────────────────

export const registerUser = async (name, email, password, zipcode, is_mentor) => {
  const res = await fetch(`${BASE_URL}/api/users/register`, {
    method: 'POST', headers,
    body: JSON.stringify({ name, email, password_hash: password, zipcode, is_mentor }),
  })
  return res.json()
}

export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST', headers,
    body: JSON.stringify({ email, password_hash: password }),
  })
  return res.json()
}

export const getProfile = async (user_id) => {
  const res = await fetch(`${BASE_URL}/api/users/${user_id}`, { headers })
  return res.json()
}

export const updateProfile = async (user_id, data) => {
  const res = await fetch(`${BASE_URL}/api/users/${user_id}`, {
    method: 'PUT', headers,
    body: JSON.stringify(data),
  })
  return res.json()
}

// ── Questions ─────────────────────────────────────────────────────────────────

export const getQuestions = async () => {
  const res = await fetch(`${BASE_URL}/api/questions`, { headers })
  return res.json()
}

// ── Onboarding Answers ────────────────────────────────────────────────────────

export const saveAnswers = async (user_id, answers) => {
  const res = await fetch(`${BASE_URL}/api/answers`, {
    method: 'POST', headers,
    body: JSON.stringify({ user_id, answers }),
  })
  return res.json()
}

export const getUserAnswers = async (user_id) => {
  const res = await fetch(`${BASE_URL}/api/answers/${user_id}`, { headers })
  return res.json()
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export const getPosts = async () => {
  const res = await fetch(`${BASE_URL}/api/posts`, { headers })
  return res.json()
}

export const createPost = async (user_id, content, tag, is_anonymous = false) => {
  const res = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST', headers,
    body: JSON.stringify({ user_id, content, tag, is_anonymous }),
  })
  return res.json()
}

export const likePost = async (id) => {
  const res = await fetch(`${BASE_URL}/api/posts/${id}/reactions`, {
    method: 'POST', headers,
    body: JSON.stringify({ reaction_type: 'like' }),
  })
  return res.json()
}

// ── Chats ─────────────────────────────────────────────────────────────────────

export const getChats = async (user_id) => {
  const res = await fetch(`${BASE_URL}/api/chats/${user_id}`, { headers })
  return res.json()
}

export const getMessages = async (chat_id) => {
  const res = await fetch(`${BASE_URL}/api/chats/${chat_id}/messages`, { headers })
  return res.json()
}

export const sendMessage = async (chat_id, sender_id, content) => {
  const res = await fetch(`${BASE_URL}/api/chats/${chat_id}/messages`, {
    method: 'POST', headers,
    body: JSON.stringify({ sender_id, content }),
  })
  return res.json()
}

// ── Donations ─────────────────────────────────────────────────────────────────

export const getDonations = async () => {
  const res = await fetch(`${BASE_URL}/api/donations`, { headers })
  return res.json()
}

export const createDonation = async (user_id, item, quantity) => {
  const res = await fetch(`${BASE_URL}/api/donations`, {
    method: 'POST', headers,
    body: JSON.stringify({ user_id, item, quantity }),
  })
  return res.json()
}
