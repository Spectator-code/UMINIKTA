import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import UIcon from '../../src/components/UIcon';

function TabIcon({ label, focused }) {
  const iconName = label === 'Classes' ? 'book' : label === 'Explore' ? 'search' : 'user';
  const iconColor = focused ? '#059669' : '#6B7280';
  return (
    <View style={styles.tabIconWrapper}>
      <View
        style={[
          styles.tabIconBox,
          focused ? styles.tabIconBoxActive : styles.tabIconBoxInactive,
        ]}
      >
        <UIcon name={iconName} size={18} color={iconColor} strokeWidth={focused ? 2.2 : 1.8} />
      </View>
    </View>
  );
}

export default function StudentLayout() {
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 768;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: isDesktop
          ? { display: 'none', height: 0 }
          : {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
            },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Classes',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Classes" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Explore" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="subject/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabIconBoxActive: {
    backgroundColor: '#ECFDF5',
  },
  tabIconBoxInactive: {
    backgroundColor: '#F3F4F6',
  },
});
