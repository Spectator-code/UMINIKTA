import React from 'react';
import { Stack } from 'expo-router';

export default function ProfessorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="subject/[id]" />
      <Stack.Screen name="create-post" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
