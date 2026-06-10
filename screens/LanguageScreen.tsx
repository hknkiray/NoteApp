import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import translations from '../locales';
import { useNotes } from '../context/NotesContext';

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function LanguageScreen({ navigation }: any) {
  const [selected, setSelected] = useState('en');
  const t = translations[selected];
  const { setLanguage } = useNotes();

  const handleContinue = () => {
  setLanguage(selected);
  navigation.navigate('Home');
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appIcon}>📓</Text>
        <Text style={styles.appName}>{t.appName}</Text>
        <Text style={styles.appSub}>{t.appSub}</Text>
      </View>

      <Text style={styles.sectionTitle}>🌍 {t.selectLanguage}</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.card, selected === lang.code && styles.cardSelected]}
            onPress={() => setSelected(lang.code)}
          >
            <Text style={styles.flagText}>{lang.flag}</Text>
            <Text style={[styles.langName, selected === lang.code && styles.langNameSelected]}>
              {lang.name}
            </Text>
            {selected === lang.code && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>{t.continue}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF4FF', paddingTop: 50 },
  header: {
    alignItems: 'center', backgroundColor: '#1A73E8', paddingVertical: 30,
    paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  appIcon: { fontSize: 52, marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  appSub: { fontSize: 14, color: '#cce4ff', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A73E8', textAlign: 'center', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    width: 140, height: 100, backgroundColor: '#fff', borderRadius: 16, margin: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  cardSelected: { borderColor: '#1A73E8', backgroundColor: '#D6EAFF', shadowOpacity: 0.2, elevation: 6 },
  flagText: { fontSize: 36, marginBottom: 6 },
  langName: { fontSize: 13, color: '#444', fontWeight: '500' },
  langNameSelected: { color: '#1A73E8', fontWeight: 'bold' },
  checkmark: { position: 'absolute', top: 6, right: 10, color: '#1A73E8', fontWeight: 'bold', fontSize: 16 },
  continueButton: {
    backgroundColor: '#1A73E8', borderRadius: 14, padding: 18,
    alignItems: 'center', margin: 20, shadowColor: '#1A73E8', shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  continueText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});