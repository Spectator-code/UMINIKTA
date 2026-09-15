import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AuthSlidingContainer from '../../src/components/AuthSlidingContainer';

export default function Register() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthSlidingContainer initialSignUp={true} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
