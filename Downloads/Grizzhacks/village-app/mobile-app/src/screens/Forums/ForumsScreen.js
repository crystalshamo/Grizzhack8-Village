import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native'
import Avatar from '../../components/Avatar'
import { shared } from '../../styles/shared'
import { FORUM_POSTS } from '../../data/index'
import PostDetailScreen from './PostDetailScreen'

const DAILY_PROMPT = "What's something positive that happened in your community today?"

export default function ForumsScreen() {
  const [selectedPost, setSelectedPost] = useState(null)
  const [posts, setPosts] = useState(FORUM_POSTS)
  const [promptAnswer, setPromptAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handlePromptSubmit() {
    if (!promptAnswer.trim()) return
    setSubmitting(true)
    // TODO: Replace with backend/database call
    setTimeout(() => {
      setPosts([
        {
          id: Date.now(),
          author: 'You',
          avatar: 'Y',
          avatarColor: '#6366F1',
          time: 'Just now',
          title: 'Daily Prompt',
          body: promptAnswer,
          likes: 0,
          replies: 0,
          tag: 'Prompt',
          tagBg: '#E0E7FF',
          tagTextColor: '#3730A3',
          image: '',
          comments: [],
        },
        ...posts,
      ])
      setPromptAnswer('')
      setSubmitting(false)
    }, 600)
  }

  if (selectedPost) {
    return (
      <PostDetailScreen post={selectedPost} onBack={() => setSelectedPost(null)} />
    )
  }

  return (
    <ScrollView contentContainerStyle={shared.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={shared.screenHeader}>
        <Text style={shared.screenTitle}>Forums</Text>
        <Text style={shared.screenSubtitle}>What's happening in the village</Text>
      </View>

      {/* Daily Prompt UI */}
      <View style={s.promptCard}>
        <Text style={s.promptTitle}>Daily Prompt</Text>
        <Text style={s.promptQuestion}>{DAILY_PROMPT}</Text>
        <TextInput
          style={s.promptInput}
          placeholder="Your answer..."
          value={promptAnswer}
          onChangeText={setPromptAnswer}
          editable={!submitting}
          multiline
        />
        <TouchableOpacity
          style={[s.promptBtn, { opacity: !promptAnswer.trim() || submitting ? 0.5 : 1 }]}
          onPress={handlePromptSubmit}
          disabled={!promptAnswer.trim() || submitting}
        >
          <Text style={s.promptBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      {posts.map(post => (
        <TouchableOpacity
          key={post.id}
          style={[shared.card, s.card]}
          activeOpacity={0.92}
          onPress={() => setSelectedPost(post)}
        >
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
          {post.image && (
            <Image source={{ uri: post.image }} style={s.postImage} />
          )}
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
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 20, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  promptCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 22, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  promptTitle: { fontSize: 15, fontWeight: '700', color: '#4F46E5', marginBottom: 4 },
  promptQuestion: { fontSize: 14, color: '#1A1A2E', marginBottom: 10 },
  promptInput: { backgroundColor: '#F5F7FA', borderRadius: 14, padding: 10, minHeight: 44, fontSize: 14, color: '#1A1A2E', marginBottom: 10 },
  promptBtn: { backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 8, alignItems: 'center' },
  promptBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  forumTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  forumMeta: { flex: 1 },
  forumAuthor: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  forumTime: { fontSize: 12, color: '#B0B4C8', marginTop: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },
  forumTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 7, lineHeight: 22 },
  forumBody: { fontSize: 14, color: '#6B7280', lineHeight: 21, marginBottom: 14 },
  postImage: { width: '100%', height: 160, borderRadius: 16, marginBottom: 12, backgroundColor: '#E5E7EB' },
  forumActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F7FA' },
  actionBtnText: { fontSize: 13, color: '#8B8FA8', fontWeight: '500' },
})
