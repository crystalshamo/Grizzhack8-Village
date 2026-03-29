import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native'
import Avatar from '../../components/Avatar'
import { shared } from '../../styles/shared'
import * as ImagePicker from 'expo-image-picker'

import { colors, fonts } from '../../styles/themes'
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
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }
return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.loginbackground }}>

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>new post</Text>

            <Text style={styles.modalLabel}>forum</Text>
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

            <Text style={styles.modalLabel}>what's on your mind?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="share something..."
              placeholderTextColor={colors.lightpurple}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
            />

            <Text style={styles.modalLabel}>image (optional)</Text>
            {newPostImage ? (
              <View style={{ marginBottom: 10 }}>
                <Image source={{ uri: newPostImage }} style={{ width: '100%', height: 140, borderRadius: 12 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => setNewPostImage('')} style={styles.removeImageBtn}>
                  <Text style={styles.removeImageText}>✕ remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
                  <Text style={styles.imageBtnText}>📷 choose</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageBtn} onPress={handleTakePhoto}>
                  <Text style={styles.imageBtnText}>📸 camera</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCancelBtnText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPostBtn} onPress={handleCreatePost} disabled={submitting}>
                {submitting ? <ActivityIndicator color={colors.dark} /> : <Text style={styles.modalPostBtnText}>post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>forums</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.createBtnText}>＋ post</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="search posts & forums"
            placeholderTextColor={colors.lightpurple}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searching && <ActivityIndicator size="small" color={colors.lightpurple} />}
        </View>

        {/* Daily Prompt */}
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <Text style={styles.promptBadge}>daily prompt</Text>
          </View>
          <Text style={styles.promptQ}>{DAILY_PROMPT.question}</Text>
          <View style={styles.promptInputRow}>
            <TextInput
              style={styles.promptInput}
              placeholder="share your answer..."
              placeholderTextColor="rgba(234,233,238,0.5)"
              value={promptAnswer}
              onChangeText={setPromptAnswer}
              multiline
            />
            <TouchableOpacity style={styles.promptBtn} onPress={handlePromptSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color={colors.dark} size="small" /> : <Text style={styles.promptBtnText}>→</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.lightpurple} style={{ marginTop: 40 }} />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery ? 'no posts found.' : 'no posts yet. be the first!'}
          </Text>
        ) : (
          posts.map(post => (
            <TouchableOpacity
              key={post.post_id}
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => navigation.navigate('PostDetail', { post })}
            >
              <View style={styles.cardTop}>
                <Avatar letter={post.author_name ? post.author_name[0] : '?'} color={colors.lightpurple} />
                <View style={styles.cardMeta}>
                  <Text style={styles.cardAuthor}>{post.author_name || 'unknown'}</Text>
                  <Text style={styles.cardTime}>{formatTime(post.created_at)}</Text>
                </View>
                <View style={styles.forumTag}>
                  <Text style={styles.forumTagText}>{post.forum_name || 'general'}</Text>
                </View>
              </View>

              {post.image_url && (
                <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
              )}

              <Text style={styles.cardBody}>{post.content}</Text>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post)}>
                  <Text style={[styles.actionBtnText, likedPosts[post.post_id] && { color: '#EF4444' }]}>
                    {likedPosts[post.post_id] ? '♥' : '♡'}  {post.like_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>💬  {post.comment_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}>
                  <Text style={styles.actionBtnText}>share</Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  screenTitle: {
    fontSize: 32,
    color: colors.dark,
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
  },
  createBtn: {
    backgroundColor: colors.lightpurple,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createBtnText: {
    color: colors.dark,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purple,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.background,
    fontFamily: fonts.regular,
  },
  promptCard: {
    backgroundColor: colors.lightpurple,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },
  promptHeader: {
    marginBottom: 10,
  },
  promptBadge: {
    fontSize: 11,
    color: colors.dark,
    fontFamily: fonts.bold,
    backgroundColor: colors.beige,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  promptQ: {
    fontSize: 16,
    color: colors.dark,
    fontFamily: fonts.bold,
    marginBottom: 14,
    lineHeight: 22,
  },
  promptInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptInput: {
    flex: 1,
    backgroundColor: 'rgba(9,1,36,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.background,
    fontFamily: fonts.regular,
    minHeight: 40,
    maxHeight: 80,
  },
  promptBtn: {
    backgroundColor: colors.beige,
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptBtnText: {
    color: colors.dark,
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  card: {
    backgroundColor: colors.purple,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardMeta: { flex: 1 },
  cardAuthor: { fontSize: 14, fontFamily: fonts.bold, color: colors.background },
  cardTime: { fontSize: 11, color: colors.lightpurple, marginTop: 1, fontFamily: fonts.regular },
  forumTag: {
    backgroundColor: 'rgba(184,180,242,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.3)',
  },
  forumTagText: { fontSize: 11, color: colors.lightpurple, fontFamily: fonts.bold },
  cardBody: { fontSize: 14, color: colors.background, lineHeight: 21, marginBottom: 14, fontFamily: fonts.regular, opacity: 0.85 },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(184,180,242,0.15)' },
  actionBtnText: { fontSize: 13, color: colors.lightpurple, fontFamily: fonts.regular },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(184,180,242,0.1)',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.lightpurple,
    fontSize: 15,
    marginTop: 40,
    fontFamily: fonts.regular,
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,1,36,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.purple,
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.background,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 11,
    color: colors.beige,
    fontFamily: fonts.bold,
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  pickerWrap: {
    marginBottom: 4,
  },
  forumChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(184,180,242,0.15)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
  },
  forumChipActive: {
    backgroundColor: colors.lightpurple,
    borderColor: colors.lightpurple,
  },
  forumChipText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.lightpurple,
  },
  forumChipTextActive: {
    color: colors.dark,
    fontFamily: fonts.bold,
  },
  modalInput: {
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.background,
    borderWidth: 1.5,
    borderColor: 'rgba(184,180,242,0.2)',
    fontFamily: fonts.regular,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  imageBtn: {
    flex: 1,
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
  },
  imageBtnText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.lightpurple,
  },
  removeImageBtn: { marginTop: 6, alignSelf: 'flex-end' },
  removeImageText: { fontSize: 13, color: colors.beige, fontFamily: fonts.regular },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.lightpurple,
  },
  modalPostBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.beige,
  },
  modalPostBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.dark,
  },
})