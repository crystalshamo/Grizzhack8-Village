// src/screens/Event/EventsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import {ConnectingScreen} from "./ConnectingScreen";

// --- Constants ---
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const PALETTE = [
  { c: '#185FA5', b: '#E6F1FB' },
  { c: '#0F6E56', b: '#E1F5EE' },
  { c: '#534AB7', b: '#EEEDFE' },
  { c: '#993C1D', b: '#FAECE7' },
  { c: '#854F0B', b: '#FAEEDA' },
];
const getColor = i => PALETTE[i % PALETTE.length];
const BASE_URL = API_URL; // match your server
const CURRENT_USER_ID = 1;

// --- Calendar Component ---
function Calendar({ events, year, month, onPrev, onNext }) {
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
          if (!day) return <View key={i} style={styles.cell} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasEvent = eventDays.includes(day);
          return (
            <View key={i} style={styles.cell}>
              <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
              </View>
              <View style={[styles.dot, hasEvent && !isToday && styles.dotVisible]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// --- Event Card Component ---
function EventCard({ item, index, onRsvp, onChat }) {
  const { c, b } = getColor(index);
  const date = new Date(item.event_date);
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
          <Text style={styles.eventMeta}>{timeStr} · {item.location}</Text>
          {item.group_name && <Text style={styles.groupName}>{item.group_name}</Text>}
        </View>
      </View>

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
    </View>
  );
}

// --- Main Events Screen ---
export default function EventsScreen({ navigation }) {
  const today = new Date();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // --- Fetch events (same structure as Connections screen) ---
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/api/users/${CURRENT_USER_ID}/events`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setEvents(data))
      .catch(() => setError('Could not load events. Is your server running?'))
      .finally(() => setLoading(false));
  }, []);

  // --- RSVP handler ---
  const handleRsvp = (eventId, status) => {
    setEvents(prev =>
      prev.map(e => e.event_id === eventId ? { ...e, user_status: status } : e)
    );

    fetch(`${BASE_URL}/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: CURRENT_USER_ID, status }),
    }).catch(() => {
      setEvents(prev =>
        prev.map(e => e.event_id === eventId ? { ...e, user_status: status === 'going' ? 'not_going' : 'going' } : e)
      );
    });
  };

  const handleChat = (event) => {
    navigation.navigate('ChatRoom', {
      chatId: event.chat_id,
      chatName: event.title,
      userId: CURRENT_USER_ID,
    });
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } 
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } 
    else setMonth(m => m + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grizzhacks</Text>
        <View style={styles.userBadge}><Text style={styles.userBadgeText}>AK</Text></View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Connections')}>
          <Text style={styles.tabText}>Connections</Text>
        </TouchableOpacity>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Events</Text>
        </View>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 40 }} color="#185FA5" />}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.replace('Events')} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Calendar events={events} year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
          <Text style={styles.sectionLabel}>UPCOMING EVENTS</Text>

          {events.length === 0 && <Text style={styles.emptyText}>No upcoming events in your groups.</Text>}

          {events.map((item, i) => (
            <EventCard key={String(item.event_id)} item={item} index={i} onRsvp={handleRsvp} onChat={handleChat} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// --- Styles (same as before) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f3' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  userBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center' },
  userBadgeText: { fontSize: 12, fontWeight: '600', color: '#0C447C' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#185FA5' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#aaa' },
  tabTextActive: { color: '#185FA5' },
  scroll: { padding: 16, paddingBottom: 40 },
  calCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#e8e8e8', padding: 14, marginBottom: 16 },
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 0.5, borderColor: '#e0e0e0' },
  navBtnText: { fontSize: 16, color: '#888' },
  monthLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 6 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 10, color: '#bbb', fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 4 },
  dayCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: '#185FA5' },
  dayText: { fontSize: 12, color: '#1a1a1a' },
  todayText: { color: '#fff', fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1, backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: '#185FA5' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#bbb', letterSpacing: 0.5, marginBottom: 10 },
  eventCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#e8e8e8', padding: 12, marginBottom: 10 },
  eventTop: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateBadge: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dateDay: { fontSize: 16, fontWeight: '600', lineHeight: 18 },
  dateMonth: { fontSize: 9, fontWeight: '600' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  eventMeta: { fontSize: 12, color: '#888', marginBottom: 2 },
  groupName: { fontSize: 11, color: '#bbb' },
  btnRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 0.5, alignItems: 'center' },
  btnText: { fontSize: 12, fontWeight: '500' },
  errorBox: { alignItems: 'center', marginTop: 40 },
  errorText: { fontSize: 13, color: '#E24B4A', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 0.5, borderColor: '#185FA5' },
  retryText: { fontSize: 13, color: '#185FA5', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#bbb', marginTop: 20, fontSize: 13 },
});