import React, { useState, useEffect, useCallback } from 'react';
import {
View,
Text,
FlatList,
TextInput,
TouchableOpacity,
ActivityIndicator,
StyleSheet,
Modal,
ScrollView,
Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
















import { colors, fonts } from '../../styles/themes';
import {
getChats,
getMessages,
sendMessage,
getEvents,
createEvent,
getChatMembers,
} from '../../api/api';
















const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
'January', 'February', 'March', 'April', 'May', 'June',
'July', 'August', 'September', 'October', 'November', 'December',
];
















function safeDate(value) {
if (!value) return null;
const d = new Date(value);
return Number.isNaN(d.getTime()) ? null : d;
}
















function resolveChatName(chat) {
const candidates = [
chat.name,
chat.chat_name,
chat.group_name,
chat.title,
chat.room_name,
];
















for (const candidate of candidates) {
if (typeof candidate === 'string' && candidate.trim()) {
  return candidate.trim();
}
}
















return `Chat #${chat.chat_id ?? '?'}`;
}
















function deduplicateChats(chats) {
const seen = new Set();
















return chats.filter((chat) => {
const key = String(chat.chat_id ?? Math.random());
if (seen.has(key)) return false;
seen.add(key);
return true;
});
}
















function Calendar({ events, year, month, onPrev, onNext, onSelectDate }) {
const firstDay = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();
const today = new Date();
















const eventDays = events
.map((event) => safeDate(event.event_date))
.filter((date) => date && date.getFullYear() === year && date.getMonth() === month)
.map((date) => date.getDate());
















const cells = [];
for (let i = 0; i < firstDay; i += 1) cells.push(null);
for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
















return (
<View style={s.calCard}>
  <View style={s.calNav}>
    <TouchableOpacity onPress={onPrev} style={s.navBtn}>
      <Text style={s.navBtnText}>‹</Text>
    </TouchableOpacity>
















    <Text style={s.monthLabel}>
      {MONTHS[month]} {year}
    </Text>
















    <TouchableOpacity onPress={onNext} style={s.navBtn}>
      <Text style={s.navBtnText}>›</Text>
    </TouchableOpacity>
  </View>
















  <View style={s.dayHeaderRow}>
    {DAYS.map((day) => (
      <Text key={day} style={s.dayHeader}>
        {day}
      </Text>
    ))}
  </View>
















  <View style={s.grid}>
    {cells.map((day, index) => {
      if (!day) {
        return <View key={`empty-${index}`} style={s.cell} />;
      }
















      const isToday =
        day === today.getDate()
        && month === today.getMonth()
        && year === today.getFullYear();
















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
















function EventCard({ item, onRsvp, onChat }) {
const date = safeDate(item.event_date || item.date);
const dayNum = date ? date.getDate() : '—';
const monthShort = date ? MONTHS[date.getMonth()].slice(0, 3).toUpperCase() : '—';
const timeStr = date
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
          {timeStr}
          {item.location ? ` · ${item.location}` : ''}
        </Text>
      )}
      {item.group_name ? <Text style={s.groupName}>{item.group_name}</Text> : null}
    </View>
  </View>
















  <View style={s.btnRow}>
    <TouchableOpacity
      style={[s.rsvpBtn, isGoing && s.rsvpBtnActive]}
      onPress={() => onRsvp(item.event_id, isGoing ? 'not_going' : 'going')}
    >
      <Text style={[s.rsvpBtnText, isGoing && s.rsvpBtnTextActive]}>
        {isGoing ? '✓ going' : 'rsvp'}
      </Text>
    </TouchableOpacity>
















    {item.chat_id ? (
      <TouchableOpacity style={s.chatBtn} onPress={() => onChat(item)}>
        <Text style={s.chatBtnText}>group chat →</Text>
      </TouchableOpacity>
    ) : null}
  </View>
</View>
);
}
















function ChatCard({ item, onPress }) {
const displayName = item.resolvedName || 'Chat';
















const initials = displayName
.split(' ')
.filter((word) => word.length > 0)
.map((word) => word[0])
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
















function MessageBubble({ message, isCurrentUser }) {
const time = safeDate(message.created_at)
? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
: '';
















return (
<View style={[s.bubbleContainer, isCurrentUser && s.bubbleRight]}>
  <View style={[s.bubble, isCurrentUser ? s.bubbleOwn : s.bubbleOther]}>
    {!isCurrentUser ? (
      <Text style={s.bubbleSender}>{message.sender_name}</Text>
    ) : null}
















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
















export default function ConnectionsScreen({ navigation, user, initialChatId, onChatOpened }) {
const CURRENT_USER_ID = user?.user_id ?? null;
















const [activeTab, setActiveTab] = useState('connections');
const [events, setEvents] = useState([]);
const [chats, setChats] = useState([]);
const [query, setQuery] = useState('');
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
const [selectedChat, setSelectedChat] = useState(null);
const [messages, setMessages] = useState([]);
const [messageText, setMessageText] = useState('');
const [selectedDate, setSelectedDate] = useState(null);
const [showAddEventModal, setShowAddEventModal] = useState(false);
const [newEvent, setNewEvent] = useState({
title: '',
location: '',
date: '',
time: '',
description: '',
});
const [membersModalVisible, setMembersModalVisible] = useState(false);
const [chatMembers, setChatMembers] = useState([]);
















const loadChats = useCallback(async () => {
try {
  setLoading(true);
  setError(null);
















  const data = await getChats(CURRENT_USER_ID);
  const chatArray = Array.isArray(data) ? data : [];
  const normalizedChats = chatArray.map((chat) => ({
    ...chat,
    resolvedName: resolveChatName(chat),
  }));
















  setChats(deduplicateChats(normalizedChats));
} catch {
  setError('Failed to load chats');
} finally {
  setLoading(false);
}
}, [CURRENT_USER_ID]);
















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
if (activeTab === 'connections') {
  loadChats();
} else if (activeTab === 'events') {
  loadEvents();
}
}, [activeTab, loadChats, loadEvents]);
















useEffect(() => {
if (!initialChatId || chats.length === 0) return;
















const chat = chats.find((item) => item.chat_id === initialChatId);
if (chat) {
  handleOpenChat(chat);
  onChatOpened?.();
}
}, [initialChatId, chats, onChatOpened]);
















const filteredChats = chats.filter((chat) =>
(chat.resolvedName || '').toLowerCase().includes(query.toLowerCase())
);
















const displayedEvents = selectedDate
? events.filter((event) => {
    const date = safeDate(event.event_date);
    return (
      date
      && date.getFullYear() === selectedDate.getFullYear()
      && date.getMonth() === selectedDate.getMonth()
      && date.getDate() === selectedDate.getDate()
    );
  })
: events;
















const handleOpenChat = async (chat) => {
setSelectedChat(chat);
















try {
  const data = await getMessages(chat.chat_id);
  setMessages(Array.isArray(data) ? data : []);
} catch {
  setMessages([]);
}
};
















const handleSendMessage = async () => {
if (!messageText.trim() || !selectedChat || !CURRENT_USER_ID) return;
















const content = messageText.trim();
setMessageText('');
















try {
  const result = await sendMessage(selectedChat.chat_id, CURRENT_USER_ID, content);
















  setMessages((prev) => [
    ...prev,
    {
      message_id: result?.message_id ?? `tmp-${Date.now()}`,
      sender_id: CURRENT_USER_ID,
      content,
      created_at: new Date().toISOString(),
      sender_name: 'You',
    },
  ]);
} catch {
  // keep silent to match the existing pattern
}
};
















const handleRsvp = (eventId, status) => {
setEvents((prev) =>
  prev.map((event) =>
    event.event_id === eventId ? { ...event, user_status: status } : event
  )
);
};
















const handleEventChat = (event) => {
navigation.navigate('ChatRoom', {
  chatId: event.chat_id,
  chatName: event.title,
  userId: CURRENT_USER_ID,
});
};
















const handleAddEvent = async () => {
if (!newEvent.title || !newEvent.date || !newEvent.location) {
  alert('Please fill in title, date and location.');
  return;
}
















try {
  const payload = {
    title: newEvent.title,
    location: newEvent.location,
    event_date: newEvent.date + (newEvent.time ? `T${newEvent.time}:00` : ''),
    created_by: CURRENT_USER_ID,
    description: newEvent.description || '',
  };
















  const response = await createEvent(payload);
















  setEvents((prev) => [...prev, response]);
  setShowAddEventModal(false);
  setNewEvent({
    title: '',
    location: '',
    date: '',
    time: '',
    description: '',
  });
} catch {
  alert('Failed to add event');
}
};
















return (
<SafeAreaView style={[s.container, { backgroundColor: colors.loginbackground }]}>
  <View style={s.header}>
    <Text style={s.headerTitle}>connecting</Text>
  </View>
















  <View style={s.tabRow}>
    {['connections', 'events'].map((tab) => (
      <TouchableOpacity
        key={tab}
        style={[s.tab, activeTab === tab && s.tabActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
          {tab}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
















  <Modal
    visible={showAddEventModal}
    transparent
    animationType="slide"
    onRequestClose={() => setShowAddEventModal(false)}
  >
    <View style={s.modalOverlay}>
      <View style={s.modalContent}>
        <Text style={s.modalTitle}>new event</Text>
















        {[
          { label: 'title', field: 'title', placeholder: 'event name' },
          { label: 'location', field: 'location', placeholder: 'where?' },
          { label: 'date', field: 'date', placeholder: 'YYYY-MM-DD' },
          { label: 'time', field: 'time', placeholder: 'HH:MM (optional)' },
        ].map(({ label, field, placeholder }) => (
          <View key={field}>
            <Text style={s.modalLabel}>{label}</Text>
            <TextInput
              style={s.modalInput}
              placeholder={placeholder}
              placeholderTextColor="rgba(184,180,242,0.5)"
              value={newEvent[field]}
              onChangeText={(text) => setNewEvent({ ...newEvent, [field]: text })}
            />
          </View>
        ))}
















        <Text style={s.modalLabel}>description</Text>
        <TextInput
          style={[s.modalInput, s.modalTextArea]}
          placeholder="tell people about it..."
          placeholderTextColor="rgba(184,180,242,0.5)"
          value={newEvent.description}
          onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
          multiline
        />
















        <View style={s.modalButtonRow}>
          <TouchableOpacity
            style={s.modalCancelBtn}
            onPress={() => setShowAddEventModal(false)}
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
















  {loading ? (
    <ActivityIndicator style={{ marginTop: 40 }} color={colors.lightpurple} />
  ) : null}
















  {!!error ? (
    <Text style={s.errorText}>{error}</Text>
  ) : null}
















  {!loading && activeTab === 'connections' ? (
    <FlatList
      data={filteredChats}
      keyExtractor={(item, index) => `chat-${item.chat_id ?? index}-${index}`}
      renderItem={({ item }) => <ChatCard item={item} onPress={handleOpenChat} />}
      contentContainerStyle={s.listContent}
      ListEmptyComponent={
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>💬</Text>
          <Text style={s.emptyText}>no chats yet</Text>
        </View>
      }
    />
  ) : null}
















  {!loading && activeTab === 'events' ? (
    <ScrollView contentContainerStyle={s.eventsContent}>
      <Calendar
        events={events}
        year={currentYear}
        month={currentMonth}
        onPrev={() => {
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((year) => year - 1);
          } else {
            setCurrentMonth((month) => month - 1);
          }
        }}
        onNext={() => {
          if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((year) => year + 1);
          } else {
            setCurrentMonth((month) => month + 1);
          }
        }}
        onSelectDate={(date) =>
          setSelectedDate((prev) =>
            prev && prev.toDateString() === date.toDateString() ? null : date
          )
        }
      />
















      {selectedDate ? (
        <Text style={s.selectedDateLabel}>{selectedDate.toDateString()}</Text>
      ) : null}
















      {displayedEvents.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>📅</Text>
          <Text style={s.emptyText}>no events yet</Text>
        </View>
      ) : (
        displayedEvents.map((item, index) => (
          <EventCard
            key={`event-${item.event_id ?? index}-${index}`}
            item={item}
            onRsvp={handleRsvp}
            onChat={handleEventChat}
          />
        ))
      )}
    </ScrollView>
  ) : null}








  {activeTab === 'events' ? (
    <TouchableOpacity style={s.fab} onPress={() => setShowAddEventModal(true)}>
      <Text style={s.fabText}>＋</Text>
    </TouchableOpacity>
  ) : null}
















  <Modal
    visible={!!selectedChat}
    animationType="slide"
    onRequestClose={() => setSelectedChat(null)}
  >
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.loginbackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 54 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.loginbackground }}>
        <View style={[s.chatHeader, { backgroundColor: colors.purple }]}> // dark header
          <TouchableOpacity onPress={() => setSelectedChat(null)} style={s.backBtn}>
            <Text style={s.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.chatHeaderTitle, { color: colors.background }]}> // white text
            {selectedChat?.resolvedName || selectedChat?.name || 'Chat'}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              if (!selectedChat) return;
              try {
                const members = await getChatMembers(selectedChat.chat_id);
                setChatMembers(Array.isArray(members) ? members : []);
                setMembersModalVisible(true);
              } catch {
                setChatMembers([]);
                setMembersModalVisible(true);
              }
            }}
            style={{ marginLeft: 'auto' }}
          >
            <Text style={{ fontSize: 18, color: colors.background }}>👥</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.purple }}>
          <FlatList
            data={messages}
            keyExtractor={(item, index) => `msg-${item.message_id ?? index}-${index}`}
            contentContainerStyle={s.messagesContent}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isCurrentUser={item.sender_id === CURRENT_USER_ID}
              />
            )}
          />
          <View style={[s.inputRow, { backgroundColor: colors.purple }]}> // dark input row
            <TextInput
              style={[s.input, { backgroundColor: '#2D1B5A', color: colors.background }]} // darker input, white text
              placeholder="Type a message..."
              placeholderTextColor="rgba(184,180,242,0.5)"
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity onPress={handleSendMessage} style={s.sendBtn}>
              <Text style={s.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
















        <Modal
          visible={membersModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setMembersModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>members</Text>
















              {chatMembers.length === 0 ? (
                <Text style={{ color: colors.lightpurple }}>No members</Text>
              ) : (
                chatMembers.map((member) => (
                  <View key={member.user_id} style={s.memberRow}>
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
    </KeyboardAvoidingView>
  </Modal>
</SafeAreaView>
);
}
















const s = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.loginbackground, // match other screens
},
















header: {
paddingHorizontal: 20,
paddingTop: 8,
paddingBottom: 14,
},
headerTitle: {
color: colors.dark,
fontFamily: fonts.bold,
fontSize: 28,
letterSpacing: -0.5,
textTransform: 'lowercase',
},
















tabRow: {
flexDirection: 'row',
marginHorizontal: 20,
marginBottom: 14,
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
tabActive: {
backgroundColor: colors.lightpurple,
},
tabText: {
color: 'rgba(184,180,242,0.5)',
fontFamily: fonts.regular,
fontSize: 13,
textTransform: 'lowercase',
},
tabTextActive: {
color: colors.purple,
fontFamily: fonts.bold,
},
















searchBar: {
flexDirection: 'row',
alignItems: 'center',
marginHorizontal: 20,
marginBottom: 16,
borderRadius: 14,
backgroundColor: colors.purple,
paddingHorizontal: 14,
paddingVertical: 11,
gap: 8,
},
searchIcon: {
fontSize: 14,
},
searchInput: {
flex: 1,
color: colors.background,
fontFamily: fonts.regular,
fontSize: 14,
},
















errorText: {
color: colors.beige,
textAlign: 'center',
marginTop: 20,
fontFamily: fonts.regular,
},
















listContent: {
paddingHorizontal: 20,
paddingBottom: 100,
},
eventsContent: {
paddingHorizontal: 20,
paddingBottom: 100,
},
















emptyState: {
alignItems: 'center',
marginTop: 60,
},
emptyEmoji: {
fontSize: 40,
marginBottom: 12,
},
emptyText: {
color: colors.lightpurple,
fontFamily: fonts.regular,
opacity: 0.7,
textAlign: 'center',
},
















calCard: {
backgroundColor: colors.purple, // dark widget
borderRadius: 24,
padding: 16,
marginBottom: 16,
},
calNav: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 14,
},
navBtn: {
width: 36,
height: 36,
borderRadius: 18,
backgroundColor: 'rgba(184,180,242,0.12)',
alignItems: 'center',
justifyContent: 'center',
},
navBtnText: {
color: colors.background,
fontSize: 24,
},
monthLabel: {
color: colors.background, // white text
fontFamily: fonts.bold,
fontSize: 16,
},
dayHeaderRow: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 10,
},
dayHeader: {
width: `${100 / 7}%`,
textAlign: 'center',
color: colors.lightpurple,
fontFamily: fonts.bold,
fontSize: 12,
},
grid: {
flexDirection: 'row',
flexWrap: 'wrap',
},
cell: {
width: `${100 / 7}%`,
alignItems: 'center',
marginBottom: 10,
},
dayCircle: {
width: 34,
height: 34,
borderRadius: 17,
alignItems: 'center',
justifyContent: 'center',
},
todayCircle: {
backgroundColor: colors.beige,
},
dayText: {
color: colors.background,
fontFamily: fonts.regular,
},
todayText: {
color: colors.purple,
fontFamily: fonts.bold,
},
dot: {
marginTop: 4,
width: 6,
height: 6,
borderRadius: 3,
opacity: 0,
},
dotVisible: {
opacity: 1,
backgroundColor: colors.beige,
},
















selectedDateLabel: {
color: colors.purple,
fontFamily: fonts.bold,
marginBottom: 12,
textTransform: 'lowercase',
},
















eventCard: {
backgroundColor: colors.purple, // dark widget
borderRadius: 22,
padding: 16,
marginBottom: 12,
},
eventTop: {
flexDirection: 'row',
},
dateBadge: {
width: 62,
height: 62,
borderRadius: 18,
backgroundColor: colors.beige,
alignItems: 'center',
justifyContent: 'center',
marginRight: 14,
},
dateDay: {
color: colors.purple,
fontFamily: fonts.bold,
fontSize: 20,
lineHeight: 22,
},
dateMonth: {
color: colors.purple,
fontFamily: fonts.bold,
fontSize: 11,
},
eventInfo: {
flex: 1,
justifyContent: 'center',
},
eventTitle: {
color: colors.background, // white text
fontFamily: fonts.bold,
fontSize: 16,
marginBottom: 4,
},
eventMeta: {
color: colors.lightpurple,
fontFamily: fonts.regular,
marginBottom: 2,
},
groupName: {
color: colors.beige,
fontFamily: fonts.bold,
fontSize: 12,
textTransform: 'lowercase',
},
btnRow: {
flexDirection: 'row',
gap: 10,
marginTop: 14,
},
rsvpBtn: {
paddingVertical: 10,
paddingHorizontal: 16,
borderRadius: 14,
borderWidth: 1,
borderColor: 'rgba(184,180,242,0.25)',
},
rsvpBtnActive: {
backgroundColor: colors.beige,
borderColor: colors.beige,
},
rsvpBtnText: {
color: colors.lightpurple,
fontFamily: fonts.bold,
textTransform: 'lowercase',
},
rsvpBtnTextActive: {
color: colors.purple,
},
chatBtn: {
paddingVertical: 10,
paddingHorizontal: 16,
borderRadius: 14,
backgroundColor: 'rgba(184,180,242,0.12)',
borderWidth: 1,
borderColor: 'rgba(184,180,242,0.25)',
},
chatBtnText: {
color: colors.background,
fontFamily: fonts.bold,
textTransform: 'lowercase',
},
















fab: {
position: 'absolute',
right: 22,
bottom: 24,
width: 58,
height: 58,
borderRadius: 29,
backgroundColor: colors.beige,
alignItems: 'center',
justifyContent: 'center',
...Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  android: {
    elevation: 8,
  },
}),
},
fabText: {
color: colors.purple,
fontSize: 28,
lineHeight: 30,
fontFamily: fonts.bold,
},
















