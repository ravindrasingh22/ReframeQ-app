import React from 'react';
import {Pressable, Text, View} from 'react-native';

export function SidebarMenu({
  onClose,
  onProfile,
  onFamily,
  onLanguage,
  onMain,
}: {
  onClose: () => void;
  onProfile: () => void;
  onFamily: () => void;
  onLanguage: () => void;
  onMain: () => void;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: 'rgba(15,23,42,0.35)',
      }}>
      <Pressable style={{flex: 1}} onPress={onClose} />
      <View
        style={{
          width: 260,
          backgroundColor: '#ffffff',
          borderRightWidth: 1,
          borderRightColor: '#d8e2f0',
          padding: 14,
          gap: 10,
        }}>
        <Text style={{fontSize: 15, fontWeight: '700', color: '#1d2840'}}>Menu</Text>
        <SidebarItem label="Account / Profile" onPress={onProfile} />
        <SidebarItem label="Family Profiles" onPress={onFamily} />
        <SidebarItem label="Language" onPress={onLanguage} />
        <SidebarItem label="Back to Main" onPress={onMain} />
      </View>
    </View>
  );
}

function SidebarItem({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: '#d3dbeb',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 9,
        backgroundColor: '#f8fbff',
      }}>
      <Text style={{fontSize: 12, color: '#32425f', textTransform: 'capitalize'}}>{label}</Text>
    </Pressable>
  );
}
