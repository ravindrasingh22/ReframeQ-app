import React from 'react';
import {Pressable, Text, View} from 'react-native';

type MainTab = 'checkin' | 'reframe' | 'chat' | 'dashboard' | 'settings';

export function BottomTabBar({
  current,
  onChange,
  parentMode,
}: {
  current: MainTab;
  onChange: (tab: MainTab) => void;
  parentMode: boolean;
}) {
  const tabs: MainTab[] = parentMode ? ['dashboard', 'chat'] : ['dashboard', 'checkin', 'reframe', 'chat'];

  return (
    <View
      style={{
        backgroundColor: '#eef3fb',
        borderTopWidth: 1,
        borderTopColor: '#d8e2f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={{
              borderWidth: 1,
              borderColor: current === tab ? '#2f5fd0' : '#d3dbeb',
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: current === tab ? '#e8efff' : '#fff',
            }}>
            <Text style={{fontSize: 12, color: current === tab ? '#2f5fd0' : '#32425f', textTransform: 'capitalize'}}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
