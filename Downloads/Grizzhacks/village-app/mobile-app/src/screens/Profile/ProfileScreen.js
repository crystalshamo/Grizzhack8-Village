import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { shared } from '../../styles/shared'

export default function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={shared.scrollContent} showsVerticalScrollIndicator={false}>
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

      <View style={[shared.card, { marginBottom: 14 }]}>
        <Text style={s.bioLabel}>ABOUT</Text>
        <Text style={s.bioText}>
          Passionate about community building and local resilience. I help organize
          neighborhood drives and love connecting people with resources.
        </Text>
      </View>

      <View style={shared.card}>
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

const s = StyleSheet.create({
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
})
