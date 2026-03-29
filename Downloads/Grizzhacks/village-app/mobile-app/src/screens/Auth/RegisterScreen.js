import { useState, useRef } from 'react'
import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native'
import { registerUser } from '../../api/api'

import { colors, fonts } from '../../styles/themes'

export default function RegisterScreen({ onRegister, onGoToLogin }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [focusedField, setFocusedField] = useState(null)
  
  const shakeAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
 useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])
  async function handleRegister() {
    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await registerUser(name, email, password, '', false)
      if (res.user_id) {
        onRegister({ user_id: res.user_id, name, email })
      } else {
        setError(res.error ?? 'Registration failed')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }
   const field = (label, value, setter, opts = {}) => (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, focusedField === label && s.inputFocused]}
        placeholderTextColor={colors.lightpurple}
        value={value}
        onChangeText={setter}
        onFocus={() => setFocusedField(label)}
        onBlur={() => setFocusedField(null)}
        {...opts}
      />
    </View>
  )

  return (
    <SafeAreaView style={s.shell}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={s.header}>
  <Image
    source={require('../../../../assets/mascot.png')}
    style={s.mascot}
    resizeMode="contain"
  />
  <Text style={s.logo}>village</Text>
  <Text style={s.tagline}>you belong here :)</Text>
</View>

            <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>
              {field('full name', name, setName, { placeholder: 'your name' })}
              {field('email', email, setEmail, { placeholder: 'you@email.com', autoCapitalize: 'none', keyboardType: 'email-address' })}
              {field('password', password, setPassword, { placeholder: 'min. 6 characters', secureTextEntry: true })}
              {field('confirm password', confirm, setConfirm, { placeholder: 'repeat password', secureTextEntry: true })}

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity style={s.btn} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
                {loading
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={s.btnText}>create account</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={onGoToLogin} style={s.switchRow}>
              <Text style={s.switchText}>already have an account? </Text>
              <Text style={s.switchLink}>log in</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.loginbackground },
  inner: { padding: 28, paddingBottom: 48, paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 36, marginTop: 16 },
  logo: {
    fontSize: 42, color: colors.dark,
    fontFamily: fonts.bold, letterSpacing: -1,
  },
  tagline: {
    fontSize: 15, color: colors.dark,
    fontFamily: fonts.regular, marginTop: 6, opacity: 0.6,
  },
  mascot: {
    width: 100,
    height: 100,
    marginBottom: -23,
  },
  card: {
    backgroundColor: colors.lightpurple, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: colors.lightpurple, gap: 4,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  label: {
    fontSize: 12, color: colors.beige,
    fontFamily: fonts.bold, marginBottom: 6,
    marginTop: 14, textTransform: 'lowercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.purple, borderWidth: 1.5,
    borderColor: colors.lightpurple, fontFamily: fonts.regular,
  },
  inputFocused: { borderColor: colors.beige, backgroundColor: colors.background },
  error: {
    color: '#FFB4A2', fontSize: 13,
    marginTop: 12, textAlign: 'center',
    fontFamily: fonts.regular,
  },
  btn: {
    backgroundColor: colors.beige, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 22,
  },
  btnText: { color: colors.dark, fontSize: 16, fontFamily: fonts.bold, letterSpacing: 0.3 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { color: colors.dark, fontSize: 14, fontFamily: fonts.regular, opacity: 0.6 },
  switchLink: { color: colors.dark, fontSize: 14, fontFamily: fonts.bold },
})