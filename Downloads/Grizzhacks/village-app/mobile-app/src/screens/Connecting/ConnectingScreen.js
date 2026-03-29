import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Modal, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../styles/themes';
import { getChats, getMessages, sendMessage, getEvents, createEvent, getChatMembers } from '../../api/api';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const CURRENT_USER_ID = 18;

// ─── Safe date helper ────────────────────────────────────────────────────────
// Returns a valid Date or null
function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Calendar ────────────────────────────────────────────────────────────────
function Calendar({ events, year, month, onPrev, onNext, onSelectDate }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventDays = events
    .map(e => safeDate(e.event_date))
    .filter(d => d && d.getFullYear() === year && d.getMonth() === month)
    .map(d => d.getDate());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={s.calCard}>
      <View style={s.calNav}>
        <TouchableOpacity onPress={onPrev} style={s.navBtn}>
          <Text style={s.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={onNext} style={s.navBtn}>
          <Text style={s.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.dayHeaderRow}>
        {DAYS.map(d => <Text key={d} style={s.dayHeader}>{d}</Text>)}
      </View>

      <View style={s.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={s.cell} />;
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const hasEvent = eventDays.includes(day);
          return (
            <TouchableOpacity
              key={`day-${year}-${month}-${day}`}
              style={s.cell}
              onPress={() => onSelectDate(new Date(year, month, day))}
            >
              <View style={[s.dayCircle, isToday && s.todayCircle]}>
                <Text style={[s.dayText, isToday && s.todayText]}>{day}</Text>
              </View>
              <View style={[s.dot, hasEvent && !isToday && s.dotVisible]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── EventCard ───────────────────────────────────────────────────────────────
function EventCard({ item, onRsvp, onChat }) {
  // Guard: if the date is invalid, skip rendering broken info
  const date = safeDate(item.event_date || item.date);

  const dayNum    = date ? date.getDate() : '—';
  const monthShort = date ? MONTHS[date.getMonth()].slice(0, 3).toUpperCase() : '—';
  const timeStr   = date
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const isGoing = item.user_status === 'going';

  return (
    <View style={s.eventCard}>
      <View style={s.eventTop}>
        <View style={s.dateBadge}>
          <Text style={s.dateDay}>{dayNum}</Text>
          <Text style={s.dateMonth}>{monthShort}</Text>
        </View>
        <View style={s.eventInfo}>
          <Text style={s.eventTitle}>{item.title || 'Untitled Event'}</Text>
          {date && (
            <Text style={s.eventMeta}>
              {timeStr}{item.location ? ` · ${item.location}` : ''}
            </Text>
          )}
          {item.group_name ? (
            <Text style={s.groupName}>{item.group_name}</Text>
          ) : null}
        </View>
      </View>

      {onRsvp && (
        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.rsvpBtn, isGoing && s.rsvpBtnActive]}
            onPress={() => onRsvp(item.event_id, isGoing ? 'not_going' : 'going')}
          >
            <Text style={[s.rsvpBtnText, isGoing && s.rsvpBtnTextActive]}>
              {isGoing ? '✓ going' : 'rsvp'}
            </Text>
          </TouchableOpacity>
          {item.chat_id && (
            <TouchableOpacity style={s.chatBtn} onPress={() => onChat(item)}>
              <Text style={s.chatBtnText}>group chat →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── ChatCard ────────────────────────────────────────────────────────────────
function ChatCard({ item, onPress }) {
  // Pull the name that was resolved and stored when chats were loaded
  // (see loadChats where we normalise the field to `resolvedName`)
  const displayName = item.resolvedName || 'Chat';

  const initials = displayName
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity style={s.chatCard} onPress={() => onPress(item)}>
      <View style={s.avatar}>
        <Text style={s.initials}>{initials}</Text>
      </View>
      <View style={s.chatInfo}>
        <Text style={s.chatName}>{displayName}</Text>
        <Text style={s.lastMsg} numberOfLines={1}>
          {item.last_message || ''}
        </Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── MessageBubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isCurrentUser }) {
  const time = safeDate(message.created_at)
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={[s.bubbleContainer, isCurrentUser && s.bubbleRight]}>
      <View style={[s.bubble, isCurrentUser ? s.bubbleOwn : s.bubbleOther]}>
        {!isCurrentUser && (
          <Text style={s.bubbleSender}>{message.sender_name}</Text>
        )}
        <Text style={[s.bubbleText, isCurrentUser && s.bubbleTextOwn]}>
          {message.content}
        </Text>
        <Text style={[s.bubbleTime, isCurrentUser && s.bubbleTimeOwn]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Resolve chat display name from any field the API might return
function resolveChatName(chat) {
  const candidates = [
    chat.name,
    chat.chat_name,
    chat.group_name,
    chat.title,
    chat.room_name,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return `Chat #${chat.chat_id ?? '?'}`;
}

// Deduplicate chats by chat_id, keeping the first occurrence
function deduplicateChats(chats) {
  const seen = new Set();
  return chats.filter(c => {
    const key = String(c.chat_id ?? Math.random());
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
function ConnectionsScreen({ navigation }) {
  const [activeTab, setActiveTab]         = useState('connections');
  const [events, setEvents]               = useState([]);
  const [chats, setChats]                 = useState([]);
  const [query, setQuery]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [currentMonth, setCurrentMonth]   = useState(new Date().getMonth());
  const [currentYear, setCurrentYear]     = useState(new Date().getFullYear());
  const [selectedChat, setSelectedChat]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [messageText, setMessageText]     = useState('');
  const [selectedDate, setSelectedDate]   = useState(null);
  const [showAddEvent, setShowAddEvent]   = useState(false);
  const [newEvent, setNewEvent]           = useState({
    title: '', location: '', date: '', time: '', description: '',
  });
  const [newMessage, setNewMessage] = useState('');
  const [membersModalVisible, setMembersModalVisible] = useState(false);
const [chatMembers, setChatMembers] = useState([]);

  // Load chats — normalise name + deduplicate here so the list is clean
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getChats(CURRENT_USER_ID);
      const arr = Array.isArray(data) ? data : [];
      // Attach resolvedName so ChatCard never has to guess
      const normalised = arr.map(c => ({ ...c, resolvedName: resolveChatName(c) }));
      setChats(deduplicateChats(normalised));
    } catch {
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'connections') loadChats();
    else if (activeTab === 'events') loadEvents();
  }, [activeTab, loadChats, loadEvents]);

  // Filter chats by search
  const filteredChats = chats.filter(c =>
    (c.resolvedName || '').toLowerCase().includes(query.toLowerCase())
  );

  // Open chat
  const handleOpenChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const data = await getMessages(chat.chat_id);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    const content = messageText.trim();
    setMessageText('');
    try {
      const result = await sendMessage(selectedChat.chat_id, CURRENT_USER_ID, content);
      setMessages(prev => [...prev, {
        message_id: result?.message_id ?? `tmp-${Date.now()}`,
        sender_id: CURRENT_USER_ID,
        content,
        created_at: new Date().toISOString(),
        sender_name: 'You',
      }]);
    } catch {
      // silent fail
    }
  };

  // RSVP
  const handleRsvp = (eventId, status) => {
    setEvents(prev =>
      prev.map(e => e.event_id === eventId ? { ...e, user_status: status } : e)
    );
  };

  // Event group chat
  const handleEventChat = (event) => {
    navigation.navigate('ChatRoom', {
      chatId: event.chat_id,
      chatName: event.title,
      userId: CURRENT_USER_ID,
    });
  };

  // Add event
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.location) {
      alert('Please fill in title, date and location.');
      return;
    }
    try {
      const payload = {
        title: newEvent.title,
        location: newEvent.location,
        event_date: newEvent.date + (newEvent.time ? `T${newEvent.time}:00` : 'T00:00:00'),
        created_by: CURRENT_USER_ID,
        description: newEvent.description || '',
      };
      const response = await createEvent(payload);
      const created = {
        event_id: response.event_id ?? `tmp-${Date.now()}`,
        title: response.title ?? payload.title,
        location: response.location ?? payload.location,
        event_date: response.event_date ?? payload.event_date,
        description: response.description ?? payload.description,
        created_by: CURRENT_USER_ID,
        user_status: 'going',
        ...response,
      };
      setEvents(prev => [...prev, created]);

      const d = safeDate(created.event_date);
      if (d && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      }

      setShowAddEvent(false);
      setNewEvent({ title: '', location: '', date: '', time: '', description: '' });
    } catch {
      alert('Failed to add event. Please try again.');
    }
  };

  // Filter events for selected date
  const displayedEvents = selectedDate
    ? events.filter(e => {
        const d = safeDate(e.event_date);
        return (
          d &&
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth()    === selectedDate.getMonth() &&
          d.getDate()     === selectedDate.getDate()
        );
      })
    : events;

  // ── Chat room view ──────────────────────────────────────────────────────────
if (selectedChat) {
  return (
    <SafeAreaView style={s.container}>
      
      {/* Chat Header */}
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedChat(null)} style={s.backBtn}>
          <Text style={s.backBtnText}>‹</Text>
        </TouchableOpacity>

        <Text style={s.chatHeaderTitle}>
          {selectedChat.name || 'Chat'}
        </Text>

        {/* 👥 MEMBERS BUTTON */}
        <TouchableOpacity
          onPress={async () => {
            try {
              const members = await getChatMembers(selectedChat.chat_id);
              setChatMembers(members);
              setMembersModalVisible(true);
            } catch (err) {
              console.error(err);
            }
          }}
          style={{ marginLeft: 'auto' }}
        >
          <Text style={{ fontSize: 18 }}>👥</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item, i) => `msg-${i}`}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.background }}>
              {item.content}
            </Text>
          </View>
        )}
      />

      {/* 👥 MEMBERS MODAL */}
      <Modal
        visible={membersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMembersModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Members</Text>

            {chatMembers.length === 0 ? (
              <Text style={{ color: colors.lightpurple }}>No members</Text>
            ) : (
              chatMembers.map((member) => (
                <View
                  key={member.user_id}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: 'rgba(184,180,242,0.2)',
                  }}
                >
                  <Text style={{ color: colors.background }}>
                    {member.name}
                  </Text>
                </View>
              ))
            )}

            <TouchableOpacity
              style={s.modalCancelBtn}
              onPress={() => setMembersModalVisible(false)}
            >
              <Text style={s.modalCancelBtnText}>close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
  // ── Main view ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>connecting</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {['connections', 'events'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Event Modal */}
      <Modal
        visible={showAddEvent}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddEvent(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>new event</Text>

            {[
              { label: 'title',       field: 'title',       placeholder: 'event name' },
              { label: 'location',    field: 'location',    placeholder: 'where?' },
              { label: 'date',        field: 'date',        placeholder: 'YYYY-MM-DD' },
              { label: 'time',        field: 'time',        placeholder: 'HH:MM (optional)' },
            ].map(({ label, field, placeholder }) => (
              <View key={field}>
                <Text style={s.modalLabel}>{label}</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder={placeholder}
                  placeholderTextColor="rgba(184,180,242,0.5)"
                  value={newEvent[field]}
                  onChangeText={t => setNewEvent({ ...newEvent, [field]: t })}
                />
              </View>
            ))}

            <Text style={s.modalLabel}>description</Text>
            <TextInput
              style={[s.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="tell people about it..."
              placeholderTextColor="rgba(184,180,242,0.5)"
              value={newEvent.description}
              onChangeText={t => setNewEvent({ ...newEvent, description: t })}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowAddEvent(false)}
              >
                <Text style={s.modalCancelBtnText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalPostBtn} onPress={handleAddEvent}>
                <Text style={s.modalPostBtnText}>add event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search bar */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder={activeTab === 'connections' ? 'search chats...' : 'search events...'}
          placeholderTextColor="rgba(184,180,242,0.5)"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Loading / Error */}
      {loading && <ActivityIndicator style={{ marginTop: 40 }} color={colors.lightpurple} />}
      {!!error && (
        <Text style={{ color: colors.beige, textAlign: 'center', marginTop: 20, fontFamily: fonts.regular }}>
          {error}
        </Text>
      )}

      {/* Connections tab */}
      {!loading && activeTab === 'connections' && (
        <FlatList
          data={filteredChats}
          // Key = chat_id (already deduplicated) + index safety suffix
          keyExtractor={(item, i) => `chat-${item.chat_id ?? i}-${i}`}
          renderItem={({ item }) => (
            <ChatCard item={item} onPress={handleOpenChat} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
              <Text style={{ color: colors.lightpurple, fontFamily: fonts.regular, opacity: 0.7 }}>
                no chats yet
              </Text>
            </View>
          }
        />
      )}

      {/* Events tab */}
      {!loading && activeTab === 'events' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
          <Calendar
            events={events}
            year={currentYear}
            month={currentMonth}
            onPrev={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
              else setCurrentMonth(m => m - 1);
            }}
            onNext={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
              else setCurrentMonth(m => m + 1);
            }}
            onSelectDate={date => setSelectedDate(prev =>
              prev && prev.toDateString() === date.toDateString() ? null : date
            )}
          />

          {selectedDate && (
            <Text style={s.selectedDateLabel}>{selectedDate.toDateString()}</Text>
          )}

          {displayedEvents.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
              <Text style={{ color: colors.lightpurple, fontFamily: fonts.regular, opacity: 0.7 }}>
                no events yet
              </Text>
            </View>
          ) : (
            displayedEvents.map((item, index) => (
              <EventCard
                // Combine event_id + index for a guaranteed unique key
                key={`event-${item.event_id ?? index}-${index}`}
                item={item}
                onRsvp={handleRsvp}
                onChat={handleEventChat}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      {activeTab === 'events' && (
        <TouchableOpacity style={s.fab} onPress={() => setShowAddEvent(true)}>
          <Text style={s.fabText}>＋</Text>
        </TouchableOpacity>
      )}

{/* ================= CHAT MODAL ================= */}
<Modal
  visible={!!selectedChat}
  animationType="slide"
  onRequestClose={() => setSelectedChat(null)}
>
  <SafeAreaView style={s.container}>
    
    {/* Chat Header */}
    <View style={s.chatHeader}>
      <TouchableOpacity onPress={() => setSelectedChat(null)} style={s.backBtn}>
        <Text style={s.backBtnText}>‹</Text>
      </TouchableOpacity>

      <Text style={s.chatHeaderTitle}>
        {selectedChat?.name || 'Chat'}
      </Text>

      {/* 👥 MEMBERS BUTTON */}
      <TouchableOpacity
        onPress={async () => {
          try {
            const members = await getChatMembers(selectedChat.chat_id);
            setChatMembers(members);
            setMembersModalVisible(true);
          } catch (err) {
            console.error(err);
          }
        }}
        style={{ marginLeft: 'auto' }}
      >
        <Text style={{ fontSize: 18 }}>👥</Text>
      </TouchableOpacity>
    </View>

    {/* Messages */}
    <FlatList
      data={messages}
      keyExtractor={(item, i) => `msg-${i}`}
      contentContainerStyle={{ padding: 20 }}
      renderItem={({ item }) => (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.background }}>
            {item.content}
          </Text>
        </View>
      )}
    />

    <View style={s.inputRow}>
  <TextInput
    style={s.input}
    placeholder="Type a message..."
    placeholderTextColor="rgba(184,180,242,0.5)"
    value={newMessage}
    onChangeText={setNewMessage}
  />

  <TouchableOpacity
    onPress={async () => {
      if (!newMessage.trim()) return;

      try {
        const msg = await sendMessage(
          selectedChat.chat_id,
          user.user_id, // ⚠️ make sure you have this
          newMessage
        );

        // 🔥 instantly update UI
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
      } catch (err) {
        console.error(err);
      }
    }}
    style={s.sendBtn}
  >
    <Text style={s.sendText}>Send</Text>
  </TouchableOpacity>
</View>

    {/* 👥 MEMBERS MODAL (nested) */}
    <Modal
      visible={membersModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setMembersModalVisible(false)}
    >
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <Text style={s.modalTitle}>Members</Text>

          {chatMembers.length === 0 ? (
            <Text style={{ color: colors.lightpurple }}>No members</Text>
          ) : (
            chatMembers.map((member) => (
              <View
                key={member.user_id}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderColor: 'rgba(184,180,242,0.2)',
                }}
              >
                <Text style={{ color: colors.background }}>
                  {member.name}
                </Text>
              </View>
            ))
          )}

          <TouchableOpacity
            style={s.modalCancelBtn}
            onPress={() => setMembersModalVisible(false)}
          >
            <Text style={s.modalCancelBtnText}>close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

  </SafeAreaView>
</Modal>



    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.loginbackground },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle: {
    fontSize: 28, fontFamily: fonts.bold, color: colors.dark, letterSpacing: -0.5,
  },

  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 14,
    backgroundColor: colors.purple, borderRadius: 14, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  tabActive: { backgroundColor: colors.lightpurple },
  tabText: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(184,180,242,0.5)' },
  tabTextActive: { fontFamily: fonts.bold, color: colors.dark },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.purple,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    marginHorizontal: 20, marginBottom: 12, gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: colors.background, fontFamily: fonts.regular },

  chatCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.purple,
    borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(184,180,242,0.2)', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.3)',
  },
  initials: { fontFamily: fonts.bold, color: colors.lightpurple, fontSize: 15 },
  chatInfo: { flex: 1 },
  chatName: { fontFamily: fonts.bold, color: colors.background, fontSize: 14, marginBottom: 3 },
  lastMsg: { fontFamily: fonts.regular, color: colors.lightpurple, fontSize: 12, opacity: 0.7 },
  chevron: { color: colors.lightpurple, fontSize: 22, opacity: 0.5 },

  calCard: {
    backgroundColor: colors.purple, borderRadius: 20, padding: 16, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 6, backgroundColor: 'rgba(184,180,242,0.15)', borderRadius: 8 },
  navBtnText: { fontSize: 22, color: colors.lightpurple },
  monthLabel: { fontFamily: fonts.bold, color: colors.background, fontSize: 15 },
  dayHeaderRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  dayHeader: {
    fontFamily: fonts.bold, color: colors.lightpurple, fontSize: 11,
    opacity: 0.7, width: '14.28%', textAlign: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', alignItems: 'center', marginVertical: 3 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  todayCircle: { backgroundColor: colors.lightpurple },
  dayText: { color: colors.background, fontFamily: fonts.regular, fontSize: 13 },
  todayText: { color: colors.dark, fontFamily: fonts.bold },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: colors.beige },

  selectedDateLabel: {
    fontFamily: fonts.bold, color: colors.dark, fontSize: 14, marginBottom: 10, opacity: 0.7,
  },

  eventCard: {
    backgroundColor: colors.purple, borderRadius: 18, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  eventTop: { flexDirection: 'row', alignItems: 'flex-start' },
  dateBadge: {
    width: 48, height: 52, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: 'rgba(184,180,242,0.15)', marginRight: 12,
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.2)',
  },
  dateDay: { fontFamily: fonts.bold, color: colors.lightpurple, fontSize: 18 },
  dateMonth: { fontFamily: fonts.bold, color: colors.lightpurple, fontSize: 10, opacity: 0.7 },
  eventInfo: { flex: 1 },
  eventTitle: { fontFamily: fonts.bold, color: colors.background, fontSize: 15, marginBottom: 4 },
  eventMeta: { fontFamily: fonts.regular, color: colors.lightpurple, fontSize: 12, opacity: 0.7 },
  groupName: { fontFamily: fonts.regular, color: colors.beige, fontSize: 11, marginTop: 3 },

  btnRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  rsvpBtn: {
    paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.3)',
    backgroundColor: 'rgba(184,180,242,0.1)',
  },
  rsvpBtnActive: { backgroundColor: colors.lightpurple, borderColor: colors.lightpurple },
  rsvpBtnText: { fontFamily: fonts.bold, color: colors.lightpurple, fontSize: 12 },
  rsvpBtnTextActive: { color: colors.dark },
  chatBtn: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.beige },
  chatBtnText: { fontFamily: fonts.bold, color: colors.dark, fontSize: 12 },

  chatHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(184,180,242,0.15)',
  },
  backBtn: {
    marginRight: 12, backgroundColor: 'rgba(184,180,242,0.15)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  backBtnText: { fontSize: 22, color: colors.lightpurple },
  chatHeaderTitle: { fontFamily: fonts.bold, color: colors.background, fontSize: 16 },

  bubbleContainer: { padding: 4, alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },
  bubble: { borderRadius: 16, padding: 10, maxWidth: '80%' },
  bubbleOwn: { backgroundColor: colors.lightpurple },
  bubbleOther: { backgroundColor: colors.purple },
  bubbleSender: { fontFamily: fonts.bold, color: colors.beige, fontSize: 11, marginBottom: 3 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 14, color: colors.background },
  bubbleTextOwn: { color: colors.dark },
  bubbleTime: { fontSize: 10, color: colors.lightpurple, alignSelf: 'flex-end', marginTop: 4, opacity: 0.6 },
  bubbleTimeOwn: { color: colors.dark, opacity: 0.6 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderTopWidth: 1,
    borderTopColor: 'rgba(184,180,242,0.15)', gap: 8,
  },
  messageInput: {
    flex: 1, backgroundColor: colors.purple, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: colors.background, fontFamily: fonts.regular,
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.2)',
  },
  sendBtn: {
    backgroundColor: colors.beige, width: 40, height: 40,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnText: { color: colors.dark, fontFamily: fonts.bold, fontSize: 18 },

  fab: {
    position: 'absolute', bottom: 30, right: 22,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.beige, justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  fabText: { color: colors.dark, fontSize: 24, fontFamily: fonts.bold },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(9,1,36,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.purple, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.background, marginBottom: 20 },
  modalLabel: {
    fontSize: 11, color: colors.beige, fontFamily: fonts.bold,
    marginBottom: 8, marginTop: 14, letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: 'rgba(184,180,242,0.1)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: colors.background, borderWidth: 1.5,
    borderColor: 'rgba(184,180,242,0.2)', fontFamily: fonts.regular,
  },
  modalCancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderWidth: 1, borderColor: 'rgba(184,180,242,0.2)',
  },
  modalCancelBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.lightpurple },
  modalPostBtn: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.beige },
  modalPostBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.dark },
});

export default ConnectionsScreen;