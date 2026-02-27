import React from 'react';
import {Text, View} from 'react-native';
import {ChatMessage} from '../types';

type Props = {
  thread: ChatMessage[];
};

export function MockChat({thread}: Props) {
  return (
    <View style={{gap: 8}}>
      {thread.map(msg => (
        <View
          key={msg.id}
          style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? '#d9f4ff' : '#f1edff',
            padding: 12,
            borderRadius: 12,
            maxWidth: '80%',
          }}>
          <Text style={{fontSize: 13, color: '#1e1c30'}}>{msg.text}</Text>
          <Text style={{fontSize: 11, color: '#6a6780', marginTop: 4}}>
            {msg.role === 'user' ? 'You' : 'ReframeQ AI (mock)'}
          </Text>
        </View>
      ))}
    </View>
  );
}
