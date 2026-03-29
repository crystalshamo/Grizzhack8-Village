import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Linking, ActivityIndicator,
  TextInput, Modal, Pressable, KeyboardAvoidingView,
} from 'react-native'
import { shared } from '../../styles/shared'
import {
  getMentors, getOrganizations, requestMentor,
  cancelMentorRequest, getSentRequests, createOrganization,
} from '../../api/api'

const TABS = ['Mentors', 'Organizations']

export default function SupportScreen({ user }) {
  const [activeTab, setActiveTab] = useState('Mentors')
  const [mentors, setMentors]     = useState([])
  const [orgs, setOrgs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [requested, setRequested] = useState({}) // mentor_id -> true

  // add org modal
  const [addOrgOpen, setAddOrgOpen] = useState(false)
  const [orgForm, setOrgForm]       = useState({ name: '', tagline: '', url: '', icon: '', topics: '' })
  const [orgSaving, setOrgSaving]   = useState(false)

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
      // optimistic cancel
      setRequested(prev => { const n = { ...prev }; delete n[mentorId]; return n })
      cancelMentorRequest(user.user_id, mentorId).catch(() => {
        // revert if server failed
        setRequested(prev => ({ ...prev, [mentorId]: true }))
      })
    } else {
      // optimistic send — turn green immediately
      setRequested(prev => ({ ...prev, [mentorId]: true }))
      requestMentor(user.user_id, mentorId).catch((err) => {
        console.warn('Mentor request failed:', err.message)
        // revert if server failed
        setRequested(prev => { const n = { ...prev }; delete n[mentorId]; return n })
      })
    }
  }

  async function handleAddOrg() {
    if (!orgForm.name || !orgForm.url) return
    setOrgSaving(true)
    try {
      const res = await createOrganization({
        name:       orgForm.name.trim(),
        tagline:    orgForm.tagline.trim(),
        url:        orgForm.url.trim(),
        icon:       orgForm.icon.trim() || '🏢',
        topics:     orgForm.topics.trim(),
        color:      '#EEF2FF',
        text_color: '#4F46E5',
      })
      if (res.org_id) {
        const fresh = await getOrganizations()
        setOrgs(Array.isArray(fresh) ? fresh : [])
        setOrgForm({ name: '', tagline: '', url: '', icon: '', topics: '' })
        setAddOrgOpen(false)
      }
    } catch (err) {
      console.error('Failed to add org:', err)
    } finally {
      setOrgSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Add Organization Modal */}
      <Modal visible={addOrgOpen} transparent animationType="slide" onRequestClose={() => setAddOrgOpen(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={s.modalBackdrop} onPress={() => setAddOrgOpen(false)} />
          <View style={s.modalPanel}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Organization</Text>
              <TouchableOpacity onPress={() => setAddOrgOpen(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.fieldLabel}>Name *</Text>
              <TextInput style={s.input} placeholder="Organization name" placeholderTextColor="#B0B4C8"
                value={orgForm.name} onChangeText={v => setOrgForm(p => ({ ...p, name: v }))} />

              <Text style={s.fieldLabel}>Tagline</Text>
              <TextInput style={s.input} placeholder="Short description" placeholderTextColor="#B0B4C8"
                value={orgForm.tagline} onChangeText={v => setOrgForm(p => ({ ...p, tagline: v }))} />

              <Text style={s.fieldLabel}>Website URL *</Text>
              <TextInput style={s.input} placeholder="https://..." placeholderTextColor="#B0B4C8"
                value={orgForm.url} onChangeText={v => setOrgForm(p => ({ ...p, url: v }))}
                autoCapitalize="none" keyboardType="url" />

              <Text style={s.fieldLabel}>Icon (emoji)</Text>
              <TextInput style={s.input} placeholder="🏢" placeholderTextColor="#B0B4C8"
                value={orgForm.icon} onChangeText={v => setOrgForm(p => ({ ...p, icon: v }))} />

              <Text style={s.fieldLabel}>Topics (comma separated)</Text>
              <TextInput style={s.input} placeholder="Health, Education, Mental Health" placeholderTextColor="#B0B4C8"
                value={orgForm.topics} onChangeText={v => setOrgForm(p => ({ ...p, topics: v }))} />

              <TouchableOpacity
                style={[s.requestBtn, { marginTop: 20 }, (!orgForm.name || !orgForm.url) && { opacity: 0.5 }]}
                onPress={handleAddOrg}
                disabled={orgSaving || !orgForm.name || !orgForm.url}
                activeOpacity={0.85}
              >
                {orgSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.requestBtnText}>Add Organization</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView contentContainerStyle={shared.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={shared.screenHeader}>
          <Text style={shared.screenTitle}>Support & Mentorship</Text>
          <Text style={shared.screenSubtitle}>Connect with mentors and local organizations</Text>
        </View>

        {/* Tab switcher */}
        <View style={s.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mentors tab */}
        {activeTab === 'Mentors' && (
          <View>
            <Text style={s.sectionHint}>
              Experienced parents sorted by how closely they match your profile.
            </Text>
            {mentors.length === 0 && (
              <View style={shared.card}>
                <Text style={s.emptyText}>No mentors available yet.</Text>
              </View>
            )}
            {mentors.map(mentor => {
              const initials  = mentor.name?.trim().charAt(0).toUpperCase() ?? '?'
              const topics    = Array.isArray(mentor.topics) ? mentor.topics : []
              const isSent    = !!requested[mentor.user_id]
              return (
                <View key={mentor.user_id} style={[shared.card, { marginBottom: 12 }]}>
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
                        <Text style={s.matchBadgeText}>⭐ {mentor.score} match</Text>
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
                      {isSent ? 'Request Sent — Tap to Cancel' : 'Connect with Mentor'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        )}

        {/* Organizations tab */}
        {activeTab === 'Organizations' && (
          <View>
            <View style={s.orgTabHeader}>
              <Text style={s.sectionHint}>Local and national organizations supporting your parenting journey.</Text>
              <TouchableOpacity style={s.addOrgBtn} onPress={() => setAddOrgOpen(true)} activeOpacity={0.85}>
                <Text style={s.addOrgBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {orgs.length === 0 && (
              <View style={shared.card}>
                <Text style={s.emptyText}>No organizations listed yet. Add one!</Text>
              </View>
            )}
            {orgs.map(org => {
              const topics = typeof org.topics === 'string'
                ? org.topics.split(',').map(t => t.trim()).filter(Boolean)
                : []
              return (
                <TouchableOpacity
                  key={org.org_id}
                  style={[shared.card, { marginBottom: 12 }]}
                  onPress={() => Linking.openURL(org.url).catch(() => {})}
                  activeOpacity={0.8}
                >
                  <View style={s.orgRow}>
                    <View style={[s.orgIcon, { backgroundColor: org.color }]}>
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
                        <View key={t} style={[s.topicChip, { backgroundColor: org.color }]}>
                          <Text style={[s.topicText, { color: org.text_color }]}>{t}</Text>
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#EBEBF5',
    borderRadius: 14, padding: 4, marginBottom: 16,
  },
  tab:           { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  tabText:       { fontSize: 14, fontWeight: '600', color: '#8B8FA8' },
  tabTextActive: { color: '#1A1A2E' },

  sectionHint: { fontSize: 13, color: '#8B8FA8', marginBottom: 14, lineHeight: 19, flex: 1 },
  emptyText:   { fontSize: 14, color: '#8B8FA8', textAlign: 'center', paddingVertical: 12 },

  mentorHeader: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center',
  },
  avatarText:  { fontSize: 20, fontWeight: '700', color: '#fff' },
  mentorName:  { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  mentorStage: { fontSize: 12, color: '#8B8FA8', marginTop: 2 },
  mentorZip:   { fontSize: 12, color: '#8B8FA8', marginTop: 1 },
  mentorBio:   { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 10 },

  matchBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  matchBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },

  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  topicChip: { backgroundColor: '#EEF2FF', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  topicText: { fontSize: 11, fontWeight: '600', color: '#4F46E5' },

  requestBtn:     { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  requestBtnSent: { backgroundColor: '#16A34A' },
  requestBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  orgTabHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  addOrgBtn: {
    backgroundColor: '#4F46E5', borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 14, marginBottom: 14,
  },
  addOrgBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  orgRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  orgIcon:    { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  orgIconText: { fontSize: 22 },
  orgName:    { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  orgTagline: { fontSize: 12, color: '#8B8FA8' },
  orgArrow:   { fontSize: 22, color: '#C4C8D8' },

  // modal
  modalOverlay:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,18,30,0.4)' },
  modalPanel: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  modalClose:   { fontSize: 16, color: '#8B8FA8', padding: 4 },
  fieldLabel:   { fontSize: 12, fontWeight: '700', color: '#8B8FA8', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1A1A2E', borderWidth: 1, borderColor: '#EBEBF5',
  },
})
