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

// ── Support & Mentorship ──────────────────────────────────────────────────────

export const getMentors = async (user_id) => {
  const url = user_id
    ? `${BASE_URL}/api/mentors?user_id=${user_id}`
    : `${BASE_URL}/api/mentors`
  const res = await fetch(url, { headers })
  return res.json()
}

export const requestMentor = async (user_id, mentor_id) => {
  const res = await fetch(`${BASE_URL}/api/mentors/request`, {
    method: 'POST', headers,
    body: JSON.stringify({ user_id, mentor_id }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Request failed')
  }
  return res.json()
}

export const getSentRequests = async (user_id) => {
  const res = await fetch(`${BASE_URL}/api/mentors/requests/${user_id}`, { headers })
  return res.json()
}

export const getNotifications = async (user_id) => {
  const res = await fetch(`${BASE_URL}/api/notifications/${user_id}`, { headers })
  return res.json()
}

export const cancelMentorRequest = async (user_id, mentor_id) => {
  const res = await fetch(`${BASE_URL}/api/mentors/request`, {
    method: 'DELETE', headers,
    body: JSON.stringify({ user_id, mentor_id }),
  })
  return res.json()
}

export const createOrganization = async (data) => {
  const res = await fetch(`${BASE_URL}/api/organizations`, {
    method: 'POST', headers,
    body: JSON.stringify(data),
  })
  return res.json()
}

export const getOrganizations = async () => {
  const res = await fetch(`${BASE_URL}/api/organizations`, { headers })
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

// ── Events ─────────────────────────────────────────────────────────────────────

export const getEvents = async () => {
  const res = await fetch(`${BASE_URL}/api/events`, { headers });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
};

export const getEventById = async (event_id) => {
  const res = await fetch(`${BASE_URL}/api/events/${event_id}`, { headers });
  if (!res.ok) throw new Error("Failed to fetch event");
  return res.json();
};

export const createEvent = async ({ title, description, event_date, location, created_by }) => {
  const res = await fetch(`${BASE_URL}/api/events`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, description, event_date, location, created_by }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Backend error:', data);
    throw new Error('Failed to create event');
  }
  return data;
};

export const updateEvent = async (event_id, { title, description, event_date, location }) => {
  const res = await fetch(`${BASE_URL}/api/events/${event_id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ title, description, event_date, location }),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
};

export const deleteEvent = async (event_id) => {
  const res = await fetch(`${BASE_URL}/api/events/${event_id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete event");
  return res.json();
};
