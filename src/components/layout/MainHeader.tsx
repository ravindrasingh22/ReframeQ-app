import React from 'react';
import {Pressable, Text, View} from 'react-native';

export function MainHeader({
  title,
  subtitle,
  onOpenMenu,
}: {
  title: string;
  subtitle: string;
  onOpenMenu: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e7f1',
        borderRadius: 12,
        padding: 12,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <View style={{flex: 1}}>
        <Text style={{fontSize: 22, fontWeight: '800', color: '#14213d'}}> {title}</Text>
        <Text style={{fontSize: 13, color: '#5a6475'}}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={onOpenMenu}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#cfd9e8',
          backgroundColor: '#f8fbff',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 10,
        }}>
        <Text style={{fontSize: 16, color: '#1f2a44'}}>👤</Text>
      </Pressable>
    </View>
  );
}
