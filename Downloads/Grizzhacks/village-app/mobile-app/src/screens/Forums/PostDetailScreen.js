import React, { useState, useEffect } from 'react' 
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import Avatar from '../../components/Avatar'
import { useRoute } from '@react-navigation/native'

const API_URL = 'http://35.50.104.14:3001'

export default function PostDetailScreen({ user }) {
  const route = useRoute()
  const { post } = route.params
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
const [likeCount, setLikeCount] = useState(post.like_count ?? 0)

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.post_id}/comments`)
      const data = await res.json()
      setComments(data)
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/api/posts/${post.post_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.user_id,
          content: commentText
        })
      })
      setCommentText('')
      fetchComments()
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmitting(false)
    }
  }
  const handleLike = async () => {
  const endpoint = liked ? 'unlike' : 'like'
  try {
    const res = await fetch(`${API_URL}/api/posts/${post.post_id}/${endpoint}`, {
      method: 'POST',
    })
    const data = await res.json()
    setLiked(!liked)
    setLikeCount(data.like_count)
  } catch (err) {
    console.error('Failed to like/unlike post:', err)
  }
}
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.forumTop}>
            <Avatar letter={post.author_name ? post.author_name[0] : '?'} color="#6C63FF" />
            <View style={styles.forumMeta}>
              <Text style={styles.forumAuthor}>{post.author_name || 'Unknown'}</Text>
              <Text style={styles.forumTime}>{post.forum_name || 'Forum'}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#E0E7FF' }]}> 
              <Text style={[styles.tagText, { color: '#6C63FF' }]}>{post.forum_name || 'Forum'}</Text>
            </View>
          </View>
          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
          )}
          <Text style={styles.forumBody}>{post.content}</Text>
          <View style={styles.forumActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
  <Text style={[styles.actionBtnText, liked && { color: '#EF4444' }]}>
    {liked ? '♥' : '♡'}  {likeCount}
  </Text>
  <Image 
  source={require('../../../../assets/mascot.png')} 
  style={{ width: 100, height: 100 }}
  resizeMode="contain"
/>
</TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>💬  {post.comment_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}> 
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.commentsHeader}>Comments</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 20 }} />
        ) : comments.length === 0 ? (
          <Text style={{ color: '#8B8FA8', textAlign: 'center', marginTop: 20 }}>No comments yet.</Text>
        ) : (
          comments.map(comment => (
            <View key={comment.comment_id} style={styles.commentCard}>
              <Avatar letter={comment.author_name ? comment.author_name[0] : '?'} color="#6C63FF" size={36} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.commentAuthor}>{comment.author_name || 'Unknown'}</Text>
                  {/* <Text style={styles.commentTime}>{comment.created_at}</Text> */}
                </View>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.commentInputBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleAddComment} disabled={submitting}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  forumTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  forumMeta: { flex: 1 },
  forumAuthor: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  forumTime: { fontSize: 12, color: '#B0B4C8', marginTop: 1, marginLeft: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },
  forumBody: { fontSize: 14, color: '#6B7280', lineHeight: 21, marginBottom: 14 },
  forumActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F7FA' },
  actionBtnText: { fontSize: 13, color: '#8B8FA8', fontWeight: '500' },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#E5E7EB',
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 10,
    marginLeft: 2,
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  commentTime: { fontSize: 11, color: '#B0B4C8', marginLeft: 8 },
  commentText: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    minHeight: 36,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})
