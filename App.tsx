import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Vibration, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { NotesProvider, useNotes } from './context/NotesContext';
import LanguageScreen from './screens/LanguageScreen';
import HomeScreen from './screens/HomeScreen';
import NotesScreen from './screens/NotesScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createNativeStackNavigator();

function AlarmChecker() {
  const { notesByDate } = useNotes();
  const [alarmNote, setAlarmNote] = useState<any>(null);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const todayKey = now.toDateString();
      const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

      for (const [dateKey, notes] of Object.entries(notesByDate)) {
        for (const note of notes as any[]) {
          if (!note.alarmTime || note.done) continue;
          if (dateKey !== todayKey) continue;
          const fireId = `${note.id}_${currentTime}`;
          if (note.alarmTime === currentTime && !firedRef.current.has(fireId)) {
            firedRef.current.add(fireId);
            setAlarmNote(note);
            Vibration.vibrate([500, 500, 500, 500, 500]);
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [notesByDate]);

  if (!alarmNote) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alarmBox}>
          <Text style={styles.alarmIcon}>🔔</Text>
          <Text style={styles.alarmTitle}>ALARM</Text>
          <Text style={styles.alarmNote}>{alarmNote.title}</Text>
          <Text style={styles.alarmTime}>{alarmNote.alarmTime}</Text>
          {alarmNote.content ? <Text style={styles.alarmContent}>{alarmNote.content}</Text> : null}
          <TouchableOpacity style={styles.dismissBtn} onPress={() => { setAlarmNote(null); Vibration.cancel(); }}>
            <Text style={styles.dismissText}>Tamam ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.requestPermissionsAsync();
    }
  }, []);

  return (
    <NotesProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Notes" component={NotesScreen} />
        </Stack.Navigator>
        {/* Web'de yerleşik alarm modal, native'de sistem bildirimi kullanılıyor */}
        {Platform.OS === 'web' && <AlarmChecker />}
      </NavigationContainer>
    </NotesProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  alarmBox: {
    backgroundColor: '#fff', borderRadius: 24, padding: 32,
    alignItems: 'center', width: '80%',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  alarmIcon: { fontSize: 48, marginBottom: 8 },
  alarmTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A73E8', marginBottom: 12 },
  alarmNote: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 6, textAlign: 'center' },
  alarmTime: { fontSize: 32, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 8 },
  alarmContent: { fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' },
  dismissBtn: {
    backgroundColor: '#1A73E8', borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 14, marginTop: 8,
  },
  dismissText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
