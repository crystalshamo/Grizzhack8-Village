import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native'
import Avatar from '../../components/Avatar'
import { shared } from '../../styles/shared'
import * as ImagePicker from 'expo-image-picker'

const API_URL = 'http://35.50.104.14:3001'

const DAILY_PROMPT = {
  id: 1,
  question: "What's one thing you're grateful for today?"
}

export default function ForumsScreen(props) {
  const { navigation, user } = props
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [promptAnswer, setPromptAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedForum, setSelectedForum] = useState(null)
  const [forums, setForums] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)
  const [likedPosts, setLikedPosts] = useState({})

  useEffect(() => {
    fetchPosts()
    fetchForums()
  }, [])

  const fetchForums = async () => {
    try {
      const res = await fetch(`${API_URL}/api/forums`)
      const data = await res.json()
      setForums(data)
      setSelectedForum(data[0] || null)
    } catch (err) {
      console.error('Failed to fetch forums:', err)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/posts`)
      const data = await res.json()
      setPosts(data)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (text) => {
    setSearchQuery(text)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!text.trim()) {
      fetchPosts()
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`${API_URL}/api/posts/search?q=${encodeURIComponent(text)}`)
        const data = await res.json()
        setPosts(data)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const handlePromptSubmit = async () => {
    if (!promptAnswer.trim()) return
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.user_id,
          content: promptAnswer,
          is_anonymous: false,
          prompt_id: DAILY_PROMPT.id,
          forum_id: 6,
        })
      })
      setPromptAnswer('')
      fetchPosts()
    } catch (err) {
      console.error('Failed to submit prompt answer:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedForum) return
    setSubmitting(true)
    try {
      const forumIdNum = selectedForum?.forum_id ? parseInt(selectedForum.forum_id, 10) : null
      const body = {
        user_id: user?.user_id,
        content: newPostContent,
        image_url: newPostImage || null,
        is_anonymous: false,
        forum_id: forumIdNum,
      }
      await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      setNewPostContent('')
      setNewPostImage('')
      setShowCreateModal(false)
      fetchPosts()
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setSubmitting(false)
    }
  }
  const handlePickImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) {
    alert('Permission to access photos is required!')
    return
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7,
  })
  if (!result.canceled) uploadImage(result.assets[0].uri)
}

const handleTakePhoto = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (!permission.granted) {
    alert('Permission to access camera is required!')
    return
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.7,
  })
  if (!result.canceled) uploadImage(result.assets[0].uri)
}

const uploadImage = async (uri) => {
  setSubmitting(true)
  try {
    const formData = new FormData()
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    })
    formData.append('upload_preset', 'village_preset')
    formData.append('cloud_name', 'dchvtg2pk')

    const res = await fetch('https://api.cloudinary.com/v1_1/dchvtg2pk/image/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setNewPostImage(data.secure_url)
  } catch (err) {
    console.error('Image upload failed:', err)
    alert('Failed to upload image')
  } finally {
    setSubmitting(false)
  }
}
const handleLike = async (post) => {
  const isLiked = likedPosts[post.post_id]
  const endpoint = isLiked ? 'unlike' : 'like'

  try {
    const res = await fetch(`${API_URL}/api/posts/${post.post_id}/${endpoint}`, {
      method: 'POST',
    })
    const data = await res.json()

    setLikedPosts(prev => ({ ...prev, [post.post_id]: !isLiked }))
    setPosts(prev => prev.map(p =>
      p.post_id === post.post_id ? { ...p, like_count: data.like_count } : p
    ))
  } catch (err) {
    console.error('Failed to like/unlike post:', err)
  }
}

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <Text style={styles.modalLabel}>Forum</Text>
            <View style={styles.pickerWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {forums.map(forum => (
                  <TouchableOpacity
                    key={forum.forum_id}
                    style={[styles.forumChip, selectedForum?.forum_id === forum.forum_id && styles.forumChipActive]}
                    onPress={() => setSelectedForum(forum)}
                  >
                    <Text style={[styles.forumChipText, selectedForum?.forum_id === forum.forum_id && styles.forumChipTextActive]}>{forum.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.modalLabel}>Content</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
            />
            <Text style={styles.modalLabel}>Image (optional)</Text>
{newPostImage ? (
  <View style={{ marginBottom: 10 }}>
    <Image source={{ uri: newPostImage }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
    <TouchableOpacity onPress={() => setNewPostImage('')} style={styles.removeImageBtn}>
      <Text style={styles.removeImageText}>✕ Remove</Text>
    </TouchableOpacity>
  </View>
) : (
  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
    <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
      <Text style={styles.imageBtnText}>📷 Choose Photo</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.imageBtn} onPress={handleTakePhoto}>
      <Text style={styles.imageBtnText}>📸 Take Photo</Text>
    </TouchableOpacity>
  </View>
)}
            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.modalBtnText, { color: '#6B7280' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6C63FF', marginLeft: 10 }]} onPress={handleCreatePost} disabled={submitting}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={shared.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={shared.screenHeader}>
          <Text style={shared.screenTitle}>Forums</Text>
          <Text style={shared.screenSubtitle}>What's happening in the village</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, forums, or people..."
            placeholderTextColor="#B0B4C8"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searching && <ActivityIndicator size="small" color="#6C63FF" style={{ marginLeft: 8 }} />}
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createBtnText}>＋ Create Post</Text>
        </TouchableOpacity>

        {/* Daily Prompt */}
        <View style={styles.promptCard}>
          <Text style={styles.promptQ}>{DAILY_PROMPT.question}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TextInput
              style={styles.promptInput}
              placeholder="Your answer..."
              value={promptAnswer}
              onChangeText={setPromptAnswer}
              multiline
            />
            <TouchableOpacity style={styles.promptBtn} onPress={handlePromptSubmit} disabled={submitting}>
              <Text style={styles.promptBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts */}
        {loading ? (
          <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery ? 'No posts found for your search.' : 'No posts yet. Be the first to share!'}
          </Text>
        ) : (
          posts.map(post => (
            <TouchableOpacity
              key={post.post_id}
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => navigation.navigate('PostDetail', { post })}
            >
              <View style={styles.forumTop}>
                <Avatar letter={post.author_name ? post.author_name[0] : '?'} color="#6C63FF" />
                <View style={styles.forumMeta}>
                  <Text style={styles.forumAuthor}>{post.author_name || 'Unknown'}</Text>
                  <Text style={styles.forumTime}>{post.forum_name || 'General'}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: '#E0E7FF' }]}>
                  <Text style={[styles.tagText, { color: '#6C63FF' }]}>{post.forum_name || 'General'}</Text>
                </View>
              </View>
              {post.image_url && (
                <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
              )}
              <Text style={styles.forumBody}>{post.content}</Text>
              <View style={styles.forumActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post)}>
  <Text style={[styles.actionBtnText, likedPosts[post.post_id] && { color: '#EF4444' }]}>
    {likedPosts[post.post_id] ? '♥' : '♡'}  {post.like_count}
  </Text>
</TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>💬  {post.comment_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}>
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
  },
  promptCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  promptQ: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C63FF',
  },
  promptInput: {
    flex: 1,
    backgroundColor: '#fff',
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
  promptBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  promptBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  forumTime: { fontSize: 12, color: '#B0B4C8', marginTop: 1 },
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
  emptyText: {
    textAlign: 'center',
    color: '#8B8FA8',
    fontSize: 15,
    marginTop: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  pickerWrap: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  forumChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    marginRight: 8,
  },
  forumChipActive: {
    backgroundColor: '#6C63FF',
  },
  forumChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  forumChipTextActive: {
    color: '#fff',
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 40,
    maxHeight: 100,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  imageBtn: {
  flex: 1,
  backgroundColor: '#F5F7FA',
  borderRadius: 12,
  paddingVertical: 10,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
imageBtnText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#6C63FF',
},
removeImageBtn: {
  marginTop: 6,
  alignSelf: 'flex-end',
},
removeImageText: {
  fontSize: 13,
  color: '#EF4444',
  fontWeight: '600',
},
})