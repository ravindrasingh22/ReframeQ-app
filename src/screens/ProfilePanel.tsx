import React from 'react';
import {Pressable, Text, View} from 'react-native';

export function ProfilePanel({
  fullName,
  authRole,
  mode,
  onSignOut,
}: {
  fullName: string;
  authRole: string;
  mode: string;
  onSignOut: () => void;
}) {
  return (
    <View style={{gap: 10}}>
      <View style={cardStyle}>
        <Text style={titleStyle}>Account</Text>
        <Text style={subtitleStyle}>Name: {fullName}</Text>
        <Text style={subtitleStyle}>Role: {authRole}</Text>
        <Text style={subtitleStyle}>Mode: {mode}</Text>
      </View>
      <View style={cardStyle}>
        <Text style={titleStyle}>Profile</Text>
        <Text style={subtitleStyle}>Manage profile details, language and family from the left menu.</Text>
      </View>
      <Pressable onPress={onSignOut} style={primaryBtn}>
        <Text style={{color: '#fff', textAlign: 'center', fontWeight: '700'}}>Sign out</Text>
      </Pressable>
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
const primaryBtn = {
  backgroundColor: '#2f5fd0',
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 12,
} as const;
