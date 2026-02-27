import React from 'react';
import {Text, View} from 'react-native';

export function LinkedinStyleFeed({moodLogCount, fullName}: {moodLogCount: number; fullName: string}) {
  const posts = [
    {
      id: 'p1',
      author: 'ReframeQ Coach',
      time: '2h',
      text: 'Small daily check-ins build emotional awareness over time. Keep your streak going.',
    },
    {
      id: 'p2',
      author: fullName,
      time: 'Today',
      text: `You logged ${moodLogCount} mood updates this session. Great consistency.`,
    },
    {
      id: 'p3',
      author: 'Wellbeing Insight',
      time: '1d',
      text: 'A 5-minute breathing reset can significantly lower stress intensity in the moment.',
    },
  ];

  return (
    <View style={{gap: 10}}>
      <View style={cardStyle}>
        <Text style={titleStyle}>Start a reflection...</Text>
        <Text style={subtitleStyle}>What did you notice about your mood today?</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={linkStyle}>Check-in</Text>
          <Text style={linkStyle}>Journal</Text>
          <Text style={linkStyle}>Reframe</Text>
        </View>
      </View>
      {posts.map(post => (
        <View key={post.id} style={cardStyle}>
          <Text style={titleStyle}>{post.author}</Text>
          <Text style={hintStyle}>{post.time}</Text>
          <Text style={subtitleStyle}>{post.text}</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={hintStyle}>Like</Text>
            <Text style={hintStyle}>Comment</Text>
            <Text style={hintStyle}>Share</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const cardStyle = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#e0e7f1',
  borderRadius: 12,
  padding: 12,
  gap: 8,
} as const;
const titleStyle = {fontSize: 15, fontWeight: '700', color: '#1d2840'} as const;
const subtitleStyle = {fontSize: 13, color: '#5a6475'} as const;
const hintStyle = {fontSize: 12, color: '#5a6475'} as const;
const linkStyle = {fontSize: 13, color: '#2f5fd0', fontWeight: '600'} as const;
