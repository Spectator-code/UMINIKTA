import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ label, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: focused ? '#059669' : '#E5E7EB',
        justifyContent: 'center', alignItems: 'center', marginBottom: 2,
      }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: focused ? '#FFFFFF' : '#9CA3AF' }}>
          {label.charAt(0)}
        </Text>
      </View>
    </View>
  );
}

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Classes',
          tabBarIcon: ({ focused }) => <TabIcon label="Classes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="subject/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}
