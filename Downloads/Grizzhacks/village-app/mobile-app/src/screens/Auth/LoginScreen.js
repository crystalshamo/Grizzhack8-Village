import { useState, useRef } from 'react'
import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Animated, KeyboardAvoidingView, Platform,
} from 'react-native'
import { loginUser } from '../../api/api'
import { ImageBackground } from 'react-native'
import { colors, fonts } from '../../styles/themes'
export default function LoginScreen({ onLogin, onGoToRegister }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
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
   const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }
  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await loginUser(email, password)
      if (res.user) {
        onLogin(res.user)
      } else {
        setError(res.error ?? 'Invalid email or password')
        shake()
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }
 return (
    <SafeAreaView style={s.shell}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.inner}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={s.header}>
            <Image
  source={require('../../../../assets/mascot.png')}
  style={s.mascot}
  resizeMode="contain"
/>
            <Text style={s.logo}>village</Text>
            <Text style={s.tagline}>good to have you back :)</Text>
          </View> 
          <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={s.label}>email</Text>
            <TextInput
              style={[s.input, focusedField === 'email' && s.inputFocused]}
              placeholder="you@email.com"
              placeholderTextColor={colors.lightpurple}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={s.label}>password</Text>
            <TextInput
              style={[s.input, focusedField === 'password' && s.inputFocused]}
              placeholder="your password"
              placeholderTextColor={colors.lightpurple}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
            />

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={s.btnText}>log in</Text>
              }
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={onGoToRegister} style={s.switchRow}>
            <Text style={s.switchText}>don't have an account? </Text>
            <Text style={s.switchLink}>join the village</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.loginbackground },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: {
    fontSize: 42, color: colors.dark,
    fontFamily: fonts.bold, letterSpacing: -1,
  },
  tagline: {
    fontSize: 15, color: colors.dark,
    fontFamily: fonts.regular, marginTop: 6, opacity: 0.6,
  },
  card: {
    backgroundColor: colors.lightpurple,
    borderRadius: 20, padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#090124', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  label: {
    fontSize: 12, color: colors.beige,
    fontFamily: fonts.bold, marginBottom: 6,
    marginTop: 14, letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 12, padding: 14,
    fontSize: 15, color: colors.background, borderWidth: 1.5,
    borderColor: 'rgba(184,180,242,0.3)', fontFamily: fonts.regular,
  },
  inputFocused: {
    borderColor: colors.lightpurple,
    backgroundColor: 'rgba(184,180,242,0.12)',
  },
  error: {
    color: '#FFB4A2', fontSize: 13,
    marginTop: 12, textAlign: 'center',
    fontFamily: fonts.regular,
  },
  btn: {
    backgroundColor: colors.beige, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 22,
  },
  mascot: {
  width: 100,
  height: 100,
  marginBottom: -23,
},
  btnText: {
    color: colors.white, fontSize: 16,
    fontFamily: fonts.bold, letterSpacing: 0.3,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { color: colors.dark, fontSize: 14, fontFamily: fonts.regular, opacity: 0.6 },
  switchLink: { color: colors.dark, fontSize: 14, fontFamily: fonts.bold },
})