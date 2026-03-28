import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { shared } from '../../styles/shared'
import { DONATION_REQUESTS } from '../../data/index'

export default function DonationsScreen() {
  return (
    <ScrollView contentContainerStyle={shared.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={shared.screenHeader}>
        <Text style={shared.screenTitle}>Donations</Text>
        <Text style={shared.screenSubtitle}>Support your neighbors</Text>
      </View>

      <TouchableOpacity style={s.newRequestBtn} activeOpacity={0.85}>
        <Text style={s.newRequestBtnText}>+ New Request</Text>
      </TouchableOpacity>

      {DONATION_REQUESTS.map(req => {
        const pct = Math.min(100, Math.round((req.raised / req.goal) * 100))
        const funded = pct === 100
        return (
          <View key={req.id} style={shared.card}>
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
              <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: funded ? '#34D399' : '#6366F1' }]} />
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

const s = StyleSheet.create({
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
})
