import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Modal, ScrollView, ActivityIndicator, Alert, StyleSheet,
  KeyboardAvoidingView, Animated, Platform,
} from 'react-native'
import { colors, fonts } from '../../styles/themes'

const API_URL = 'http://35.50.104.14:3001'

const CATEGORIES = ['All', 'Baby', 'Food', 'Clothing', 'Furniture', 'Toys', 'Medical', 'Other']
const CREATE_CATEGORIES = CATEGORIES.filter(c => c !== 'All')
const REVIEW_CATEGORIES = ['All', 'Stroller', 'Baby', 'Sleep', 'Clothes', 'Toys', 'Safety', 'Health', 'Other']
const CREATE_REVIEW_CATEGORIES = REVIEW_CATEGORIES.filter(c => c !== 'All')

function Stars({ rating, size = 14, interactive = false, onPress, fillColor = colors.beige }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => interactive && onPress?.(i)} disabled={!interactive} activeOpacity={interactive ? 0.7 : 1}>
          <Text style={{ fontSize: size, color: i <= rating ? fillColor : 'rgba(184,180,242,0.3)' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function ProgressBar({ raised, goal }) {
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${pct}%` }]} />
    </View>
  )
}

function Loading() {
  return (
    <View style={s.loadingContainer}>
      <ActivityIndicator size="large" color={colors.lightpurple} />
      <Text style={s.loadingText}>loading...</Text>
    </View>
  )
}

function EmptyState({ text, icon }) {
  return (
    <View style={s.emptyContainer}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  )
}

function DonationCard({ item, currentUserId, onDelete, onContributed }) {
  const isOwner = String(item.user_id) === String(currentUserId)
  const isFulfilled = item.status === 'fulfilled'
  const pct = item.goal > 0 ? Math.min(Math.round((item.raised / item.goal) * 100), 100) : 0
  const [expanded, setExpanded] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const anim = useRef(new Animated.Value(0)).current

  const toggle = () => {
    if (isOwner || isFulfilled) return
    const toVal = expanded ? 0 : 1
    setExpanded(!expanded)
    Animated.spring(anim, { toValue: toVal, useNativeDriver: false, tension: 60, friction: 10 }).start()
  }

  const expandHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 100] })

  const handleContribute = async () => {
    const val = parseInt(amount)
    if (!val || val <= 0) { Alert.alert('invalid amount', 'enter a valid quantity.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/donations/${item.donation_id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val }),
      })
      if (!res.ok) throw new Error()
      setAmount('')
      setExpanded(false)
      Animated.spring(anim, { toValue: 0, useNativeDriver: false }).start()
      Alert.alert('thank you! 💛', 'your contribution has been recorded.')
      onContributed?.()
    } catch {
      Alert.alert('error', 'could not submit contribution.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[s.card, item.urgent && s.cardUrgent]}>
      {item.urgent && (
        <View style={s.urgentBadge}>
          <Text style={s.urgentBadgeText}>🚨 urgent</Text>
        </View>
      )}

      <TouchableOpacity onPress={toggle} activeOpacity={0.85} disabled={isOwner || isFulfilled}>
        <View style={s.cardHeader}>
          <View style={s.categoryPill}>
            <Text style={s.categoryPillText}>{item.category || 'general'}</Text>
          </View>
          {isFulfilled && (
            <View style={s.fulfilledBadge}>
              <Text style={s.fulfilledText}>✓ fulfilled</Text>
            </View>
          )}
          {!isOwner && !isFulfilled && (
            <Text style={s.tapHint}>{expanded ? '▲ close' : '▼ contribute'}</Text>
          )}
        </View>
        <Text style={s.cardTitle}>{item.title || item.item}</Text>
        <Text style={s.cardMeta}>posted by {item.donor_name}</Text>
        {item.goal > 0 && (
          <View style={s.progressSection}>
            <ProgressBar raised={item.raised} goal={item.goal} />
            <Text style={s.progressText}>{item.raised} / {item.goal} contributed ({pct}%)</Text>
          </View>
        )}
      </TouchableOpacity>

      {!isOwner && !isFulfilled && (
        <Animated.View style={{ height: expandHeight, overflow: 'hidden' }}>
          <View style={s.inlineForm}>
            <TextInput
              style={s.inlineInput}
              placeholder="how many can you contribute?"
              placeholderTextColor="rgba(184,180,242,0.5)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TouchableOpacity style={[s.inlineBtn, loading && { opacity: 0.6 }]} onPress={handleContribute} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={colors.dark} size="small" /> : <Text style={s.inlineBtnText}>send 💛</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {isOwner && (
        <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.donation_id)} activeOpacity={0.85}>
          <Text style={s.deleteBtnText}>delete request</Text>
        </TouchableOpacity>
      )}
      {isFulfilled && <Text style={s.fulfilledLabel}>this request has been fulfilled 🎉</Text>}
    </View>
  )
}

function ReviewCard({ item, currentUserId, onDelete }) {
  const isOwner = String(item.user_id) === String(currentUserId)
  const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.categoryPill}>
          <Text style={s.categoryPillText}>{item.category || 'general'}</Text>
        </View>
        <Stars rating={item.rating} size={14} />
        <Text style={s.ratingNum}>{item.rating}/5</Text>
      </View>
      <Text style={s.cardTitle}>{item.product_name}</Text>
      <Text style={s.cardMeta}>{item.reviewer_name} · {date}</Text>
      {!!item.review_text && <Text style={s.reviewPreview} numberOfLines={3}>{item.review_text}</Text>}
      {isOwner && (
        <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.review_id)} activeOpacity={0.85}>
          <Text style={s.deleteBtnText}>delete review</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function DonationsScreen({ user }) {
  const [activeTab, setActiveTab] = useState('browse')
  const [donations, setDonations] = useState([])
  const [myDonations, setMyDonations] = useState([])
  const [donLoading, setDonLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Baby', goal: '', urgent: false })
  const [submitting, setSubmitting] = useState(false)
  const [reviews, setReviews] = useState([])
  const [topRated, setTopRated] = useState([])
  const [revLoading, setRevLoading] = useState(true)
  const [revCategory, setRevCategory] = useState('All')
  const [revSearch, setRevSearch] = useState('')
  const [reviewVisible, setReviewVisible] = useState(false)
  const [revForm, setRevForm] = useState({ product_name: '', category: 'Baby', rating: 0, review_text: '' })
  const [revSubmitting, setRevSubmitting] = useState(false)

  const fetchDonations = useCallback(async () => {
    try {
      let url = `${API_URL}/api/donations`
      const params = []
      if (selectedCategory !== 'All') params.push(`category=${encodeURIComponent(selectedCategory)}`)
      if (urgentOnly) params.push('urgent=1')
      if (params.length) url += '?' + params.join('&')
      const res = await fetch(url)
      const data = await res.json()
      setDonations(Array.isArray(data) ? data : [])
    } catch { Alert.alert('error', 'could not load donations.') }
  }, [selectedCategory, urgentOnly])

  const fetchMyDonations = useCallback(async () => {
    if (!user?.user_id) return
    try {
      const res = await fetch(`${API_URL}/api/users/${user.user_id}/donations`)
      const data = await res.json()
      setMyDonations(Array.isArray(data) ? data : [])
    } catch {}
  }, [user])

  const loadDonations = useCallback(async () => {
    setDonLoading(true)
    await Promise.all([fetchDonations(), fetchMyDonations()])
    setDonLoading(false)
  }, [fetchDonations, fetchMyDonations])

  useEffect(() => { loadDonations() }, [loadDonations])
  useEffect(() => { fetchDonations() }, [selectedCategory, urgentOnly])

  const fetchReviews = useCallback(async () => {
    try {
      let url = `${API_URL}/api/reviews`
      const params = []
      if (revCategory !== 'All') params.push(`category=${encodeURIComponent(revCategory)}`)
      if (revSearch.trim()) params.push(`product_name=${encodeURIComponent(revSearch.trim())}`)
      if (params.length) url += '?' + params.join('&')
      const res = await fetch(url)
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch {}
  }, [revCategory, revSearch])

  const fetchTopRated = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/top-rated`)
      const data = await res.json()
      setTopRated(Array.isArray(data) ? data.slice(0, 5) : [])
    } catch {}
  }, [])

  const loadReviews = useCallback(async () => {
    setRevLoading(true)
    await Promise.all([fetchReviews(), fetchTopRated()])
    setRevLoading(false)
  }, [fetchReviews, fetchTopRated])

  useEffect(() => { if (activeTab === 'reviews') loadReviews() }, [activeTab, loadReviews])
  useEffect(() => { if (activeTab === 'reviews') fetchReviews() }, [revCategory, revSearch])

  const handleCreate = async () => {
    if (!form.title.trim()) { Alert.alert('missing info', 'please enter a title.'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          title: form.title.trim(),
          item: form.title.trim(),
          category: form.category,
          goal: parseInt(form.goal) || 0,
          quantity: parseInt(form.goal) || 0,
          urgent: form.urgent,
          status: 'pending',
        }),
      })
      if (!res.ok) throw new Error()
      setCreateVisible(false)
      setForm({ title: '', category: 'Baby', goal: '', urgent: false })
      await loadDonations()
      Alert.alert('posted! 🎉', 'your request has been shared with the community.')
    } catch {
      Alert.alert('error', 'could not post request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (donation_id) => {
    Alert.alert('delete request', 'are you sure?', [
      { text: 'cancel', style: 'cancel' },
      { text: 'delete', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API_URL}/api/donations/${donation_id}`, { method: 'DELETE' })
          await loadDonations()
        } catch { Alert.alert('error', 'could not delete.') }
      }},
    ])
  }

  const handleCreateReview = async () => {
    if (!revForm.product_name.trim()) { Alert.alert('missing info', 'please enter a product name.'); return }
    if (!revForm.rating) { Alert.alert('missing info', 'please select a star rating.'); return }
    setRevSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          product_name: revForm.product_name.trim(),
          category: revForm.category,
          rating: revForm.rating,
          review_text: revForm.review_text.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      setReviewVisible(false)
      setRevForm({ product_name: '', category: 'Baby', rating: 0, review_text: '' })
      await loadReviews()
      Alert.alert('review posted! ⭐', 'thanks for helping the community.')
    } catch {
      Alert.alert('error', 'could not post review.')
    } finally {
      setRevSubmitting(false)
    }
  }

  const handleDeleteReview = (review_id) => {
    Alert.alert('delete review', 'remove this review?', [
      { text: 'cancel', style: 'cancel' },
      { text: 'delete', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API_URL}/api/reviews/${review_id}`, { method: 'DELETE' })
          await fetchReviews()
        } catch { Alert.alert('error', 'could not delete.') }
      }},
    ])
  }

  const TABS = [
    { key: 'browse', label: 'browse' },
    { key: 'mine', label: 'my requests' },
    { key: 'reviews', label: 'reviews' },
  ]

  const donationData = activeTab === 'browse' ? donations : myDonations

  return (
    <View style={s.screen}>

      <View style={s.header}>
        <Text style={s.headerTitle}>
          {activeTab === 'reviews' ? 'product reviews' : 'donations'}
        </Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => activeTab === 'reviews' ? setReviewVisible(true) : setCreateVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={s.addBtnText}>＋ {activeTab === 'reviews' ? 'review' : 'request'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.content}>

        {activeTab !== 'reviews' && (
          <View style={{ flex: 1 }}>
            {activeTab === 'browse' && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={s.browseFilterScroll}
                  contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[s.pill, selectedCategory === cat && s.pillActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[s.pillText, selectedCategory === cat && s.pillTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[s.urgentPill, urgentOnly && s.urgentPillActive]}
                  onPress={() => setUrgentOnly(v => !v)}
                >
                  <Text style={[s.urgentText, urgentOnly && s.urgentTextActive]}>🚨 urgent only</Text>
                </TouchableOpacity>
              </>
            )}

            {donLoading ? <Loading /> : donationData.length === 0 ? (
              <EmptyState text="no donations found" icon="🤝" />
            ) : (
              <FlatList
                data={donationData}
                keyExtractor={item => String(item.donation_id)}
                renderItem={({ item }) => (
                  <DonationCard item={item} currentUserId={user?.user_id} onDelete={handleDelete} onContributed={fetchDonations} />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={{ flex: 1 }}>
            <View style={s.searchBar}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="search products..."
                placeholderTextColor="rgba(184,180,242,0.5)"
                value={revSearch}
                onChangeText={setRevSearch}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.reviewFilterScroll}
              contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
            >
              {REVIEW_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.pill, revCategory === cat && s.pillActive]}
                  onPress={() => setRevCategory(cat)}
                >
                  <Text style={[s.pillText, revCategory === cat && s.pillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {topRated.length > 0 && (
              <View style={s.trendingSection}>
                <Text style={s.sectionTitle}>⭐ trending</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {topRated.map(item => (
                    <View key={item.review_id} style={s.trendingCard}>
                      <Text style={s.trendingProduct} numberOfLines={2}>{item.product_name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <Stars rating={item.rating} size={12} fillColor={colors.beige} />
                        <Text style={s.trendingRating}>{item.rating}/5</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {revLoading ? <Loading /> : (
              <FlatList
                data={reviews}
                keyExtractor={item => String(item.review_id)}
                renderItem={({ item }) => (
                  <ReviewCard item={item} currentUserId={user?.user_id} onDelete={handleDeleteReview} />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={<EmptyState text="no reviews yet" icon="⭐" />}
              />
            )}
          </View>
        )}
      </View>

      <Modal visible={createVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>new request</Text>
              <Text style={s.modalLabel}>what do you need?</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. baby stroller"
                placeholderTextColor="rgba(184,180,242,0.5)"
                value={form.title}
                onChangeText={text => setForm({ ...form, title: text })}
              />
              <Text style={s.modalLabel}>category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}
                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
                {CREATE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.selectorBtn, form.category === cat && s.selectorBtnActive]}
                    onPress={() => setForm({ ...form, category: cat })}
                  >
                    <Text style={[s.selectorText, form.category === cat && s.selectorTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.modalLabel}>how many?</Text>
              <TextInput
                style={s.modalInput}
                placeholder="0"
                placeholderTextColor="rgba(184,180,242,0.5)"
                keyboardType="numeric"
                value={form.goal}
                onChangeText={text => setForm({ ...form, goal: text })}
              />
              <TouchableOpacity
                style={[s.urgentToggle, form.urgent && s.urgentToggleActive]}
                onPress={() => setForm({ ...form, urgent: !form.urgent })}
              >
                <Text style={s.urgentToggleText}>{form.urgent ? '🚨 marked as urgent' : '🚨 mark as urgent'}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setCreateVisible(false)}>
                  <Text style={s.modalCancelBtnText}>cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalPostBtn} onPress={handleCreate} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={colors.dark} /> : <Text style={s.modalPostBtnText}>post request</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={reviewVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <ScrollView>
              <View style={s.modalContent}>
                <Text style={s.modalTitle}>write a review</Text>
                <Text style={s.modalLabel}>product name</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="e.g. baby carrier"
                  placeholderTextColor="rgba(184,180,242,0.5)"
                  value={revForm.product_name}
                  onChangeText={text => setRevForm({ ...revForm, product_name: text })}
                />
                <Text style={s.modalLabel}>category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 4 }}
                  contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
                  {CREATE_REVIEW_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[s.selectorBtn, revForm.category === cat && s.selectorBtnActive]}
                      onPress={() => setRevForm({ ...revForm, category: cat })}
                    >
                      <Text style={[s.selectorText, revForm.category === cat && s.selectorTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={s.modalLabel}>rating</Text>
                <Stars rating={revForm.rating} size={32} interactive onPress={r => setRevForm({ ...revForm, rating: r })} fillColor={colors.beige} />
                <Text style={s.modalLabel}>your review</Text>
                <TextInput
                  style={[s.modalInput, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="share your experience..."
                  placeholderTextColor="rgba(184,180,242,0.5)"
                  multiline
                  value={revForm.review_text}
                  onChangeText={text => setRevForm({ ...revForm, review_text: text })}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                  <TouchableOpacity style={s.modalCancelBtn} onPress={() => setReviewVisible(false)}>
                    <Text style={s.modalCancelBtnText}>cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.modalPostBtn} onPress={handleCreateReview} disabled={revSubmitting}>
                    {revSubmitting ? <ActivityIndicator color={colors.dark} /> : <Text style={s.modalPostBtnText}>post review</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.loginbackground },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.dark,
    letterSpacing: -0.5,
  },
  addBtn: {
    backgroundColor: colors.lightpurple,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: colors.dark,
    fontFamily: fonts.bold,
    fontSize: 13,
  },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.purple,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: { backgroundColor: colors.lightpurple },
  tabText: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(184,180,242,0.5)' },
  tabTextActive: { fontFamily: fonts.bold, color: colors.dark },

  content: { flex: 1, paddingHorizontal: 20 },

  browseFilterScroll: { marginBottom: 8 },
  reviewFilterScroll: { marginBottom: 0},

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.purple,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
    alignSelf: 'flex-start',
  },
  pillActive: { backgroundColor: colors.lightpurple, borderColor: colors.lightpurple },
  pillText: { color: 'rgba(184,180,242,0.6)', fontFamily: fonts.regular, fontSize: 12 },
  pillTextActive: { color: colors.dark, fontFamily: fonts.bold },

  urgentPill: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.purple,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
    alignSelf: 'flex-start',
  },
  urgentPillActive: { backgroundColor: colors.lightpurple, borderColor: colors.lightpurple },
  urgentText: { color: 'rgba(184,180,242,0.6)', fontFamily: fonts.bold, fontSize: 12 },
  urgentTextActive: { color: colors.dark },

  card: {
    backgroundColor: colors.purple,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardUrgent: { borderWidth: 1.5, borderColor: colors.lightpurple },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.background, marginBottom: 4 },
  cardMeta: { color: colors.lightpurple, fontSize: 12, fontFamily: fonts.regular, opacity: 0.7 },

  categoryPill: {
    backgroundColor: 'rgba(184,180,242,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
  },
  categoryPillText: { fontSize: 11, fontFamily: fonts.bold, color: colors.lightpurple },

  urgentBadge: {
    backgroundColor: colors.lightpurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  urgentBadgeText: { color: colors.dark, fontFamily: fonts.bold, fontSize: 11 },

  fulfilledBadge: {
    backgroundColor: 'rgba(184,180,242,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fulfilledText: { color: colors.lightpurple, fontFamily: fonts.bold, fontSize: 11 },
  fulfilledLabel: { color: colors.lightpurple, fontFamily: fonts.bold, fontSize: 13, paddingTop: 8 },

  tapHint: { color: colors.lightpurple, fontSize: 11, fontFamily: fonts.regular, opacity: 0.6 },

  progressSection: { marginTop: 10 },
  progressTrack: { height: 5, backgroundColor: 'rgba(184,180,242,0.2)', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: colors.lightpurple },
  progressText: { fontSize: 11, color: colors.lightpurple, fontFamily: fonts.regular, marginTop: 6, opacity: 0.7 },

  inlineForm: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  inlineInput: {
    flex: 1,
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.background,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
  },
  inlineBtn: {
    backgroundColor: colors.beige,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineBtnText: { color: colors.dark, fontFamily: fonts.bold, fontSize: 12 },

  deleteBtn: {
    backgroundColor: 'rgba(184,180,242,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  deleteBtnText: { color: colors.lightpurple, fontFamily: fonts.bold, fontSize: 12 },

  ratingNum: { color: colors.lightpurple, fontSize: 12, fontFamily: fonts.bold, marginLeft: 8 },
  reviewPreview: { color: colors.background, fontSize: 13, fontFamily: fonts.regular, marginTop: 8, lineHeight: 18, opacity: 0.8 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purple,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: colors.background, fontFamily: fonts.regular },

  trendingSection: { marginTop: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.dark, marginBottom: 6, opacity: 0.7 },

  trendingCard: {
    backgroundColor: colors.purple,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    width: 150,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
  },
  trendingProduct: { fontSize: 13, fontFamily: fonts.bold, color: colors.background },
  trendingRating: { fontSize: 11, fontFamily: fonts.bold, color: colors.lightpurple, marginLeft: 4 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.lightpurple, fontFamily: fonts.regular, fontSize: 14, marginTop: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.lightpurple, fontFamily: fonts.regular, fontSize: 15, opacity: 0.7 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9,1,36,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.purple,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.background, marginBottom: 20 },
  modalLabel: {
    fontSize: 11, color: colors.beige, fontFamily: fonts.bold,
    marginBottom: 8, marginTop: 14, letterSpacing: 0.5,
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
  },
  selectorBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(184,180,242,0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
    alignSelf: 'flex-start',
  },
  selectorBtnActive: { backgroundColor: colors.lightpurple, borderColor: colors.lightpurple },
  selectorText: { fontSize: 13, fontFamily: fonts.regular, color: colors.lightpurple },
  selectorTextActive: { color: colors.dark, fontFamily: fonts.bold },

  urgentToggle: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
    alignItems: 'center',
  },
  urgentToggleActive: { backgroundColor: colors.lightpurple, borderColor: colors.lightpurple },
  urgentToggleText: { color: colors.lightpurple, fontFamily: fonts.bold, fontSize: 13 },

  modalCancelBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184,180,242,0.2)',
  },
  modalCancelBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.lightpurple },
  modalPostBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.beige,
  },
  modalPostBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.dark },
})