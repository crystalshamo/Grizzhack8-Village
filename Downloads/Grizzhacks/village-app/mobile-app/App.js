import React, { useState } from 'react'
import { useFonts, BricolageGrotesque_400Regular, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque'

import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Platform,
} from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import ForumsScreen from './src/screens/Forums/ForumsScreen'
import PostDetailScreen from './src/screens/Forums/PostDetailScreen'
import ConnectingScreen from './src/screens/Connecting/ConnectingScreen'
import DonationsScreen from './src/screens/Donations/DonationsScreen'
import ProfileScreen from './src/screens/Profile/ProfileScreen'
import SupportScreen from './src/screens/Support/SupportScreen'
import LoginScreen from './src/screens/Auth/LoginScreen'
import RegisterScreen from './src/screens/Auth/RegisterScreen'
import OnboardingScreen from './src/screens/Auth/OnboardingScreen'
import { NAV_ITEMS } from './src/data/index'
import { getNotifications } from './src/api/api'

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser]                   = useState(null)
  const [onboarded, setOnboarded]         = useState(false)
  const [authScreen, setAuthScreen]       = useState('login')
  const [activeTab, setActiveTab]         = useState('forums')
  const [menuOpen, setMenuOpen]           = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifsOpen, setNotifsOpen]       = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // poll notifications every 30s when logged in
  useEffect(() => {
    if (!user?.user_id) return
    function fetchNotifs() {
      getNotifications(user.user_id)
        .then(data => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [user])
  const [user, setUser] = useState(null)
  const [onboarded, setOnboarded] = useState(false)
  const [authScreen, setAuthScreen] = useState('login')
  const [activeTab, setActiveTab] = useState('forums')
  const [menuOpen, setMenuOpen] = useState(false)
const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_700Bold,
  })

  if (!fontsLoaded) return null
  function navigate(tab) {
    setActiveTab(tab)
    setMenuOpen(false)
  }

  if (!user) {
    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onRegister={(newUser) => {
            setUser(newUser)
            setOnboarded(false)
          }}
          onGoToLogin={() => setAuthScreen('login')}
        />
      )
    }
    return (
      <LoginScreen
        onLogin={(loggedInUser) => {
          setUser(loggedInUser)
          setOnboarded(true)
        }}
        onGoToRegister={() => setAuthScreen('register')}
      />
    )
  }

  if (!onboarded) {
    return (
      <OnboardingScreen
        user={user}
        onComplete={() => setOnboarded(true)}
      />
    )
  }

  const currentLabel = NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? ''

  return (
    <SafeAreaView style={s.shell}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={s.drawerModal}>
          <Pressable
            style={s.drawerBackdrop}
            onPress={() => setMenuOpen(false)}
          />
          <View style={s.drawer}>
            <View style={s.drawerTop}>
              <Text style={s.drawerLogo}>Village</Text>
              <TouchableOpacity
                onPress={() => setMenuOpen(false)}
                style={s.drawerCloseBtn}
              >
                <Text style={s.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.drawerNav}>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    s.drawerItem,
                    activeTab === item.id && s.drawerItemActive,
                  ]}
                  onPress={() => navigate(item.id)}
                  activeOpacity={0.75}
                >
                  <Text style={s.drawerIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      s.drawerItemLabel,
                      activeTab === item.id && s.drawerItemLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[s.drawerItem, { marginTop: 'auto' }]}
                onPress={() => {
                  setUser(null)
                  setOnboarded(false)
                  setAuthScreen('login')
                  setActiveTab('forums')
                  setMenuOpen(false)
                }}
                activeOpacity={0.75}
              >
                <Text style={s.drawerIcon}>🚪</Text>
                <Text style={[s.drawerItemLabel, { color: '#EF4444' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications panel */}
      <Modal visible={notifsOpen} transparent animationType="slide" onRequestClose={() => setNotifsOpen(false)}>
        <View style={s.notifOverlay}>
          <Pressable style={s.notifBackdrop} onPress={() => setNotifsOpen(false)} />
          <View style={s.notifPanel}>
            <View style={s.notifHeader}>
              <Text style={s.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifsOpen(false)}>
                <Text style={s.notifClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <Text style={s.notifEmpty}>No notifications yet.</Text>
            ) : (
              notifications.map(n => (
                <View key={n.notification_id} style={[s.notifItem, !n.is_read && s.notifItemUnread]}>
                  <Text style={s.notifMessage}>{n.message}</Text>
                  <Text style={s.notifTime}>{new Date(n.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Modal>

      <View style={s.topBar}>
        <TouchableOpacity
          style={s.hamburger}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.7}
        >
          <View style={s.hamLine} />
          <View style={s.hamLine} />
          <View style={s.hamLine} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>{currentLabel}</Text>

        <TouchableOpacity style={s.bellBtn} onPress={() => setNotifsOpen(true)} activeOpacity={0.7}>
          <Text style={s.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={s.bellBadge}>
              <Text style={s.bellBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>
      <View style={{ flex: 1 }}>
        {activeTab === 'forums'     && <ForumsScreen user={user} />}
        {activeTab === 'forums' && (
          <NavigationContainer independent={true}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Forums">
                {props => <ForumsScreen {...props} user={user} />}
              </Stack.Screen>
              <Stack.Screen name="PostDetail">
                {props => <PostDetailScreen {...props} user={user} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        )}
        {activeTab === 'connecting' && <ConnectingScreen user={user} />}
        {activeTab === 'donations'  && <DonationsScreen user={user} />}
        {activeTab === 'profile'    && <ProfileScreen user={user} />}
        {activeTab === 'support'    && <SupportScreen user={user} />}
      </View>
      {activeTab !== 'profile' && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => navigate('profile')}
          activeOpacity={0.85}
        >
          <Text style={s.fabIcon}>👤</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bellBtn:      { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bellIcon:     { fontSize: 20 },
  bellBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#EF4444', width: 16, height: 16,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  notifOverlay:  { flex: 1, justifyContent: 'flex-end' },
  notifBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,18,30,0.4)' },
  notifPanel: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
  },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  notifTitle:  { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  notifClose:  { fontSize: 16, color: '#8B8FA8', padding: 4 },
  notifEmpty:  { color: '#8B8FA8', textAlign: 'center', paddingVertical: 24 },
  notifItem: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F6',
  },
  notifItemUnread: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10 },
  notifMessage:    { fontSize: 14, color: '#1A1A2E', lineHeight: 20 },
  notifTime:       { fontSize: 11, color: '#8B8FA8', marginTop: 4 },

  hamLine: {
    width: 20,
    height: 2,
    backgroundColor: '#1A1A2E',
    borderRadius: 2,
    marginVertical: 2,
  },
  drawerModal: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,18,30,0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  drawerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F6',
  },
  drawerLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  drawerCloseBtn: {
    padding: 6,
    borderRadius: 8,
  },
  drawerCloseText: {
    fontSize: 16,
    color: '#8B8FA8',
  },
  drawerNav: {
    padding: 12,
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: '#EEF2FF',
  },
  drawerIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8B8FA8',
  },
  drawerItemLabelActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1A2E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  fabIcon: {
    fontSize: 22,
  },
})