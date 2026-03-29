import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Animated,
  Platform,
} from 'react-native'
import { colors, fonts } from '../../styles/themes'

const API_URL = 'http://35.50.104.14:3001'

const CATEGORIES = ['All', 'Baby', 'Food', 'Clothing', 'Furniture', 'Toys', 'Medical', 'Other']
const CREATE_CATEGORIES = CATEGORIES.filter(c => c !== 'All')

const REVIEW_CATEGORIES = ['All', 'Stroller', 'Baby', 'Sleep', 'Clothes', 'Toys', 'Safety', 'Health', 'Other']
const CREATE_REVIEW_CATEGORIES = REVIEW_CATEGORIES.filter(c => c !== 'All')

// ── Helpers ───────────────────────────────────────────────────────────────────
function Stars({ rating, size = 14, interactive = false, onPress, fillColor = colors.beige }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => interactive && onPress?.(i)}
          disabled={!interactive}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Text style={{ fontSize: size, color: i <= rating ? fillColor : '#d0d0e0' }}>★</Text>
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
      <Text style={s.loadingText}>Loading...</Text>
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

// ── Donation card — tap to expand contribute form ─────────────────────────────
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
    if (!val || val <= 0) { Alert.alert('Invalid amount', 'Enter a valid quantity.'); return }
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
      Alert.alert('Thank you! 💛', 'Your contribution has been recorded.')
      onContributed?.()
    } catch {
      Alert.alert('Error', 'Could not submit contribution.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[s.card, item.urgent && s.cardUrgent]}>
      {item.urgent && (
        <View style={s.urgentBadge}>
          <Text style={s.urgentBadgeText}>🚨 Urgent</Text>
        </View>
      )}

      <TouchableOpacity onPress={toggle} activeOpacity={0.85} disabled={isOwner || isFulfilled}>
        <View style={s.cardHeader}>
          <View style={s.categoryPill}>
            <Text style={s.categoryPillText}>{item.category || 'General'}</Text>
          </View>
          {isFulfilled && (
            <View style={s.fulfilledBadge}>
              <Text style={s.fulfilledText}>✓ Fulfilled</Text>
            </View>
          )}
          {!isOwner && !isFulfilled && (
            <Text style={s.tapHint}>{expanded ? '▲ Close' : '▼ Contribute'}</Text>
          )}
        </View>

        <Text style={s.cardTitle}>{item.title || item.item}</Text>
        <Text style={s.cardMeta}>Posted by {item.donor_name}</Text>

        {item.goal > 0 && (
          <View style={s.progressSection}>
            <ProgressBar raised={item.raised} goal={item.goal} />
            <Text style={s.progressText}>
              {item.raised} / {item.goal} contributed ({pct}%)
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Inline contribute form */}
      {!isOwner && !isFulfilled && (
        <Animated.View style={{ height: expandHeight, overflow: 'hidden' }}>
          <View style={s.inlineForm}>
            <TextInput
              style={s.inlineInput}
              placeholder="How many can you contribute?"
              placeholderTextColor={colors.lightpurple}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TouchableOpacity
              style={[s.inlineBtn, loading && { opacity: 0.6 }]}
              onPress={handleContribute}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.inlineBtnText}>Send 💛</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {isOwner && (
        <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.donation_id)} activeOpacity={0.85}>
          <Text style={s.deleteBtnText}>Delete request</Text>
        </TouchableOpacity>
      )}

      {isFulfilled && (
        <Text style={s.fulfilledLabel}>This request has been fulfilled 🎉</Text>
      )}
    </View>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ item, currentUserId, onDelete }) {
  const isOwner = String(item.user_id) === String(currentUserId)
  const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.categoryPill}>
          <Text style={s.categoryPillText}>{item.category || 'General'}</Text>
        </View>
        <Stars rating={item.rating} size={14} />
        <Text style={s.ratingNum}>{item.rating}/5</Text>
      </View>

      <Text style={s.cardTitle}>{item.product_name}</Text>
      <Text style={s.cardMeta}>{item.reviewer_name} · {date}</Text>

      {!!item.review_text && (
        <Text style={s.reviewPreview} numberOfLines={3}>{item.review_text}</Text>
      )}

      {isOwner && (
        <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item.review_id)} activeOpacity={0.85}>
          <Text style={s.deleteBtnText}>Delete review</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function DonationsScreen({ user }) {
  const [activeTab, setActiveTab] = useState('browse')

  // Donation state
  const [donations, setDonations]         = useState([])
  const [myDonations, setMyDonations]     = useState([])
  const [donLoading, setDonLoading]       = useState(true)
  const [donRefreshing, setDonRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [urgentOnly, setUrgentOnly]       = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Baby', goal: '', urgent: false })
  const [submitting, setSubmitting]       = useState(false)

  // Review state
  const [reviews, setReviews]             = useState([])
  const [topRated, setTopRated]           = useState([])
  const [revLoading, setRevLoading]       = useState(true)
  const [revRefreshing, setRevRefreshing] = useState(false)
  const [revCategory, setRevCategory]     = useState('All')
  const [revSearch, setRevSearch]         = useState('')
  const [reviewVisible, setReviewVisible] = useState(false)
  const [revForm, setRevForm] = useState({ product_name: '', category: 'Strollers', rating: 0, review_text: '' })
  const [revSubmitting, setRevSubmitting] = useState(false)

  // ── Donations fetch ─────────────────────────────────────────────────────────
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
    } catch { Alert.alert('Error', 'Could not load donations.') }
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

  // ── Reviews fetch ───────────────────────────────────────────────────────────
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

  // ── Create donation ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title.trim()) { Alert.alert('Missing info', 'Please enter a title.'); return }
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
        }),
      })
      if (!res.ok) throw new Error()
      setCreateVisible(false)
      setForm({ title: '', category: 'Baby', goal: '', urgent: false })
      await loadDonations()
      Alert.alert('Posted! 🎉', 'Your request has been shared with the community.')
    } catch { Alert.alert('Error', 'Could not post request.') }
    finally { setSubmitting(false) }
  }

  // ── Delete donation ─────────────────────────────────────────────────────────
  const handleDelete = (donation_id) => {
    Alert.alert('Delete request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API_URL}/api/donations/${donation_id}`, { method: 'DELETE' })
          await loadDonations()
        } catch { Alert.alert('Error', 'Could not delete.') }
      }},
    ])
  }

  // ── Create review ───────────────────────────────────────────────────────────
  const handleCreateReview = async () => {
    if (!revForm.product_name.trim()) { Alert.alert('Missing info', 'Please enter a product name.'); return }
    if (!revForm.rating) { Alert.alert('Missing info', 'Please select a star rating.'); return }
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
      setRevForm({ product_name: '', category: 'Strollers', rating: 0, review_text: '' })
      await loadReviews()
      Alert.alert('Review posted! ⭐', 'Thanks for helping the community.')
    } catch { Alert.alert('Error', 'Could not post review.') }
    finally { setRevSubmitting(false) }
  }

  // ── Delete review ───────────────────────────────────────────────────────────
  const handleDeleteReview = (review_id) => {
    Alert.alert('Delete review', 'Remove this review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API_URL}/api/reviews/${review_id}`, { method: 'DELETE' })
          await fetchReviews()
        } catch { Alert.alert('Error', 'Could not delete.') }
      }},
    ])
  }

  const TABS = [
    { key: 'browse',  label: 'Browse' },
    { key: 'mine',    label: 'My Requests' },
    { key: 'reviews', label: 'Reviews' },
  ]

  const donationData = activeTab === 'browse' ? donations : myDonations


