import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Platform,
} from 'react-native'

type Tab = 'forums' | 'profile' | 'connecting' | 'donations'

// ── Data ──────────────────────────────────────────────────────────────────────

const FORUM_POSTS = [
  {
    id: 1, author: 'Maya R.', avatar: 'M', avatarColor: '#A78BFA', time: '2h ago',
    title: 'Looking for volunteer mentors in tech',
    body: 'Our community center is seeking experienced developers to mentor youth aged 14–18. Even one hour a week makes a huge difference.',
    likes: 24, replies: 8, tag: 'Volunteering', tagBg: '#E0F2FE', tagTextColor: '#0284C7',
  },
  {
    id: 2, author: 'Jordan K.', avatar: 'J', avatarColor: '#34D399', time: '5h ago',
    title: 'Weekend food drive — need drivers!',
    body: 'We have donations coming in Saturday morning but not enough drivers to distribute. Gas reimbursement provided.',
    likes: 41, replies: 13, tag: 'Food & Aid', tagBg: '#FEF3C7', tagTextColor: '#B45309',
  },
  {
    id: 3, author: 'Priya S.', avatar: 'P', avatarColor: '#F87171', time: '1d ago',
    title: 'Community garden plot available',
    body: 'One raised-bed plot opened up at Riverside Garden. Great for families or small groups. Apply by Sunday.',
    likes: 17, replies: 5, tag: 'Community', tagBg: '#F0FDF4', tagTextColor: '#16A34A',
  },
  {
    id: 4, author: 'Omar T.', avatar: 'O', avatarColor: '#FBBF24', time: '2d ago',
    title: 'Mental health check-in: how is everyone doing?',
    body: "No agenda here — just wanted to open a space for people to share how they're holding up. This community is a safe place.",
    likes: 89, replies: 34, tag: 'Wellness', tagBg: '#FDF4FF', tagTextColor: '#9333EA',
  },
]

const CHAT_THREADS = [
  { id: 1, name: 'Maya R.', avatar: 'M', avatarColor: '#A78BFA', preview: 'Thanks for reaching out!', time: '10m', unread: 2 },
  { id: 2, name: 'Jordan K.', avatar: 'J', avatarColor: '#34D399', preview: 'Are you still available Saturday?', time: '1h', unread: 0 },
  { id: 3, name: 'Village Volunteers', avatar: 'V', avatarColor: '#6366F1', preview: 'Omar: See you all there 👋', time: '3h', unread: 5 },
  { id: 4, name: 'Priya S.', avatar: 'P', avatarColor: '#F87171', preview: 'The plot is yours if you want it!', time: '1d', unread: 0 },
]

const DONATION_REQUESTS = [
  { id: 1, title: 'Winter coats for 12 families', goal: 600, raised: 420, category: 'Clothing', urgent: true },
  { id: 2, title: 'School supplies — back to school drive', goal: 300, raised: 300, category: 'Education', urgent: false },
  { id: 3, title: 'Emergency rent assistance — the Nguyen family', goal: 1200, raised: 740, category: 'Housing', urgent: true },
  { id: 4, title: 'Community kitchen equipment', goal: 800, raised: 190, category: 'Food', urgent: false },
]

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',    label: 'Profile',    icon: '👤' },
  { id: 'forums',     label: 'Forums',     icon: '💬' },
  { id: 'connecting', label: 'Connecting', icon: '🔗' },
  { id: 'donations',  label: 'Donations',  icon: '🤝' },
]

// ── Shared components ─────────────────────────────────────────────────────────

function Avatar({ letter, color, size = 38 }: { letter: string; color: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, backgroundColor: color, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  )
}

// ── Screens ───────────────────────────────────────────────────────────────────

