import { StyleSheet, Platform } from 'react-native'
import { colors, fonts } from './themes' 

export const shared = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },

  screenHeader: { marginBottom: 20 },
  screenTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  screenSubtitle: { fontSize: 14, color: '#8B8FA8' },

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

  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '700' },
})
