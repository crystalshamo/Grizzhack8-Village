import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Linking, ActivityIndicator,
  TextInput, Modal, Pressable, KeyboardAvoidingView,
} from 'react-native'
import { colors, fonts } from '../../styles/themes'
import {
  getMentors, getOrganizations, requestMentor,
  cancelMentorRequest, getSentRequests,
} from '../../api/api'

const TABS = ['Mentors', 'Organizations']

export default function SupportScreen({ user }) {
  const [activeTab, setActiveTab] = useState('Mentors')
  const [mentors, setMentors] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [requested, setRequested] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const [mentorData, orgData] = await Promise.all([
          getMentors(user?.user_id),
          getOrganizations(),
        ])
        setMentors(Array.isArray(mentorData) ? mentorData : [])
        setOrgs(Array.isArray(orgData) ? orgData : [])

        if (user?.user_id) {
          getSentRequests(user.user_id)
            .then(sentIds => {
              if (Array.isArray(sentIds)) {
                const map = {}
                sentIds.forEach(id => { map[id] = true })
                setRequested(map)
              }
            })
            .catch(() => {})
        }
      } catch (err) {
        console.error('Failed to load support data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function handleRequest(mentorId) {
    if (!user?.user_id) return
    if (requested[mentorId]) {
      setRequested(prev => { const n = { ...prev }; delete n[mentorId]; return n })
      cancelMentorRequest(user.user_id, mentorId).catch(() => {
        setRequested(prev => ({ ...prev, [mentorId]: true }))
      })
    } else {
      setRequested(prev => ({ ...prev, [mentorId]: true }))
      requestMentor(user.user_id, mentorId).catch(() => {
        setRequested(prev => { const n = { ...prev }; delete n[mentorId]; return n })
      })
    }
  }

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={colors.lightpurple} />
        <Text style={s.loadingText}>loading...</Text>
      </View>
    )
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>support</Text> 
      </View>

      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab.toLowerCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Mentors */}
        {activeTab === 'Mentors' && (
          <View>
            <Text style={s.sectionHint}>
              experienced parents sorted by how closely they match your profile.
            </Text>

            {mentors.length === 0 && (
              <View style={s.emptyCard}>
                <Text style={s.emptyIcon}>👩‍👧</Text>
                <Text style={s.emptyText}>no mentors available yet.</Text>
              </View>
            )}

            {mentors.map(mentor => {
              const initials = mentor.name?.trim().charAt(0).toUpperCase() ?? '?'
              const topics = Array.isArray(mentor.topics) ? mentor.topics : []
              const isSent = !!requested[mentor.user_id]

              return (
                <View key={mentor.user_id} style={s.card}>
                  <View style={s.mentorHeader}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.mentorName}>{mentor.name}</Text>
                      {mentor.stage ? <Text style={s.mentorStage}>{mentor.stage}</Text> : null}
                      {mentor.zipcode ? <Text style={s.mentorZip}>📍 {mentor.zipcode}</Text> : null}
                    </View>
                    {mentor.score > 0 && (
                      <View style={s.matchBadge}>
                        <Text style={s.matchBadgeText}>⭐ {mentor.score}</Text>
                      </View>
                    )}
                  </View>

                  {mentor.about_text ? <Text style={s.mentorBio}>{mentor.about_text}</Text> : null}

                  {topics.length > 0 && (
                    <View style={s.topicRow}>
                      {topics.map(t => (
                        <View key={t} style={s.topicChip}>
                          <Text style={s.topicText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[s.requestBtn, isSent && s.requestBtnSent]}
                    onPress={() => handleRequest(mentor.user_id)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.requestBtnText}>
                      {isSent ? '✓ request sent — tap to cancel' : 'connect with mentor'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        )}

        {/* Organizations */}
        {activeTab === 'Organizations' && (
          <View>
            <Text style={s.sectionHint}>
              local & national organizations supporting your journey.
            </Text>

            {orgs.length === 0 && (
              <View style={s.emptyCard}>
                <Text style={s.emptyIcon}>🏢</Text>
                <Text style={s.emptyText}>no organizations listed yet.</Text>
              </View>
            )}

            {orgs.map(org => {
              const topics = typeof org.topics === 'string'
                ? org.topics.split(',').map(t => t.trim()).filter(Boolean)
                : []

              return (
                <TouchableOpacity
                  key={org.org_id}
                  style={s.card}
                  onPress={() => Linking.openURL(org.url).catch(() => {})}
                  activeOpacity={0.8}
                >
                  <View style={s.orgRow}>
                    <View style={s.orgIcon}>
                      <Text style={s.orgIconText}>{org.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.orgName}>{org.name}</Text>
                      <Text style={s.orgTagline}>{org.tagline}</Text>
                    </View>
                    <Text style={s.orgArrow}>›</Text>
                  </View>

                  {topics.length > 0 && (
                    <View style={s.topicRow}>
                      {topics.map(t => (
                        <View key={t} style={s.topicChip}>
                          <Text style={s.topicText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.loginbackground },

  loadingWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.loginbackground,
  },
  loadingText: {
    color: colors.lightpurple, fontFamily: fonts.regular,
    fontSize: 14, marginTop: 12,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28, fontFamily: fonts.bold,
    color: colors.dark, letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13, fontFamily: fonts.regular,
    color: colors.dark, opacity: 0.5, marginTop: 2,
  },

 tabRow: {
  flexDirection: 'row',
  marginHorizontal: 20,
  marginBottom: 14,
  backgroundColor: colors.purple,
  borderRadius: 14,
  padding: 4,
},
tab: {
  flex: 1, paddingVertical: 10,
  alignItems: 'center', borderRadius: 11,
},
tabActive: { backgroundColor: colors.lightpurple },
tabText: { fontFamily: fonts.regular, fontSize: 13, color: colors.background }, // was colors.lightpurple
tabTextActive: { fontFamily: fonts.bold, color: colors.purple }, // this one is fine
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  sectionHint: {
    fontSize: 13, fontFamily: fonts.regular,
    color: colors.dark, opacity: 0.5,
    marginBottom: 14, lineHeight: 19,
  },

  emptyCard: {
    alignItems: 'center', paddingVertical: 40,
    backgroundColor: colors.purple, borderRadius: 18,
    marginBottom: 12,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: {
    fontSize: 14, fontFamily: fonts.regular,
    color: colors.lightpurple, opacity: 0.7,
  },

  card: {
    backgroundColor: colors.purple,
    borderRadius: 18, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },

  mentorHeader: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(184,180,242,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.3)',
  },
  avatarText: { fontSize: 18, fontFamily: fonts.bold, color: colors.lightpurple },
  mentorName: { fontSize: 15, fontFamily: fonts.bold, color: colors.background, marginBottom: 2 },
  mentorStage: { fontSize: 12, fontFamily: fonts.regular, color: colors.lightpurple, opacity: 0.7 },
  mentorZip: { fontSize: 12, fontFamily: fonts.regular, color: colors.lightpurple, opacity: 0.7, marginTop: 1 },
  mentorBio: {
    fontSize: 13, fontFamily: fonts.regular,
    color: colors.background, lineHeight: 20,
    marginBottom: 10, opacity: 0.8,
  },

  matchBadge: {
    backgroundColor: 'rgba(250,231,200,0.15)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(250,231,200,0.2)',
  },
  matchBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.beige },

  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  topicChip: {
    backgroundColor: 'rgba(184,180,242,0.15)',
    borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.2)',
  },
  topicText: { fontSize: 11, fontFamily: fonts.bold, color: colors.lightpurple },

  requestBtn: {
    backgroundColor: colors.beige,
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  requestBtnSent: { backgroundColor: 'rgba(184,180,242,0.2)', borderWidth: 1, borderColor: colors.lightpurple },
  requestBtnText: { color: colors.dark, fontSize: 14, fontFamily: fonts.bold },

  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  orgIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(184,180,242,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.2)',
  },
  orgIconText: { fontSize: 22 },
  orgName: { fontSize: 15, fontFamily: fonts.bold, color: colors.background, marginBottom: 2 },
  orgTagline: { fontSize: 12, fontFamily: fonts.regular, color: colors.lightpurple, opacity: 0.7 },
  orgArrow: { fontSize: 22, color: colors.lightpurple, opacity: 0.5 },
})