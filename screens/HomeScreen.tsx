import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const BANNER_AD_UNIT_ID = 'ca-app-pub-2933734445794077/8128598578';
let BannerAd: any = null;
let BannerAdSize: any = null;
if (Platform.OS !== 'web') {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
}
import { useNotes } from '../context/NotesContext';
import translations from '../locales';

async function cancelNoteNotification(notificationId: string | undefined) {
  if (!notificationId || Platform.OS === 'web') return;
  try { await Notifications.cancelScheduledNotificationAsync(notificationId); } catch {}
}

async function scheduleNoteNotification(note: any): Promise<string | undefined> {
  if (Platform.OS === 'web' || !note.alarmTime) return undefined;
  try {
    const trigger = new Date(note.date);
    const [h, m] = note.alarmTime.split(':').map(Number);
    trigger.setHours(h, m, 0, 0);
    if (trigger <= new Date()) return undefined;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 ' + note.title,
        body: note.content || note.alarmTime,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  } catch {
    return undefined;
  }
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
function toDateKey(dateStr: string) {
  const [day, month, year] = dateStr.split('.');
  return new Date(Number(year), Number(month) - 1, Number(day)).toDateString();
}

const CATEGORY_COLORS: any = {
  onemli: '#FF6B6B', randevu: '#1A73E8', ozelgun: '#F4A261',
  toplanti: '#2A9D8F', seyahat: '#6C63FF', alisveris: '#E76F51',
};
const CATEGORY_ICONS: any = {
  onemli: '⭐', randevu: '📅', ozelgun: '🎉', toplanti: '💼', seyahat: '✈️', alisveris: '🛒',
};
const TRANSPORT = ['✈️ Uçak','🚌 Otobüs','🚂 Tren','🚢 Gemi','🚗 Araba','🏍️ Diğer'];

export default function HomeScreen({ navigation }: any) {
  const { notesByDate, setNotesByDate, language } = useNotes();
  const t = translations[language];
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [noteDate, setNoteDate] = useState('');
  const [repeat, setRepeat] = useState(t.once);
  const [transport, setTransport] = useState(TRANSPORT[0]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ticketNo, setTicketNo] = useState('');
  const [shopItems, setShopItems] = useState<string[]>(['']);

  const CATEGORIES = [
    { key: 'onemli', label: t.categories.onemli, color: '#FF6B6B' },
    { key: 'randevu', label: t.categories.randevu, color: '#1A73E8' },
    { key: 'ozelgun', label: t.categories.ozelgun, color: '#F4A261' },
    { key: 'toplanti', label: t.categories.toplanti, color: '#2A9D8F' },
    { key: 'seyahat', label: t.categories.seyahat, color: '#6C63FF' },
    { key: 'alisveris', label: t.categories.alisveris, color: '#E76F51' },
  ];
  const REPEAT_OPTIONS = [t.once, t.monthly, t.yearly];

  const getCatColor = (key: string) => CATEGORIES.find(c => c.key === key)?.color || '#1A73E8';
  const getCatLabel = (key: string) => CATEGORIES.find(c => c.key === key)?.label || '';

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(1);
  };

  // Her Yıl tekrarlanan notları tüm yıllarda göster
  const getYearlyNotes = (targetMonth: number, targetDay: number, targetYear: number) => {
    const results: any[] = [];
    for (const key of Object.keys(notesByDate)) {
      for (const note of notesByDate[key]) {
        if (!note.repeat || !note.repeat.includes('Yıl')) continue;
        const d = new Date(note.date);
        if (d.getMonth() === targetMonth && d.getDate() === targetDay && d.getFullYear() !== targetYear) {
          results.push({ ...note, date: new Date(targetYear, targetMonth, targetDay).toDateString() });
        }
      }
    }
    return results;
  };

  const getNotesForDay = (day: number) => {
    const key = new Date(year, month, day).toDateString();
    const direct = notesByDate[key] || [];
    const yearly = getYearlyNotes(month, day, year);
    const yearlyIds = new Set(direct.map((n: any) => n.id));
    return [...direct, ...yearly.filter((n: any) => !yearlyIds.has(n.id))];
  };

  const selectedKey = new Date(year, month, selectedDay).toDateString();
  const selectedNotes = (() => {
    const direct = notesByDate[selectedKey] || [];
    const yearly = getYearlyNotes(month, selectedDay, year);
    const yearlyIds = new Set(direct.map((n: any) => n.id));
    return [...direct, ...yearly.filter((n: any) => !yearlyIds.has(n.id))];
  })();

  const deleteNote = async (id: string) => {
    const note = selectedNotes.find((n: any) => n.id === id) as any;
    await cancelNoteNotification(note?.notificationId);
    const updated = selectedNotes.filter(n => n.id !== id);
    setNotesByDate({ ...notesByDate, [selectedKey]: updated });
  };

  const toggleDone = async (id: string) => {
    const existing = notesByDate[selectedKey] || [];
    const note = existing.find((n: any) => n.id === id) as any;
    if (!note) return;
    if (!note.done) {
      await cancelNoteNotification(note.notificationId);
      const updated = existing.map((n: any) => n.id === id ? { ...n, done: true, notificationId: undefined } : n);
      setNotesByDate({ ...notesByDate, [selectedKey]: updated });
    } else {
      const undonedNote = { ...note, done: false };
      const notificationId = await scheduleNoteNotification(undonedNote);
      const updated = existing.map((n: any) => n.id === id ? { ...undonedNote, notificationId } : n);
      setNotesByDate({ ...notesByDate, [selectedKey]: updated });
    }
  };

  const openEdit = (note: any) => {
    setEditingId(note.id);
    setSelectedCat(note.category);
    setTitle(note.title || '');
    setContent(note.content || '');
    setAlarmTime(note.alarmTime || '09:00');
    setRepeat(note.repeat || t.once);
    setTransport(note.transport || TRANSPORT[0]);
    setFrom(note.from || '');
    setTo(note.to || '');
    setTicketNo(note.ticketNo || '');
    setShopItems(note.items?.length ? note.items : ['']);
    const d = new Date(note.date);
    setNoteDate(
      `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`
    );
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!title.trim() && selectedCat !== 'alisveris') return;
    const saveKey = noteDate ? toDateKey(noteDate) : selectedKey;
    const cat = CATEGORIES.find(c => c.key === selectedCat);
    const allUpdated = { ...notesByDate };
    for (const key of Object.keys(allUpdated)) {
      allUpdated[key] = allUpdated[key].filter((n: any) => n.id !== editingId);
    }
    const existing = allUpdated[saveKey] || [];
    const oldNote = Object.values(notesByDate).flat().find((n: any) => n.id === editingId) as any;
    await cancelNoteNotification(oldNote?.notificationId);
    const updatedNote: any = {
      ...oldNote,
      category: selectedCat,
      title: title || (cat?.label || ''),
      content, date: saveKey, alarmTime, repeat,
      transport: selectedCat === 'seyahat' ? transport : undefined,
      from: selectedCat === 'seyahat' ? from : undefined,
      to: selectedCat === 'seyahat' ? to : undefined,
      ticketNo: selectedCat === 'seyahat' ? ticketNo : undefined,
      items: selectedCat === 'alisveris' ? shopItems.filter(s => s.trim()) : undefined,
      notificationId: undefined,
    };
    updatedNote.notificationId = await scheduleNoteNotification(updatedNote);
    allUpdated[saveKey] = [...existing, updatedNote].sort((a: any, b: any) => a.time.localeCompare(b.time));
    setNotesByDate(allUpdated);
    setEditVisible(false);
    setEditingId(null);
  };

  const addShopItem = () => setShopItems([...shopItems, '']);
  const updateShopItem = (i: number, val: string) => {
    const arr = [...shopItems]; arr[i] = val; setShopItems(arr);
  };
  const removeShopItem = (i: number) => setShopItems(shopItems.filter((_,idx) => idx !== i));

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>📓 {t.appName}</Text>
        <TouchableOpacity style={styles.notesBtn} onPress={() => navigation.navigate('Notes')}>
          <Text style={styles.notesBtnText}>📝 {t.notes}</Text>
        </TouchableOpacity>
      </View>

      {/* Takvim */}
      <View style={styles.calendarBox}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dayHeaders}>
          {DAYS.map(d => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array(firstDay).fill(null).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dayNotes = getNotesForDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCell, isToday && styles.todayCell, isSelected && styles.selectedCell]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedText]}>{day}</Text>
                {dayNotes.length > 0 && (
                  <View style={styles.dotRow}>
                    {dayNotes.slice(0, 3).map((n, idx) => (
                      <View key={idx} style={[styles.dot, { backgroundColor: CATEGORY_COLORS[n.category] || '#1A73E8' }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seçili Gün Notları */}
      <View style={styles.notesSection}>
        <View style={styles.notesSectionHeader}>
          <Text style={styles.notesSectionTitle}>
            📋 {selectedDay} {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Notes')}>
            <Text style={styles.addBtnText}>+ Ekle</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          {selectedNotes.length === 0 ? (
            <Text style={styles.emptyText}>{t.noNote}</Text>
          ) : (
            selectedNotes.map(note => (
              <View key={note.id} style={[styles.noteCard, { borderLeftColor: CATEGORY_COLORS[note.category] || '#1A73E8' }]}>
                <View style={styles.noteCardHeader}>
                  <TouchableOpacity onPress={() => toggleDone(note.id)}>
                    <Text style={styles.catIcon}>{note.done ? '✅' : CATEGORY_ICONS[note.category] || '📝'}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.noteTitle, note.done && styles.doneText]}>{note.title}</Text>
                  <View style={styles.noteActions}>
                    <TouchableOpacity onPress={() => openEdit(note)}>
                      <Text style={styles.actionBtn}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteNote(note.id)}>
                      <Text style={styles.actionBtn}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.noteTime}>🔔 {note.alarmTime}  🔁 {note.repeat}</Text>
                {note.content ? <Text style={styles.noteContent} numberOfLines={1}>{note.content}</Text> : null}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Alt Butonlar */}
      <TouchableOpacity style={styles.langBtn} onPress={() => navigation.navigate('Language')}>
        <Text style={styles.langBtnText}>🌍 Dil Değiştir</Text>
      </TouchableOpacity>

      {/* Banner Reklam */}
      {Platform.OS !== 'web' && BannerAd && BannerAdSize && (
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      )}

      {/* DÜZENLEME MODAL */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalBox}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: getCatColor(selectedCat) }]}>
                ✏️ {getCatLabel(selectedCat)}
              </Text>

              <Text style={styles.label}>{t.title}</Text>
              <TextInput style={styles.input} placeholder={t.titlePlaceholder} value={title} onChangeText={setTitle} />

              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeBox}>
                  <Text style={styles.label}>📅 Tarih</Text>
                  <TextInput style={styles.input} placeholder="GG.AA.YYYY" value={noteDate} onChangeText={setNoteDate} />
                </View>
                <View style={styles.dateTimeBox}>
                  <Text style={styles.label}>{t.alarmTime}</Text>
                  <TextInput style={styles.input} placeholder="09:00" value={alarmTime} onChangeText={setAlarmTime} />
                </View>
              </View>

              <Text style={styles.label}>{t.repeat}</Text>
              <View style={styles.repeatRow}>
                {REPEAT_OPTIONS.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.repeatBtn, repeat === r && { backgroundColor: getCatColor(selectedCat) }]}
                    onPress={() => setRepeat(r)}
                  >
                    <Text style={[styles.repeatText, repeat === r && { color: '#fff' }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedCat === 'seyahat' && (
                <View>
                  <Text style={styles.label}>{t.transport}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.transportRow}>
                    {TRANSPORT.map(tr2 => (
                      <TouchableOpacity
                        key={tr2}
                        style={[styles.transportBtn, transport === tr2 && { backgroundColor: '#6C63FF' }]}
                        onPress={() => setTransport(tr2)}
                      >
                        <Text style={[styles.transportText, transport === tr2 && { color: '#fff' }]}>{tr2}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.label}>{t.from}</Text>
                  <TextInput style={styles.input} placeholder={t.fromPlaceholder} value={from} onChangeText={setFrom} />
                  <Text style={styles.label}>{t.to}</Text>
                  <TextInput style={styles.input} placeholder={t.toPlaceholder} value={to} onChangeText={setTo} />
                  <Text style={styles.label}>{t.ticketNo}</Text>
                  <TextInput style={styles.input} placeholder={t.ticketPlaceholder} value={ticketNo} onChangeText={setTicketNo} />
                </View>
              )}

              {selectedCat === 'alisveris' && (
                <View>
                  <Text style={styles.label}>{t.shoppingList}</Text>
                  {shopItems.map((item, i) => (
                    <View key={i} style={styles.shopRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        placeholder={`${i + 1}.`}
                        value={item}
                        onChangeText={v => updateShopItem(i, v)}
                      />
                      <TouchableOpacity onPress={() => removeShopItem(i)} style={styles.removeBtn}>
                        <Text style={styles.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addItemBtn} onPress={addShopItem}>
                    <Text style={styles.addItemText}>{t.addItem}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.label}>{t.generalNote}</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder={t.notePlaceholder}
                value={content}
                onChangeText={setContent}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
                  <Text style={styles.cancelText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: getCatColor(selectedCat) }]} onPress={saveEdit}>
                  <Text style={styles.saveText}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF4FF' },
  topBar: {
    backgroundColor: '#1A73E8', paddingTop: 50, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  appName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  notesBtn: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  notesBtnText: { color: '#1A73E8', fontWeight: 'bold', fontSize: 14 },
  calendarBox: {
    backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  arrowBtn: { padding: 8 },
  arrowText: { fontSize: 24, color: '#1A73E8', fontWeight: 'bold' },
  monthTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A73E8' },
  dayHeaders: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, color: '#888', fontWeight: 'bold' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4, borderRadius: 8 },
  todayCell: { backgroundColor: '#EAF4FF' },
  selectedCell: { backgroundColor: '#1A73E8', borderRadius: 8 },
  dayText: { fontSize: 14, color: '#333' },
  todayText: { color: '#1A73E8', fontWeight: 'bold' },
  selectedText: { color: '#fff', fontWeight: 'bold' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  notesSection: {
    flex: 1, marginHorizontal: 12, marginBottom: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  notesSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  notesSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A73E8' },
  addBtn: { backgroundColor: '#1A73E8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20, fontSize: 14 },
  noteCard: {
    borderLeftWidth: 4, paddingLeft: 10, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f4ff', marginBottom: 4,
  },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  catIcon: { fontSize: 16 },
  noteActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { fontSize: 16 },
  noteTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', flex: 1 },
  noteTime: { fontSize: 12, color: '#888', marginTop: 2 },
  noteContent: { fontSize: 13, color: '#555', marginTop: 2 },
  doneText: { textDecorationLine: 'line-through', color: '#aaa' },
  langBtn: {
    margin: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#1A73E8',
  },
  langBtnText: { color: '#1A73E8', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 6 },
  closeBtnText: { fontSize: 20, color: '#aaa', fontWeight: 'bold' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: '#c8dff5', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 8, backgroundColor: '#f5faff',
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  dateTimeBox: { flex: 1 },
  repeatRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  repeatBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  repeatText: { fontSize: 13, color: '#555', fontWeight: '600' },
  transportRow: { marginBottom: 8 },
  transportBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#6C63FF', marginRight: 8 },
  transportText: { color: '#6C63FF', fontWeight: '600' },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeBtn: { padding: 8, backgroundColor: '#ffe0e0', borderRadius: 8 },
  removeBtnText: { color: '#e74c3c', fontWeight: 'bold' },
  addItemBtn: { borderWidth: 1, borderColor: '#E76F51', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 8, borderStyle: 'dashed' },
  addItemText: { color: '#E76F51', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1A73E8', alignItems: 'center' },
  cancelText: { color: '#1A73E8', fontWeight: 'bold', fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});