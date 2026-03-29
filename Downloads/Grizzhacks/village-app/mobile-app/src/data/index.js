export const FORUM_POSTS = [
  {
    id: 1, author: 'Maya R.', avatar: 'M', avatarColor: '#A78BFA', time: '2h ago',
    title: 'Looking for volunteer mentors in tech',
    body: 'Our community center is seeking experienced developers to mentor youth aged 14–18. Even one hour a week makes a huge difference.',
    likes: 24, replies: 8, tag: 'Volunteering', tagBg: '#E0F2FE', tagTextColor: '#0284C7',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
    comments: [
      { author: 'Jordan K.', avatar: 'J', avatarColor: '#34D399', time: '1h ago', body: 'I can help out on weekends!' },
      { author: 'Priya S.', avatar: 'P', avatarColor: '#F87171', time: '45m ago', body: 'Count me in for Wednesdays.' },
    ],
  },
  {
    id: 2, author: 'Jordan K.', avatar: 'J', avatarColor: '#34D399', time: '5h ago',
    title: 'Weekend food drive — need drivers!',
    body: 'We have donations coming in Saturday morning but not enough drivers to distribute. Gas reimbursement provided.',
    likes: 41, replies: 13, tag: 'Food & Aid', tagBg: '#FEF3C7', tagTextColor: '#B45309',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    comments: [
      { author: 'Maya R.', avatar: 'M', avatarColor: '#A78BFA', time: '2h ago', body: 'I have a car and can help deliver.' },
      { author: 'Omar T.', avatar: 'O', avatarColor: '#FBBF24', time: '1h ago', body: 'I can do a morning shift.' },
    ],
  },
  {
    id: 3, author: 'Priya S.', avatar: 'P', avatarColor: '#F87171', time: '1d ago',
    title: 'Community garden plot available',
    body: 'One raised-bed plot opened up at Riverside Garden. Great for families or small groups. Apply by Sunday.',
    likes: 17, replies: 5, tag: 'Community', tagBg: '#F0FDF4', tagTextColor: '#16A34A',
    image: '',
    comments: [
      { author: 'Omar T.', avatar: 'O', avatarColor: '#FBBF24', time: '12h ago', body: 'I know a family who would love this.' },
    ],
  },
  {
    id: 4, author: 'Omar T.', avatar: 'O', avatarColor: '#FBBF24', time: '2d ago',
    title: 'Mental health check-in: how is everyone doing?',
    body: "No agenda here — just wanted to open a space for people to share how they're holding up. This community is a safe place.",
    likes: 89, replies: 34, tag: 'Wellness', tagBg: '#FDF4FF', tagTextColor: '#9333EA',
    image: '',
    comments: [
      { author: 'Jordan K.', avatar: 'J', avatarColor: '#34D399', time: '1d ago', body: 'Thanks for starting this, Omar.' },
      { author: 'Priya S.', avatar: 'P', avatarColor: '#F87171', time: '22h ago', body: 'Sending love to everyone.' },
    ],
  },
]

export const CHAT_THREADS = [
  { id: 1, name: 'Maya R.', avatar: 'M', avatarColor: '#A78BFA', preview: 'Thanks for reaching out!', time: '10m', unread: 2 },
  { id: 2, name: 'Jordan K.', avatar: 'J', avatarColor: '#34D399', preview: 'Are you still available Saturday?', time: '1h', unread: 0 },
  { id: 3, name: 'Village Volunteers', avatar: 'V', avatarColor: '#6366F1', preview: 'Omar: See you all there 👋', time: '3h', unread: 5 },
  { id: 4, name: 'Priya S.', avatar: 'P', avatarColor: '#F87171', preview: 'The plot is yours if you want it!', time: '1d', unread: 0 },
]

export const DONATION_REQUESTS = [
  { id: 1, title: 'Winter coats for 12 families', goal: 600, raised: 420, category: 'Clothing', urgent: true },
  { id: 2, title: 'School supplies — back to school drive', goal: 300, raised: 300, category: 'Education', urgent: false },
  { id: 3, title: 'Emergency rent assistance — the Nguyen family', goal: 1200, raised: 740, category: 'Housing', urgent: true },
  { id: 4, title: 'Community kitchen equipment', goal: 800, raised: 190, category: 'Food', urgent: false },
]

export const NAV_ITEMS = [
  { id: 'profile',    label: 'Profile',    icon: '👤' },
  { id: 'forums',     label: 'Forums',     icon: '💬' },
  { id: 'connecting', label: 'Connecting', icon: '🔗' },
  { id: 'donations',  label: 'Donations',  icon: '🤝' },
]
