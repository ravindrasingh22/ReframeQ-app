import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';

const EMOJIS = ['😀', '🙂', '😐', '😔', '😢', '😡', '😰'];

export function EmojiSelector() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
      {EMOJIS.map(emoji => {
        const active = selected === emoji;
        return (
          <Pressable
            key={emoji}
            onPress={() => setSelected(emoji)}
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              borderWidth: 2,
              borderColor: active ? '#8c7ae6' : '#e2ddf5',
              backgroundColor: active ? '#f0ecff' : '#ffffff',
            }}>
            <Text style={{fontSize: 24}}>{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
