import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { loginUser } from '../../api/api'

export default function LoginScreen({ onLogin, onGoToRegister }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
        <View style={s.header}>
          <Text style={s.logo}>Village</Text>
          <Text style={s.tagline}>Welcome back</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="you@email.com"
            placeholderTextColor="#B0B4C8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="Your password"
            placeholderTextColor="#B0B4C8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Log In</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onGoToRegister} style={s.switchRow}>
          <Text style={s.switchText}>Don't have an account? </Text>
          <Text style={s.switchLink}>Sign up</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  shell:    { flex: 1, backgroundColor: '#F5F7FA' },
  inner:    { flex: 1, justifyContent: 'center', padding: 24 },
  header:   { alignItems: 'center', marginBottom: 32 },
  logo:     { fontSize: 36, fontWeight: '800', color: '#1A1A2E', letterSpacing: -1 },
  tagline:  { fontSize: 15, color: '#8B8FA8', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  label:  { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1A1A2E', borderWidth: 1, borderColor: '#EBEBF5',
  },
  error:   { color: '#EF4444', fontSize: 13, marginTop: 10, textAlign: 'center' },
  btn: {
    backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 20,
    ...Platform.select({
      ios:     { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { color: '#8B8FA8', fontSize: 14 },
  switchLink: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },
})
