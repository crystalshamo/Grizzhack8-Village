import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import Avatar from '../../components/Avatar'
import { shared } from '../../styles/shared'
import { CHAT_THREADS } from '../../data/index'

export default function ConnectingScreen() {
  return (
    <ScrollView contentContainerStyle={shared.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={shared.screenHeader}>
        <Text style={shared.screenTitle}>Connecting</Text>
        <Text style={shared.screenSubtitle}>Your conversations</Text>
      </View>

      {CHAT_THREADS.map(thread => (
        <TouchableOpacity key={thread.id} style={shared.card} activeOpacity={0.8}>
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

const s = StyleSheet.create({
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
})