chatHeader: {
flexDirection: 'row',
alignItems: 'center',
minHeight: 56,
paddingHorizontal: 20,
paddingTop: Platform.OS === 'ios' ? 54 : 40,
paddingBottom: 12,
borderBottomWidth: 1,
borderBottomColor: 'rgba(184,180,242,0.15)',
backgroundColor: colors.purple, // dark header
},
backBtn: {
width: 36,
height: 36,
borderRadius: 18,
alignItems: 'center',
justifyContent: 'center',
marginRight: 12,
},
backBtnText: {
color: colors.background, // white back button
fontSize: 26,
lineHeight: 26,
},
chatHeaderTitle: {
color: colors.background, // white text
fontFamily: fonts.bold,
fontSize: 18,
},
















messagesContent: {
padding: 20,
},
bubbleContainer: {
marginBottom: 12,
alignItems: 'flex-start',
},
bubbleRight: {
alignItems: 'flex-end',
},
bubble: {
maxWidth: '80%',
borderRadius: 18,
paddingHorizontal: 14,
paddingVertical: 10,
},
bubbleOwn: {
backgroundColor: colors.beige,
},
bubbleOther: {
backgroundColor: 'rgba(184,180,242,0.12)',
},
bubbleSender: {
color: colors.lightpurple,
fontFamily: fonts.bold,
fontSize: 12,
marginBottom: 4,
},
bubbleText: {
color: colors.dark,
fontFamily: fonts.regular,
},
bubbleTextOwn: {
color: colors.purple, // own bubble text purple
},
bubbleTime: {
color: colors.lightpurple,
fontSize: 11,
marginTop: 6,
fontFamily: fonts.regular,
},
bubbleTimeOwn: {
color: colors.purple,
opacity: 0.7,
},
















