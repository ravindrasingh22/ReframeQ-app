import React from 'react';
import {Text, View} from 'react-native';
import {ReframeItem} from '../types';

type Props = {
  item: ReframeItem;
};

export function DailyReframeCard({item}: Props) {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fef3e6',
        borderWidth: 1,
        borderColor: '#f4d7b5',
        gap: 8,
      }}>
      <Text style={{fontSize: 14, fontWeight: '700', color: '#6b3c16'}}>
        {item.title}
      </Text>
      <Text style={{fontSize: 14, color: '#6b3c16'}}>{item.body}</Text>
      <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap'}}>
        {item.tags.map(tag => (
          <View
            key={tag}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: '#fff5eb',
              borderWidth: 1,
              borderColor: '#f4d7b5',
            }}>
            <Text style={{fontSize: 12, color: '#8a572e'}}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
