import React, { useState, useEffect } from 'react'
import { useFonts, BricolageGrotesque_400Regular, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque'
import {
  View, Text, TouchableOpacity, Modal, StatusBar,
  StyleSheet, SafeAreaView, Pressable, Platform, LogBox,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
import { colors, fonts } from './src/styles/themes'
import { getNotifications, createChat, markAllNotificationsRead } from './src/api/api'

LogBox.ignoreAllLogs(true)

const Stack = createStackNavigator()

export default function App() {
  const [user, setUser] = useState(null)
  const [onboarded, setOnboarded] = useState(false)
  const [authScreen, setAuthScreen] = useState('login')
  const [activeTab, setActiveTab] = useState('forums')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [markedAllReadAt, setMarkedAllReadAt] = useState(null)
  const [openChatId, setOpenChatId] = useState(null)

  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_700Bold,
  })

  const unreadCount = notifications.filter(n =>
    !n.is_read && (!markedAllReadAt || new Date(n.created_at) > markedAllReadAt)
  ).length

  useEffect(() => {
    if (!user?.user_id) return

    function fetchNotifs() {
      getNotifications(user.user_id)
        .then(data => setNotifications(Array.isArray(data) ? data : []))
        .catch(() => {})
    }

    fetchNotifs()
    const interval = setInterval(fetchNotifs, 5000)
    return () => clearInterval(interval)
  }, [user])

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
    return <OnboardingScreen user={user} onComplete={() => setOnboarded(true)} />
  }

  return (
    <SafeAreaView style={s.shell}>
      <StatusBar barStyle="light-content" backgroundColor={colors.purple} />

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <View style={s.drawerModal}>
          <Pressable style={s.drawerBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={s.drawer}>
            <View style={s.drawerTop}>
              <Text style={s.drawerLogo}>village</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={s.drawerCloseBtn}>
                <Text style={s.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.drawerNav}>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[s.drawerItem, activeTab === item.id && s.drawerItemActive]}
                  onPress={() => navigate(item.id)}
                  activeOpacity={0.75}
                >
                  <Text style={s.drawerIcon}>{item.icon}</Text>
                  <Text style={[s.drawerItemLabel, activeTab === item.id && s.drawerItemLabelActive]}>
                    {item.label}
                  </Text>
                  {activeTab === item.id && <View style={s.drawerActiveDot} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={s.logoutBtn}
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
              <Text style={s.logoutText}>log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={notifsOpen} transparent animationType="slide" onRequestClose={() => setNotifsOpen(false)}>
        <View style={s.notifOverlay}>
          <Pressable style={s.notifBackdrop} onPress={() => setNotifsOpen(false)} />
          <View style={s.notifPanel}>
            <View style={s.notifHeader}>
              <Text style={s.notifTitle}>notifications</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      await markAllNotificationsRead(user.user_id).catch(() => {})
                      setMarkedAllReadAt(new Date())
                      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.markAllRead}>mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotifsOpen(false)}>
                  <Text style={s.notifClose}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <Text style={s.notifEmpty}>no notifications yet.</Text>
            ) : (
              notifications.map(n => {
                const isContribution = n.type?.startsWith('contribution:')
                const contributorId = isContribution ? parseInt(n.type.split(':')[1], 10) : null

                return (
                  <View key={n.notification_id} style={[s.notifItem, !n.is_read && s.notifItemUnread]}>
                    <Text style={s.notifMessage}>{n.message}</Text>
                    <Text style={s.notifTime}>{new Date(n.created_at).toLocaleDateString()}</Text>

                    {isContribution && contributorId && (
                      <TouchableOpacity
                        style={s.notifChatBtn}
                        activeOpacity={0.85}
                        onPress={async () => {
                          try {
                            const res = await createChat([user.user_id, contributorId])
                            if (res?.chat_id) {
                              setOpenChatId(res.chat_id)
                            }
                          } catch {}

                          setNotifsOpen(false)
                          setActiveTab('connecting')
                        }}
                      >
                        <Text style={s.notifChatBtnText}>💬 Start Chat</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )
              })
            )}
          </View>
        </View>
      </Modal>

      <View style={s.topBar}>
        <TouchableOpacity style={s.hamburger} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <View style={s.hamLine} />
          <View style={s.hamLine} />
          <View style={s.hamLine} />
        </TouchableOpacity>

        <Text style={s.topBarTitle}>
          {NAV_ITEMS.find(item => item.id === activeTab)?.label?.toLowerCase() ?? ''}
        </Text>

        <TouchableOpacity style={s.bellBtn} onPress={() => setNotifsOpen(true)} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={colors.lightpurple} />
          {unreadCount > 0 && (
            <View style={s.bellBadge}>
              <Text style={s.bellBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
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

        {activeTab === 'connecting' && (
          <ConnectingScreen
            user={user}
            initialChatId={openChatId}
            onChatOpened={() => setOpenChatId(null)}
          />
        )}
        {activeTab === 'donations' && <DonationsScreen user={user} />}
        {activeTab === 'profile' && <ProfileScreen user={user} />}
        {activeTab === 'support' && <SupportScreen user={user} />}
      </View>

      {/* Remove FAB profile button */}
      {/*
      {activeTab !== 'profile' && (
        <TouchableOpacity style={s.fab} onPress={() => navigate('profile')} activeOpacity={0.85}>
          <Text style={s.fabIcon}>👤</Text>
        </TouchableOpacity>
      )}
      */}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.loginbackground,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.purple,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184,180,242,0.15)',
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.background,
    letterSpacing: 0.3,
  },
  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(184,180,242,0.15)',
    gap: 5,
  },
  hamLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.lightpurple,
    borderRadius: 2,
  },

  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(184,180,242,0.15)',
  },
  bellIcon: { fontSize: 18 },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: { color: colors.background, fontSize: 8, fontFamily: fonts.bold },

  notifOverlay: { flex: 1, justifyContent: 'flex-end' },
  notifBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9,1,36,0.6)' },
  notifPanel: {
    backgroundColor: colors.purple,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notifTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.background },
  notifClose: { fontSize: 16, color: colors.lightpurple, padding: 4 },
  markAllRead: { fontSize: 12, color: colors.lightpurple, fontFamily: fonts.bold },
  notifEmpty: {
    color: colors.lightpurple,
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: fonts.regular,
    opacity: 0.6,
  },
  notifItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184,180,242,0.15)',
  },
  notifItemUnread: {
    backgroundColor: 'rgba(184,180,242,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  notifMessage: { fontSize: 14, color: colors.background, lineHeight: 20, fontFamily: fonts.regular },
  notifTime: { fontSize: 11, color: colors.lightpurple, marginTop: 4, fontFamily: fonts.regular, opacity: 0.6 },
  notifChatBtn: {
    marginTop: 8,
    backgroundColor: colors.beige,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  notifChatBtnText: { fontSize: 13, fontFamily: fonts.bold, color: colors.purple },

  drawerModal: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(9,1,36,0.6)' },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.purple,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  drawerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184,180,242,0.15)',
  },
  drawerLogo: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.background,
    letterSpacing: -0.5,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(184,180,242,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerCloseText: { fontSize: 14, color: colors.lightpurple, fontFamily: fonts.bold },
  drawerNav: { padding: 16, flex: 1 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  drawerItemActive: { backgroundColor: 'rgba(184,180,242,0.15)' },
  drawerActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lightpurple,
    marginLeft: 'auto',
  },
  drawerIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  drawerItemLabel: { fontSize: 15, fontFamily: fonts.regular, color: 'rgba(184,180,242,0.5)' },
  drawerItemLabelActive: { color: colors.background, fontFamily: fonts.bold },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { fontSize: 15, fontFamily: fonts.bold, color: '#EF4444' },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 22,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  fabIcon: { fontSize: 20 },
})