function ForumsScreen() {
  return (
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.screenHeader}>
        <Text style={s.screenTitle}>Forums</Text>
        <Text style={s.screenSubtitle}>What's happening in the village</Text>
      </View>

      {FORUM_POSTS.map(post => (
        <View key={post.id} style={s.card}>
          <View style={s.forumTop}>
            <Avatar letter={post.avatar} color={post.avatarColor} />
            <View style={s.forumMeta}>
              <Text style={s.forumAuthor}>{post.author}</Text>
              <Text style={s.forumTime}>{post.time}</Text>
            </View>
            <View style={[s.tag, { backgroundColor: post.tagBg }]}>
              <Text style={[s.tagText, { color: post.tagTextColor }]}>{post.tag}</Text>
            </View>
          </View>
          <Text style={s.forumTitle}>{post.title}</Text>
          <Text style={s.forumBody}>{post.body}</Text>
          <View style={s.forumActions}>
            <TouchableOpacity style={s.actionBtn}>
              <Text style={s.actionBtnText}>♡  {post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn}>
              <Text style={s.actionBtnText}>💬  {post.replies}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { marginLeft: 'auto' }]}>
              <Text style={s.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

function ConnectingScreen() {
  return (
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.screenHeader}>
        <Text style={s.screenTitle}>Connecting</Text>
        <Text style={s.screenSubtitle}>Your conversations</Text>
      </View>

      {CHAT_THREADS.map(thread => (
        <TouchableOpacity key={thread.id} style={s.card} activeOpacity={0.8}>
          <View style={s.chatRow}>
            <View>
              <Avatar letter={thread.avatar} color={thread.avatarColor} size={46} />
              {thread.unread > 0 && (
                <View style={s.unreadBadge}>
                  <Text style={s.unreadText}>{thread.unread}</Text>
                </View>
              )}
            </View>
            <View style={s.chatInfo}>
              <View style={s.chatNameRow}>
                <Text style={s.chatName}>{thread.name}</Text>
                <Text style={s.chatTime}>{thread.time}</Text>
              </View>
              <Text style={s.chatPreview} numberOfLines={1}>{thread.preview}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

function DonationsScreen() {
  return (
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.screenHeader}>
        <Text style={s.screenTitle}>Donations</Text>
        <Text style={s.screenSubtitle}>Support your neighbors</Text>
      </View>

      <TouchableOpacity style={s.newRequestBtn} activeOpacity={0.85}>
        <Text style={s.newRequestBtnText}>+ New Request</Text>
      </TouchableOpacity>

      {DONATION_REQUESTS.map(req => {
        const pct = Math.min(100, Math.round((req.raised / req.goal) * 100))
        const funded = pct === 100
        return (
          <View key={req.id} style={s.card}>
            <View style={s.donationTop}>
              <View style={s.categoryBadge}>
                <Text style={s.categoryText}>{req.category}</Text>
              </View>
              {req.urgent && (
                <View style={s.urgentBadge}>
                  <Text style={s.urgentText}>Urgent</Text>
                </View>
              )}
            </View>
            <Text style={s.donationTitle}>{req.title}</Text>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: funded ? '#34D399' : '#6366F1' }]} />
            </View>
            <View style={s.donationAmounts}>
              <Text style={s.raisedText}>${req.raised.toLocaleString()} raised</Text>
              <Text style={s.donationGoal}>of ${req.goal.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={[s.donateBtn, funded && { opacity: 0.5 }]} activeOpacity={0.85} disabled={funded}>
              <Text style={s.donateBtnText}>{funded ? 'Fully Funded' : 'Donate'}</Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </ScrollView>
  )
}

function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={s.profileHero}>
        <View style={s.profileAvatarLarge}>
          <Text style={s.profileAvatarText}>C</Text>
        </View>
        <Text style={s.profileName}>Crystal S.</Text>
        <Text style={s.profileHandle}>@crystal · Village member since 2024</Text>
      </View>

      <View style={s.statsRow}>
        {[{ num: '12', label: 'Posts' }, { num: '5', label: 'Donations' }, { num: '38', label: 'Connections' }].map(stat => (
          <View key={stat.label} style={s.statBox}>
            <Text style={s.statNum}>{stat.num}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={[s.card, { marginBottom: 14 }]}>
        <Text style={s.bioLabel}>ABOUT</Text>
        <Text style={s.bioText}>
          Passionate about community building and local resilience. I help organize
          neighborhood drives and love connecting people with resources.
        </Text>
      </View>

      <View style={s.card}>
        {['Edit Profile', 'Notifications', 'Privacy', 'Log Out'].map((item, i, arr) => (
          <TouchableOpacity
            key={item}
            style={[s.settingsRow, i < arr.length - 1 && s.settingsRowBorder]}
            activeOpacity={0.7}
          >
            <Text style={[s.settingsLabel, item === 'Log Out' && { color: '#EF4444' }]}>{item}</Text>
            <Text style={s.settingsArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('forums')
  const [menuOpen, setMenuOpen] = useState(false)

  function navigate(tab: Tab) {
    setActiveTab(tab)
    setMenuOpen(false)
  }

  const currentLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label ?? ''

  return (
    <SafeAreaView style={s.shell}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Drawer modal */}
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <View style={s.drawerModal}>
          <Pressable style={s.drawerBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={s.drawer}>
            <View style={s.drawerTop}>
              <Text style={s.drawerLogo}>Village</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={s.drawerCloseBtn}>
                <Text style={s.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.drawerNav}>
              {NAV_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[s.drawerItem, activeTab === item.id && s.drawerItemActive]}
                  onPress={() => navigate(item.id)}
                  activeOpacity={0.75}
                >
                  <Text style={s.drawerIcon}>{item.icon}</Text>
                  <Text style={[s.drawerItemLabel, activeTab === item.id && s.drawerItemLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.hamburger} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <View style={s.hamLine} />
          <View style={s.hamLine} />
          <View style={s.hamLine} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>{currentLabel}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Screen */}
      <View style={{ flex: 1 }}>
        {activeTab === 'forums'     && <ForumsScreen />}
        {activeTab === 'connecting' && <ConnectingScreen />}
        {activeTab === 'donations'  && <DonationsScreen />}
        {activeTab === 'profile'    && <ProfileScreen />}
      </View>

      {/* Profile FAB */}
      {activeTab !== 'profile' && (
        <TouchableOpacity style={s.fab} onPress={() => navigate('profile')} activeOpacity={0.85}>
          <Text style={s.fabIcon}>👤</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamLine: {
    width: 20,
    height: 2,
    backgroundColor: '#1A1A2E',
    borderRadius: 2,
    marginVertical: 2,
  },

  // Drawer
  drawerModal: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,18,30,0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  drawerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F6',
  },
  drawerLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  drawerCloseBtn: { padding: 6, borderRadius: 8 },
  drawerCloseText: { fontSize: 16, color: '#8B8FA8' },
  drawerNav: { padding: 12 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  drawerItemActive: { backgroundColor: '#EEF2FF' },
  drawerIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  drawerItemLabel: { fontSize: 15, fontWeight: '500', color: '#8B8FA8' },
  drawerItemLabelActive: { color: '#4F46E5', fontWeight: '700' },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Screen header
  screenHeader: { marginBottom: 20 },
  screenTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  screenSubtitle: { fontSize: 14, color: '#8B8FA8' },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },

  // Avatar
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '700' },

  // Forum
  forumTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  forumMeta: { flex: 1 },
  forumAuthor: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  forumTime: { fontSize: 12, color: '#B0B4C8', marginTop: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },
  forumTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 7, lineHeight: 22 },
  forumBody: { fontSize: 14, color: '#6B7280', lineHeight: 21, marginBottom: 14 },
  forumActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F7FA' },
  actionBtnText: { fontSize: 13, color: '#8B8FA8', fontWeight: '500' },

  // Chat
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  unreadBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#EF4444', width: 17, height: 17,
    borderRadius: 9, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#ffffff',
  },
  unreadText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  chatInfo: { flex: 1 },
  chatNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 },
  chatName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  chatTime: { fontSize: 12, color: '#B0B4C8' },
  chatPreview: { fontSize: 13, color: '#8B8FA8' },

  // Donations
  newRequestBtn: {
    backgroundColor: '#4F46E5', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginBottom: 18,
    ...Platform.select({
      ios: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  newRequestBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  donationTop: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  categoryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  categoryText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  urgentBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  urgentText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  donationTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 14, lineHeight: 22 },
  progressBar: { height: 6, backgroundColor: '#F0F0F6', borderRadius: 6, overflow: 'hidden', marginBottom: 7 },
  progressFill: { height: '100%', borderRadius: 6 },
  donationAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  raisedText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  donationGoal: { fontSize: 13, color: '#B0B4C8' },
  donateBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  donateBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  // Profile
  profileHero: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  profileAvatarLarge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  profileAvatarText: { fontSize: 36, fontWeight: '700', color: '#ffffff' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  profileHandle: { fontSize: 13, color: '#8B8FA8' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statBox: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  statNum: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  statLabel: { fontSize: 12, color: '#8B8FA8', marginTop: 2 },
  bioLabel: { fontSize: 11, fontWeight: '700', color: '#8B8FA8', letterSpacing: 0.8, marginBottom: 8 },
  bioText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 2 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F7FA' },
  settingsLabel: { fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  settingsArrow: { fontSize: 20, color: '#C4C8D8' },

  // FAB
  fab: {
    position: 'absolute', bottom: 30, right: 22,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 10 },
    }),
  },
  fabIcon: { fontSize: 22 },
})