return (
  <View style={s.screen}>

    {/* ── HEADER ───────────────────────────────────────────── */}
    <View style={s.authHeader}>
      <Text style={s.authTitle}>
        {activeTab === 'reviews' ? 'Product Reviews' : 'Donations'}
      </Text>

      <Text style={s.authSubtitle}>
        {activeTab === 'reviews'
          ? 'Share and discover real product experiences'
          : 'Request or contribute to community needs'}
      </Text>
    </View>

    {/* ── PRIMARY ACTION ───────────────────────────────────── */}
    <View style={s.primaryActionCard}>
      <TouchableOpacity
        style={s.primaryBtn}
        onPress={() =>
          activeTab === 'reviews'
            ? setReviewVisible(true)
            : setCreateVisible(true)
        }
        activeOpacity={0.85}
      >
        <Text style={s.primaryBtnText}>
          {activeTab === 'reviews' ? '+ Write Review' : '+ Create Request'}
        </Text>
      </TouchableOpacity>
    </View>

    {/* ── SEGMENTED TABS ───────────────────────────────────── */}
    <View style={s.segment}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            s.segmentItem,
            activeTab === tab.key && s.segmentItemActive
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text
            style={[
              s.segmentText,
              activeTab === tab.key && s.segmentTextActive
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* ── CONTENT AREA ─────────────────────────────────────── */}
    <View style={s.content}>

      {/* ═════════ DONATIONS ═════════ */}
      {activeTab !== 'reviews' && (
        <>
          {activeTab === 'browse' && (
            <View style={{ marginBottom: 10 }}>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <View style={{ paddingLeft: 16, paddingRight: 16, flexDirection: 'row' }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      s.pill,
                      selectedCategory === cat && s.pillActive
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        s.pillText,
                        selectedCategory === cat && s.pillTextActive
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  s.urgentPill,
                  urgentOnly && s.urgentPillActive
                ]}
                onPress={() => setUrgentOnly(v => !v)}
              >
                <Text
                  style={[
                    s.urgentText,
                    urgentOnly && s.urgentTextActive
                  ]}
                >
                  🚨 Urgent only
                </Text>
              </TouchableOpacity>

            </View>
          )}

          {donLoading ? (
            <Loading />
          ) : donationData.length === 0 ? (
            <EmptyState text="No donations found" icon="🤝" />
          ) : (
            <FlatList
              data={donationData}
              keyExtractor={item => String(item.donation_id)}
              renderItem={({ item }) => (
                <DonationCard
                  item={item}
                  currentUserId={user?.user_id}
                  onDelete={handleDelete}
                  onContributed={fetchDonations}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </>
      )}

      {/* ═════════ REVIEWS ═════════ */}
      {activeTab === 'reviews' && (
        <>
          <TextInput
            style={s.search}
            placeholder="Search products..."
            value={revSearch}
            onChangeText={setRevSearch}
          />

          <View style={{ marginBottom: 6 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={{ paddingLeft: 16, paddingRight: 16, flexDirection: 'row' }}>
              {REVIEW_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    s.pill,
                    revCategory === cat && s.pillActive
                  ]}
                  onPress={() => setRevCategory(cat)}
                >
                  <Text
                    style={[
                      s.pillText,
                      revCategory === cat && s.pillTextActive
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
              </View>
            </ScrollView>
          </View>

          {topRated.length > 0 && (
            <View style={{ marginTop: 6, marginBottom: 8 }}>
              <Text style={s.sectionTitle}>⭐ Trending Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <View style={{ paddingLeft: 16, paddingRight: 16, flexDirection: 'row' }}>
                {topRated.map(item => (
                  <View key={item.review_id} style={s.trendingCard}>
                    <Text style={s.trendingProduct}>{item.product_name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Stars rating={item.rating} size={12} fillColor="#D4A200" />
                      <Text style={s.trendingRating}>{item.rating}/5</Text>
                    </View>
                  </View>
                ))}
                </View>
              </ScrollView>
            </View>
          )}

          {revLoading ? (
            <Loading />
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={item => String(item.review_id)}
              renderItem={({ item }) => (
                <ReviewCard
                  item={item}
                  currentUserId={user?.user_id}
                  onDelete={handleDeleteReview}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </>
      )}

    </View>

    {/* ── CREATE DONATION MODAL ─────────────────────────────────── */}
    <Modal visible={createVisible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <Text style={s.modalTitle}>Create Request</Text>

          <View style={s.fieldRow}>
            <Text style={s.label}>What do you need?</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Baby stroller"
              placeholderTextColor={colors.lightpurple}
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />
          </View>

          <View style={s.fieldRow}>
            <Text style={s.label}>Category</Text>
            <View style={s.selector}>
              {CREATE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.selectorBtn, form.category === cat && s.selectorBtnActive]}
                  onPress={() => setForm({ ...form, category: cat })}
                >
                  <Text style={[s.selectorText, form.category === cat && s.selectorTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.fieldRow}>
            <Text style={s.label}>How many?</Text>
            <TextInput
              style={s.input}
              placeholder="0"
              placeholderTextColor={colors.lightpurple}
              keyboardType="numeric"
              value={form.goal}
              onChangeText={(text) => setForm({ ...form, goal: text })}
            />
          </View>

          <View style={s.urgentToggle}>
            <View style={s.toggleLeft}>
              <Text style={s.toggleLabel}>Mark as Urgent</Text>
              <Text style={s.toggleDescription}>This speeds up responses</Text>
            </View>
            <TouchableOpacity
              onPress={() => setForm({ ...form, urgent: !form.urgent })}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24, color: form.urgent ? colors.lightpurple : '#ccc' }}>●</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.btn}
            onPress={handleCreate}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={colors.purple} />
            ) : (
              <Text style={s.btnText}>Post Request</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCreateVisible(false)} style={{ marginTop: 12 }}>
            <Text style={[s.btnText, { opacity: 0.6, textAlign: 'center' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* ── CREATE REVIEW MODAL ─────────────────────────────────── */}
    <Modal visible={reviewVisible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <Text style={s.modalTitle}>Write Review</Text>

          <View style={s.fieldRow}>
            <Text style={s.label}>Product Name</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Baby carrier"
              placeholderTextColor={colors.lightpurple}
              value={revForm.product_name}
              onChangeText={(text) => setRevForm({ ...revForm, product_name: text })}
            />
          </View>

          <View style={s.fieldRow}>
            <Text style={s.label}>Category</Text>
            <View style={s.selector}>
              {CREATE_REVIEW_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.selectorBtn, revForm.category === cat && s.selectorBtnActive]}
                  onPress={() => setRevForm({ ...revForm, category: cat })}
                >
                  <Text style={[s.selectorText, revForm.category === cat && s.selectorTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.fieldRow}>
            <Text style={s.label}>Rating</Text>
            <Stars rating={revForm.rating} size={28} interactive onPress={(r) => setRevForm({ ...revForm, rating: r })} fillColor={colors.beige} />
          </View>

          <View style={s.fieldRow}>
            <Text style={s.label}>Your Review</Text>
            <TextInput
              style={[s.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Share your experience..."
              placeholderTextColor={colors.lightpurple}
              multiline
              value={revForm.review_text}
              onChangeText={(text) => setRevForm({ ...revForm, review_text: text })}
            />
          </View>

          <TouchableOpacity
            style={s.btn}
            onPress={handleCreateReview}
            disabled={revSubmitting}
            activeOpacity={0.85}
          >
            {revSubmitting ? (
              <ActivityIndicator color={colors.purple} />
            ) : (
              <Text style={s.btnText}>Post Review</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setReviewVisible(false)} style={{ marginTop: 12 }}>
            <Text style={[s.btnText, { opacity: 0.6, textAlign: 'center' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

  </View>
)};
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },

  authHeader: { padding: 16, paddingTop: 12 },
  authTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.purple, letterSpacing: -0.5 },
  authSubtitle: { color: colors.lightpurple, marginTop: 4, fontFamily: fonts.regular, opacity: 0.7 },

  primaryActionCard: { paddingHorizontal: 16, marginBottom: 16 },
  primaryBtn: {
    backgroundColor: colors.beige,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  primaryBtnText: { color: colors.purple, fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.2 },

  segment: { flexDirection: 'row', margin: 12, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  segmentItem: { flex: 1, padding: 12, backgroundColor: '#f0f0f0', alignItems: 'center' },
  segmentItemActive: { backgroundColor: colors.lightpurple },
  segmentText: { color: colors.purple, fontFamily: fonts.regular, opacity: 0.7 },
  segmentTextActive: { color: '#ffffff', fontFamily: fonts.bold },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  search: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 14,
    color: colors.purple,
    fontFamily: fonts.regular,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: '#f0eefd',
    marginRight: 6,
    marginBottom: 4,
  },
  pillActive: { backgroundColor: colors.lightpurple },
  pillText: { color: colors.purple, fontFamily: fonts.regular, opacity: 0.65, fontSize: 11 },
  pillTextActive: { color: '#ffffff', fontFamily: fonts.bold },

  urgentPill: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(184,180,242,0.15)',
    borderWidth: 1.5,
    borderColor: colors.lightpurple,
  },
  urgentPillActive: { backgroundColor: colors.lightpurple },
  urgentText: { color: colors.lightpurple, fontFamily: fonts.bold, fontSize: 12 },
  urgentTextActive: { color: colors.beige, fontFamily: fonts.bold },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8f0',
    ...Platform.select({
      ios: { shadowColor: colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },

  cardUrgent: {
    borderWidth: 1.5,
    borderColor: colors.lightpurple,
  },

  urgentBadge: {
    backgroundColor: colors.lightpurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  cardTitle: { fontSize: 16, fontFamily: fonts.bold, marginTop: 6, color: colors.purple, flex: 1 },
  cardMeta: { color: '#7a7a8e', fontSize: 12, fontFamily: fonts.regular, opacity: 0.8, marginTop: 4 },

  categoryPill: {
    backgroundColor: '#f0eefd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  categoryPillText: { fontSize: 11, fontFamily: fonts.regular, color: colors.lightpurple },

  progressSection: { marginTop: 10 },
  progressTrack: {
    height: 6,
    backgroundColor: '#e8e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.lightpurple,
  },

  label: {
    fontSize: 12, color: colors.purple,
    fontFamily: fonts.bold, marginBottom: 6,
    marginTop: 10, letterSpacing: 0.5,
  },

  input: {
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12,
    fontSize: 14, color: colors.purple, borderWidth: 1.5,
    borderColor: '#e0e0e0', fontFamily: fonts.regular,
  },

  inputFocused: {
    borderColor: colors.lightpurple,
    backgroundColor: '#f5f5f5',
  },

  btn: {
    backgroundColor: colors.beige, borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', marginTop: 14,
    ...Platform.select({
      ios: { shadowColor: colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },

  btnText: {
    color: colors.purple, fontSize: 14,
    fontFamily: fonts.bold, letterSpacing: 0.3,
  },

  deleteBtn: {
    backgroundColor: 'rgba(184,180,242,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  deleteBtnText: {
    color: colors.lightpurple,
    fontFamily: fonts.bold,
    fontSize: 12,
  },

  expandSection: {
    paddingVertical: 10,
  },

  urgentBadgeText: {
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 11,
  },

  fulfilledBadge: {
    backgroundColor: 'rgba(184,180,242,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  fulfilledText: {
    color: colors.lightpurple,
    fontFamily: fonts.bold,
    fontSize: 11,
  },

  fulfilledLabel: {
    color: colors.lightpurple,
    fontFamily: fonts.bold,
    fontSize: 13,
    paddingTop: 8,
  },

  tapHint: {
    color: '#a0a0b0',
    fontSize: 11,
    fontFamily: fonts.regular,
    opacity: 0.6,
  },

  progressText: {
    fontSize: 11,
    color: '#7a7a8e',
    fontFamily: fonts.regular,
    marginTop: 6,
    opacity: 0.8,
  },

  inlineForm: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 10,
  },

  inlineInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.purple,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  inlineBtn: {
    backgroundColor: colors.beige, 
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  inlineBtnText: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 12,
  },

  ratingNum: {
    color: colors.purple,
    fontSize: 12,
    fontFamily: fonts.bold,
    marginLeft: 8,
  },

  reviewPreview: {
    color: colors.purple,
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 8,
    lineHeight: 18,
    opacity: 0.85,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    color: colors.lightpurple,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 12,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    color: colors.lightpurple,
    fontFamily: fonts.regular,
    fontSize: 15,
    opacity: 0.7,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.purple,
    paddingHorizontal: 16,
    marginBottom: 6,
  },

  trendingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 160,
    borderWidth: 1,
    borderColor: '#e8e8f0',
  },

  trendingProduct: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.purple,
    numberOfLines: 2,
  },

  trendingRating: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.purple,
    marginLeft: 4,
  },

  // ─── MODAL STYLES ───────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: 32,
    maxHeight: '90%',
  },

  modalTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.purple,
    marginBottom: 20,
  },

  fieldRow: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: colors.purple,
    fontFamily: fonts.bold,
    marginBottom: 8,
    textTransform: 'uppercase',
    opacity: 0.8,
  },

  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.lightpurple,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.purple,
  },

  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  selectorBtn: {
    backgroundColor: '#f0eefd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.lightpurple,
  },

  selectorBtnActive: {
    backgroundColor: colors.lightpurple,
    borderColor: colors.lightpurple,
  },

  selectorText: {
    fontSize: 13,
    color: colors.purple,
    fontFamily: fonts.bold,
  },

  selectorTextActive: {
    color: colors.white,
  },

  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f7ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.lightpurple,
  },

  toggleLeft: {
    flex: 1,
  },

  toggleLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.purple,
    marginBottom: 4,
  },

  toggleDescription: {
    fontSize: 12,
    color: colors.lightpurple,
    fontFamily: fonts.regular,
  },

  btn: {
    backgroundColor: colors.beige,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.purple,
  },
})