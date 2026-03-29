import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native'

import { shared } from '../../styles/shared'
import { getChats, getDonations, getPosts, getProfile, updateProfile } from '../../api/api'

export default function ProfileScreen({ user }) {
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [donations, setDonations] = useState([])
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const [form, setForm] = useState({
    name: '',
    zipcode: '',
    about_text: '',
  })

  useEffect(() => {
    async function loadProfile() {
      if (!user?.user_id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      setSaveMessage('')

      try {
        const [profileRes, postsRes, donationsRes, chatsRes] = await Promise.all([
          getProfile(user.user_id),
          getPosts(),
          getDonations(),
          getChats(user.user_id),
        ])

        setProfile(profileRes)
        setPosts(Array.isArray(postsRes) ? postsRes : [])
        setDonations(Array.isArray(donationsRes) ? donationsRes : [])
        setChats(Array.isArray(chatsRes) ? chatsRes : [])

        setForm({
          name: profileRes?.name ?? user?.name ?? '',
          zipcode: profileRes?.zipcode ?? '',
          about_text: profileRes?.about_text ?? '',
        })
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError('Could not load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const stats = useMemo(() => {
    const postCount = posts.filter((post) => String(post.user_id) === String(user?.user_id)).length
    const donationCount = donations.filter(
      (donation) => String(donation.user_id) === String(user?.user_id)
    ).length
    const connectionCount = Array.isArray(chats) ? chats.length : 0

    return [
      { num: String(postCount), label: 'Posts' },
      { num: String(donationCount), label: 'Donations' },
      { num: String(connectionCount), label: 'Connections' },
    ]
  }, [posts, donations, chats, user])

  const initials = useMemo(() => {
    const source = form.name || profile?.name || user?.name || 'U'
    return source.trim().charAt(0).toUpperCase()
  }, [form.name, profile, user])

  const badges = useMemo(() => {
    const postCount     = posts.filter(p => String(p.user_id) === String(user?.user_id)).length
    const donationCount = donations.filter(d => String(d.user_id) === String(user?.user_id)).length
    const connectionCount = Array.isArray(chats) ? chats.length : 0
    const profileComplete = !!(profile?.name && profile?.zipcode && profile?.about_text?.trim())

    const earned = []

    if (postCount >= 1)        earned.push({ icon: '🤝', name: 'Neighbor',      desc: 'Made your first post' })
    if (postCount >= 5)        earned.push({ icon: '🏘️', name: 'Village Builder', desc: '5+ posts shared' })
    if (postCount >= 10)       earned.push({ icon: '✍️', name: 'Storyteller',    desc: '10+ posts shared' })
    if (donationCount >= 1)    earned.push({ icon: '🎁', name: 'Giver',          desc: 'Made your first donation' })
    if (donationCount >= 5)    earned.push({ icon: '💛', name: 'Generous',       desc: '5+ donations given' })
    if (profile?.is_mentor)    earned.push({ icon: '🌱', name: 'Mentor',         desc: 'Signed up to mentor others' })
    if (connectionCount >= 1)  earned.push({ icon: '🔗', name: 'Connected',      desc: 'Made a connection' })
    if (profileComplete)       earned.push({ icon: '👤', name: 'Complete',       desc: 'Filled out your full profile' })
    if (postCount >= 10 && donationCount >= 5)
                               earned.push({ icon: '🏆', name: 'Pillar',         desc: '10+ posts & 5+ donations' })

    return earned
  }, [posts, donations, chats, profile, user])

  const handleTextChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleSave() {
    if (!user?.user_id) {
      return
    }

    setSaving(true)
    setError('')
    setSaveMessage('')

    try {
      const res = await updateProfile(user.user_id, {
        name: form.name.trim(),
        zipcode: form.zipcode.trim(),
        is_mentor: profile?.is_mentor ?? user?.is_mentor ?? false,
        about_text: form.about_text.trim(),
      })

      if (res.error) {
        setError(res.error)
        return
      }

      const fresh = await getProfile(user.user_id)
      setProfile(fresh)

      setForm({
        name: fresh.name ?? '',
        zipcode: fresh.zipcode ?? '',
        about_text: fresh.about_text ?? '',
      })

      setEditing(false)
      setSaveMessage('Profile updated')
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setForm({
      name: profile?.name ?? user?.name ?? '',
      zipcode: profile?.zipcode ?? '',
      about_text: profile?.about_text ?? '',
    })

    setEditing(false)
    setError('')
    setSaveMessage('')
  }

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={shared.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.profileHero}>
        <View style={s.profileAvatarLarge}>
          <Text style={s.profileAvatarText}>{initials}</Text>
        </View>

        <Text style={s.profileName}>{profile?.name ?? user?.name ?? 'Village Member'}</Text>
        <Text style={s.profileHandle}>{profile?.email ?? user?.email ?? ''}</Text>

        <View style={s.badgesRow}>
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {profile?.is_mentor ? 'Mentor' : 'Member'}
            </Text>
          </View>

          {profile?.zipcode ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>ZIP {profile.zipcode}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={s.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={s.statBox}>
            <Text style={s.statNum}>{stat.num}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {badges.length > 0 && (
        <View style={[shared.card, { marginBottom: 14 }]}>
          <Text style={s.bioLabel}>BADGES</Text>
          <View style={s.badgeGrid}>
            {badges.map(b => (
              <View key={b.name} style={s.badgeTile}>
                <Text style={s.badgeTileIcon}>{b.icon}</Text>
                <Text style={s.badgeTileName}>{b.name}</Text>
                <Text style={s.badgeTileDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[shared.card, { marginBottom: 14 }]}>
        <View style={s.sectionHeader}>
          <Text style={s.bioLabel}>PROFILE</Text>

          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
              <Text style={s.editLink}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}
        {saveMessage ? <Text style={s.successText}>{saveMessage}</Text> : null}

        <Text style={s.fieldLabel}>Name</Text>
        {editing ? (
          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={(value) => handleTextChange('name', value)}
            placeholder="Your name"
            placeholderTextColor="#B0B4C8"
          />
        ) : (
          <Text style={s.valueText}>{profile?.name ?? '—'}</Text>
        )}

        <Text style={s.fieldLabel}>Zip Code</Text>
        {editing ? (
          <TextInput
            style={s.input}
            value={form.zipcode}
            onChangeText={(value) => handleTextChange('zipcode', value)}
            placeholder="Zip code"
            placeholderTextColor="#B0B4C8"
            keyboardType="number-pad"
          />
        ) : (
          <Text style={s.valueText}>{profile?.zipcode || '—'}</Text>
        )}

        <Text style={s.fieldLabel}>About</Text>
        {editing ? (
          <TextInput
            style={[s.input, s.textArea]}
            value={form.about_text}
            onChangeText={(value) => handleTextChange('about_text', value)}
            placeholder="Tell people a little about yourself"
            placeholderTextColor="#B0B4C8"
            multiline
            textAlignVertical="top"
            maxLength={300}
          />
        ) : (
          <Text style={s.bioText}>
            {profile?.about_text?.trim() || 'No about section yet.'}
          </Text>
        )}

        {editing ? (
          <View style={s.buttonRow}>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={handleCancel}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },

  profileHero: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },

  profileAvatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },

  profileAvatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
  },

  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
    textAlign: 'center',
  },

  profileHandle: {
    fontSize: 13,
    color: '#8B8FA8',
    textAlign: 'center',
  },

  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },

  badgeTile: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EBEBF5',
  },

  badgeTileIcon: {
    fontSize: 28,
    marginBottom: 6,
  },

  badgeTileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 3,
  },

  badgeTileDesc: {
    fontSize: 10,
    color: '#8B8FA8',
    textAlign: 'center',
    lineHeight: 14,
  },

  badge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  statLabel: {
    fontSize: 12,
    color: '#8B8FA8',
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B8FA8',
    letterSpacing: 0.8,
  },

  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B8FA8',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  valueText: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 22,
  },

  bioText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },

  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#EBEBF5',
  },

  textArea: {
    minHeight: 110,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },

  cancelBtnText: {
    color: '#1A1A2E',
    fontSize: 15,
    fontWeight: '600',
  },

  saveBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 8,
  },

  successText: {
    color: '#16A34A',
    fontSize: 13,
    marginBottom: 8,
  },

  successText: {
    color: '#16A34A',
    fontSize: 13,
    marginBottom: 8,
  },
})