import React from 'react';
import {Text, View} from 'react-native';
import {StatsSummary} from '../types';

type Props = {
  stats: StatsSummary;
};

export function MockStats({stats}: Props) {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#eef6ff',
        borderWidth: 1,
        borderColor: '#d6e7ff',
        gap: 8,
      }}>
      <Text style={{fontSize: 14, fontWeight: '700', color: '#12355b'}}>
        This Week
      </Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Stat label="Avg Mood" value={`${stats.averageMood}/10`} />
        <Stat label="Check-ins" value={`${stats.checkIns}`} />
        <Stat label="Journals" value={`${stats.journals}`} />
      </View>
      <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap'}}>
        {stats.topEmotions.map(item => (
          <View
            key={item.name}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#d6e7ff',
            }}>
            <Text style={{fontSize: 12, color: '#1c3f63'}}>
              {item.emoji} {item.name} • {item.percent}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <View style={{gap: 2}}>
      <Text style={{fontSize: 12, color: '#2d4b70'}}>{label}</Text>
      <Text style={{fontSize: 16, fontWeight: '700', color: '#0f2d4e'}}>
        {value}
      </Text>
    </View>
  );
}
