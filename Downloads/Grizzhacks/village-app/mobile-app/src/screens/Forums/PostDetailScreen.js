import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Avatar from '../../components/Avatar';
import { shared } from '../../styles/shared';
import { FORUM_POSTS } from '../../data/index';

export default function PostDetailScreen({ post, onBack }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={shared.card}>
        <View style={styles.forumTop}>
          <Avatar letter={post.avatar} color={post.avatarColor} />
          <View style={styles.forumMeta}>
            <Text style={styles.forumAuthor}>{post.author}</Text>
            <Text style={styles.forumTime}>{post.time}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: post.tagBg }]}> 
            <Text style={[styles.tagText, { color: post.tagTextColor }]}>{post.tag}</Text>
          </View>
        </View>
        <Text style={styles.forumTitle}>{post.title}</Text>
        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} />
        )}
        <Text style={styles.forumBody}>{post.body}</Text>
        <View style={styles.forumActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>♡  {post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>💬  {post.replies}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]}> 
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.commentsTitle}>Comments</Text>
      <ScrollView contentContainerStyle={styles.commentsList}>
        {post.comments?.map((comment, idx) => (
          <View key={idx} style={styles.commentCard}>
            <View style={styles.commentTop}>
              <Avatar letter={comment.avatar} color={comment.avatarColor} size={32} />
              <View style={styles.commentMeta}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentTime}>{comment.time}</Text>
              </View>
            </View>
            <Text style={styles.commentBody}>{comment.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 16 },
  backBtn: { marginBottom: 10, alignSelf: 'flex-start', padding: 8, borderRadius: 12, backgroundColor: '#EEF2FF' },
  backText: { color: '#4F46E5', fontWeight: '600', fontSize: 15 },
  forumTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  forumMeta: { flex: 1 },
  forumAuthor: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  forumTime: { fontSize: 12, color: '#B0B4C8', marginTop: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },
  forumTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 7, lineHeight: 24 },
  forumBody: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 14 },
  postImage: { width: '100%', height: 180, borderRadius: 18, marginBottom: 14, backgroundColor: '#E5E7EB' },
  forumActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F7FA' },
  actionBtnText: { fontSize: 13, color: '#8B8FA8', fontWeight: '500' },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 18, marginBottom: 8 },
  commentsList: { gap: 12, paddingBottom: 40 },
  commentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, marginBottom: 4 },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  commentMeta: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  commentTime: { fontSize: 11, color: '#B0B4C8', marginTop: 1 },
  commentBody: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
});
