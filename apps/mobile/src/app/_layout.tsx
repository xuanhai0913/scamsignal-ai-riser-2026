import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#F2F6F8'},
          animation: 'fade',
        }}
      />
    </>
  );
}
