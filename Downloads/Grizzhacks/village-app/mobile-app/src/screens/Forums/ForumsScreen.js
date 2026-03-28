import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import Avatar from '../../components/Avatar'
import { shared } from '../../styles/shared'
import { FORUM_POSTS } from '../../data/index'

export default function ForumsScreen() {
  return (
    <ScrollView contentContainerStyle={shared.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={shared.screenHeader}>
        <Text style={shared.screenTitle}>Forums</Text>
        <Text style={shared.screenSubtitle}>What's happening in the village</Text>
      </View>

      {FORUM_POSTS.map(post => (
        <View key={post.id} style={shared.card}>
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

const s = StyleSheet.create({
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
})
