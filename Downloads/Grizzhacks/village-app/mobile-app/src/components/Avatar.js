import { View, Text } from 'react-native'
import { shared } from '../styles/shared'

export default function Avatar({ letter, color, size = 38 }) {
  return (
    <View style={[shared.avatar, { width: size, height: size, backgroundColor: color, borderRadius: size / 2 }]}>
      <Text style={[shared.avatarText, { fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  )
}
