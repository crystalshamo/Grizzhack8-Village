// src/screens/Connecting/ConnectionsScreen.js
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/themes';
import { getChats, getMessages, sendMessage, getEvents, createEvent } from '../../api/api';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PALETTE = [
  { c: colors.primary, b: colors.secondary },
  { c: '#0F6E56', b: '#E1F5EE' },
  { c: '#534AB7', b: '#EEEDFE' },
  { c: '#993C1D', b: '#FAECE7' },
  { c: '#854F0B', b: '#FAEEDA' },
];
const getColor = (i) => PALETTE[i % PALETTE.length];

const CURRENT_USER_ID = 18;

// --- Calendar ---
function Calendar({ events, year, month, onPrev, onNext, onSelectDate }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventDays = events
    .filter(e => {
      const d = new Date(e.event_date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .map(e => new Date(e.event_date).getDate());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={styles.calCard}>
      <View style={styles.calNav}>
        <TouchableOpacity onPress={onPrev} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={onNext} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayHeaderRow}>
        {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.cell} />;

          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasEvent = eventDays.includes(day);

          return (
            <TouchableOpacity
              key={`day-${day}-${i}`}
              style={styles.cell}
              onPress={() => onSelectDate(new Date(year, month, day))}
            >
              <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
              </View>
              <View style={[styles.dot, hasEvent && !isToday && styles.dotVisible]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// --- Event Card ---
function EventCard({ item, index, onRsvp, onChat }) {
  const { c, b } = getColor(index);
  const date = new Date(item.event_date || item.date);
  const dayNum = date.getDate();
  const monthShort = MONTHS[date.getMonth()].slice(0, 3).toUpperCase();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isGoing = item.user_status === 'going';

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventTop}>
        <View style={[styles.dateBadge, { backgroundColor: b }]}>
          <Text style={[styles.dateDay, { color: c }]}>{dayNum}</Text>
          <Text style={[styles.dateMonth, { color: c }]}>{monthShort}</Text>
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          {item.event_date && <Text style={styles.eventMeta}>{timeStr} · {item.location}</Text>}
          {item.group_name && <Text style={styles.groupName}>{item.group_name}</Text>}
        </View>
      </View>

      {onRsvp && (
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, { borderColor: isGoing ? c : '#e0e0e0', backgroundColor: isGoing ? b : 'transparent' }]}
            onPress={() => onRsvp(item.event_id, isGoing ? 'not_going' : 'going')}
          >
            <Text style={[styles.btnText, { color: isGoing ? c : '#888' }]}>{isGoing ? '✓ Going' : 'RSVP'}</Text>
          </TouchableOpacity>

          {item.chat_id && (
            <TouchableOpacity
              style={[styles.btn, { borderColor: c, backgroundColor: b }]}
              onPress={() => onChat(item)}
            >
              <Text style={[styles.btnText, { color: c }]}>Group Chat →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// --- Chat Card ---
function ChatCard({ item, index, onPress }) {
  const { c, b } = getColor(index);
  const initials = (item.name || 'Chat').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={[styles.avatar, { backgroundColor: b }]}>
        <Text style={[styles.initials, { color: c }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMsg}>{item.last_message}</Text>
      </View>
    </TouchableOpacity>
  );
}

// --- Message Bubble ---
function MessageBubble({ message, isCurrentUser }) {
  return (
    <View style={[styles.messageBubbleContainer, isCurrentUser && styles.messageBubbleRight]}>
      <View style={[styles.messageBubble, isCurrentUser ? styles.messageBubbleOwnBg : styles.messageBubbleOtherBg]}>
        {!isCurrentUser && <Text style={styles.messageSenderName}>{message.sender_name}</Text>}
        <Text style={[styles.messageText, isCurrentUser ? styles.messageTextOwn : styles.messageTextOther]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, isCurrentUser && styles.messageTimeOwn]}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// --- Main Screen ---
export default function ConnectionsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('connections');
  const [events, setEvents] = useState([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', location: '', date: '', time: '', description: '' });
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

  // Load Chats
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getChats(CURRENT_USER_ID);
      setChats(Array.isArray(data) ? data : []);
    } catch (e) { setError('Failed to load chats'); } 
    finally { setLoading(false); }
  }, []);

  // Load Events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) { setError('Failed to load events'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'connections') loadChats();
    else if (activeTab === 'events') loadEvents();
  }, [activeTab]);

  const filteredChats = chats.filter(c => (c.name || '').toLowerCase().includes(query.toLowerCase()));

  const handleOpenChat = async (chat) => {
    setSelectedChat(chat);
    const data = await getMessages(chat.chat_id);
    setMessages(Array.isArray(data) ? data : []);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    const content = messageText.trim();
    setMessageText('');
    const result = await sendMessage(selectedChat.chat_id, CURRENT_USER_ID, content);
    setMessages(prev => [...prev, { message_id: result.message_id, sender_id: CURRENT_USER_ID, content, created_at: new Date(), sender_name: 'You' }]);
  };

  const handleRsvp = (eventId, status) => {
    setEvents(prev => prev.map(e => e.event_id === eventId ? { ...e, user_status: status } : e));
  };

  const handleEventChat = (event) => {
    navigation.navigate('ChatRoom', { chatId: event.chat_id, chatName: event.title, userId: CURRENT_USER_ID });
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.location) return alert('Fill all fields');
    try {
      const payload = {
        title: newEvent.title,
        location: newEvent.location,
        event_date: newEvent.date + (newEvent.time ? `T${newEvent.time}:00` : ''),
        created_by: CURRENT_USER_ID,
        description: newEvent.description || '',
      };
      const response = await createEvent(payload);

      // Add to events immediately
      setEvents(prev => [...prev, response]);
      setShowAddEventModal(false);
      setNewEvent({ title: '', location: '', date: '', time: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add event');
    }
  };

  const displayedEvents = selectedDate
    ? events.filter(e => {
        const d = new Date(e.event_date);
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
      })
    : events;

  if (!selectedChat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab==='connections'&&styles.tabActive]} onPress={()=>setActiveTab('connections')}>
            <Text style={[styles.tabText, activeTab==='connections'&&styles.tabTextActive]}>Connections</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab==='events'&&styles.tabActive]} onPress={()=>setActiveTab('events')}>
            <Text style={[styles.tabText, activeTab==='events'&&styles.tabTextActive]}>Events</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showAddEventModal} transparent animationType="slide" onRequestClose={()=>setShowAddEventModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TextInput placeholder="Title" value={newEvent.title} onChangeText={t=>setNewEvent({...newEvent,title:t})} style={styles.modalInput}/>
              <TextInput placeholder="Location" value={newEvent.location} onChangeText={t=>setNewEvent({...newEvent,location:t})} style={styles.modalInput}/>
              <TextInput placeholder="Date YYYY-MM-DD" value={newEvent.date} onChangeText={t=>setNewEvent({...newEvent,date:t})} style={styles.modalInput}/>
              <TextInput placeholder="Time HH:MM" value={newEvent.time} onChangeText={t=>setNewEvent({...newEvent,time:t})} style={styles.modalInput}/>
              <TextInput placeholder="Description" value={newEvent.description} onChangeText={t=>setNewEvent({...newEvent,description:t})} style={styles.modalInput}/>
              <View style={{flexDirection:'row',justifyContent:'flex-end',gap:10}}>
                <TouchableOpacity onPress={()=>setShowAddEventModal(false)}><Text style={{color:'red'}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleAddEvent}><Text style={{color:colors.primary}}>Add</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.body}>
          <TextInput placeholder={activeTab==='connections'?'Search chats...':'Search events...'} value={query} onChangeText={setQuery} style={styles.search}/>
          {loading && <ActivityIndicator style={{marginTop:40}} />}
          {error && <Text style={{color:'red',marginTop:20}}>{error}</Text>}

          {!loading && activeTab==='connections' && (
            <FlatList data={filteredChats} keyExtractor={(item,i)=>String(i)} renderItem={({item,index})=><ChatCard item={item} index={index} onPress={handleOpenChat}/>}/>
          )}

          {!loading && activeTab==='events' && (
            <ScrollView>
              <Calendar
                events={events}
                year={currentYear}
                month={currentMonth}
                onPrev={() => {
                  const newMonth = currentMonth - 1;
                  if (newMonth < 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } 
                  else setCurrentMonth(newMonth);
                }}
                onNext={() => {
                  const newMonth = currentMonth + 1;
                  if (newMonth > 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } 
                  else setCurrentMonth(newMonth);
                }}
                onSelectDate={(date) => setSelectedDate(date)}
              />
              {selectedDate && (
                <Text style={{ marginVertical: 8, fontWeight: '600' }}>
                  Events for {selectedDate.toDateString()}
                </Text>
              )}
              <FlatList
                data={displayedEvents}
                keyExtractor={(item, i) => `${item.event_id}-${i}`}
                renderItem={({ item, index }) => (
                  <EventCard item={item} index={index} onRsvp={handleRsvp} onChat={handleEventChat} />
                )}
              />
            </ScrollView>
          )}

          <TouchableOpacity style={styles.addEventBtn} onPress={()=>setShowAddEventModal(true)}>
            <Text style={styles.addEventBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Chat View
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={()=>setSelectedChat(null)}><Text style={{padding:10}}>← Back</Text></TouchableOpacity>
      <FlatList
        data={messages}
        keyExtractor={item=>String(item.message_id)}
        renderItem={({item})=><MessageBubble message={item} isCurrentUser={item.sender_id===CURRENT_USER_ID}/>}/>
      <View style={styles.inputContainer}>
        <TextInput style={styles.messageInput} placeholder="Type a message..." value={messageText} onChangeText={setMessageText}/>
        <TouchableOpacity onPress={handleSendMessage}><Text style={{color:colors.primary,padding:10}}>Send</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff'},
  tabBar:{flexDirection:'row',borderBottomWidth:1,borderColor:'#eee'},
  tab:{flex:1,padding:12,alignItems:'center'},
  tabActive:{borderBottomWidth:2,borderColor:colors.primary},
  tabText:{color:'#555',fontWeight:'500'},
  tabTextActive:{color:colors.primary,fontWeight:'700'},
  body:{flex:1,padding:10},
  search:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:8,marginBottom:10},
  calCard:{padding:10,borderWidth:1,borderColor:'#eee',borderRadius:8,marginBottom:10},
  calNav:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  navBtn:{padding:4}, navBtnText:{fontSize:22},
  monthLabel:{fontWeight:'600'},
  dayHeaderRow:{flexDirection:'row',justifyContent:'space-around'},
  dayHeader:{fontWeight:'600'},
  grid:{flexDirection:'row',flexWrap:'wrap'},
  cell:{width:'14.28%',alignItems:'center',marginVertical:2},
  dayCircle:{width:32,height:32,borderRadius:16,justifyContent:'center',alignItems:'center'},
  todayCircle:{backgroundColor:colors.primary},
  dayText:{color:'#000'},
  todayText:{color:'#fff'},
  dot:{width:6,height:6,borderRadius:3,marginTop:2,backgroundColor:'transparent'},
  dotVisible:{backgroundColor:colors.primary},
  eventCard:{borderWidth:1,borderColor:'#eee',borderRadius:8,padding:10,marginBottom:8},
  eventTop:{flexDirection:'row'},
  dateBadge:{width:50,alignItems:'center',justifyContent:'center',borderRadius:6,marginRight:8},
  dateDay:{fontWeight:'700',fontSize:16},
  dateMonth:{fontSize:12},
  eventInfo:{flex:1},
  eventTitle:{fontWeight:'600'},
  eventMeta:{color:'#666',fontSize:12},
  groupName:{color:'#888',fontSize:12},
  btnRow:{flexDirection:'row',marginTop:8,gap:8},
  btn:{borderWidth:1,borderRadius:6,paddingVertical:4,paddingHorizontal:8},
  btnText:{fontWeight:'600'},
  card:{flexDirection:'row',padding:8,alignItems:'center',borderBottomWidth:1,borderColor:'#eee'},
  avatar:{width:40,height:40,borderRadius:20,justifyContent:'center',alignItems:'center',marginRight:8},
  initials:{fontWeight:'700'},
  info:{flex:1},
  chatName:{fontWeight:'600'},
  lastMsg:{color:'#666',fontSize:12},
  messageBubbleContainer:{padding:4,alignItems:'flex-start'},
  messageBubbleRight:{alignItems:'flex-end'},
  messageBubble:{borderRadius:6,padding:8,maxWidth:'80%'},
  messageBubbleOwnBg:{backgroundColor:colors.primary},
  messageBubbleOtherBg:{backgroundColor:'#eee'},
  messageSenderName:{fontWeight:'600',marginBottom:2},
  messageText:{fontSize:14},
  messageTextOwn:{color:'#fff'},
  messageTextOther:{color:'#000'},
  messageTime:{fontSize:10,color:'#888',alignSelf:'flex-end',marginTop:2},
  messageTimeOwn:{color:'#ddd'},
  inputContainer:{flexDirection:'row',borderTopWidth:1,borderColor:'#eee',alignItems:'center'},
  messageInput:{flex:1,padding:10},
  addEventBtn:{position:'absolute',bottom:20,right:20,width:50,height:50,borderRadius:25,backgroundColor:colors.primary,justifyContent:'center',alignItems:'center'},
  addEventBtnText:{color:'#fff',fontSize:30},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center'},
  modalContainer:{backgroundColor:'#fff',padding:20,borderRadius:10,width:'80%'},
  modalTitle:{fontWeight:'700',fontSize:16,marginBottom:10},
  modalInput:{borderWidth:1,borderColor:'#ccc',borderRadius:6,padding:8,marginBottom:10},
});