inputRow: {
flexDirection: 'row',
alignItems: 'center',
padding: 16,
borderTopWidth: 1,
borderTopColor: 'rgba(184,180,242,0.15)',
backgroundColor: colors.purple, // dark input row
},
input: {
flex: 1,
backgroundColor: '#2D1B5A', // dark input for chat
borderRadius: 16,
paddingHorizontal: 14,
paddingVertical: 12,
color: colors.background, // white text
fontFamily: fonts.regular,
marginRight: 10,
},
sendBtn: {
backgroundColor: colors.beige,
borderRadius: 14,
paddingHorizontal: 16,
paddingVertical: 12,
},
sendText: {
color: colors.purple,
fontFamily: fonts.bold,
},
















modalOverlay: {
flex: 1,
backgroundColor: 'rgba(9,1,36,0.6)',
justifyContent: 'center',
padding: 20,
},
modalContent: {
backgroundColor: colors.purple, // dark widget for modal
borderRadius: 24,
padding: 20,
borderWidth: 1,
borderColor: 'rgba(184,180,242,0.15)',
},
modalTitle: {
color: colors.background, // white text
fontFamily: fonts.bold,
fontSize: 20,
marginBottom: 16,
textTransform: 'lowercase',
},
modalLabel: {
color: colors.lightpurple,
fontFamily: fonts.bold,
marginBottom: 6,
marginTop: 8,
textTransform: 'lowercase',
},
modalInput: {
backgroundColor: '#2D1B5A', // dark input
borderRadius: 16,
paddingHorizontal: 14,
paddingVertical: 12,
color: colors.background, // white text
fontFamily: fonts.regular,
},
modalTextArea: {
height: 80,
textAlignVertical: 'top',
},
modalButtonRow: {
flexDirection: 'row',
gap: 10,
marginTop: 18,
},
modalCancelBtn: {
flex: 1,
borderRadius: 16,
borderWidth: 1,
borderColor: 'rgba(184,180,242,0.25)',
paddingVertical: 12,
alignItems: 'center',
},
modalCancelBtnText: {
color: colors.lightpurple,
fontFamily: fonts.bold,
textTransform: 'lowercase',
},
modalPostBtn: {
flex: 1,
borderRadius: 16,
backgroundColor: colors.beige,
paddingVertical: 12,
alignItems: 'center',
},
modalPostBtnText: {
color: colors.purple,
fontFamily: fonts.bold,
textTransform: 'lowercase',
},


memberRow: {
paddingVertical: 10,
borderBottomWidth: 1,
borderColor: 'rgba(184,180,242,0.2)',
},


chatCard: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: colors.purple,
borderRadius: 18,
padding: 14,
marginBottom: 10,
...Platform.select({
  ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  android: { elevation: 4 },
}),
},
avatar: {
width: 44,
height: 44,
borderRadius: 22,
backgroundColor: colors.lightpurple,
alignItems: 'center',
justifyContent: 'center',
marginRight: 12,
},
initials: {
color: colors.dark,
fontFamily: fonts.bold,
fontSize: 16,
},
chatInfo: {
flex: 1,
},
chatName: {
color: colors.background,
fontFamily: fonts.bold,
fontSize: 15,
marginBottom: 3,
},
lastMsg: {
color: 'rgba(184,180,242,0.6)',
fontFamily: fonts.regular,
fontSize: 13,
},
chevron: {
color: colors.lightpurple,
fontSize: 22,
opacity: 0.6,
},
});













