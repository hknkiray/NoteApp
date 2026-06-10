import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Modal, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useNotes } from '../context/NotesContext';
import translations from '../locales';

const DAYS_TR = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDate(date: Date) {
  return `${DAYS_TR[date.getDay()]}, ${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
}
function formatTime(date: Date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
function toDateKey(dateStr: string) {
  const [day, month, year] = dateStr.split('.');
  return new Date(Number(year), Number(month)-1, Number(day)).toDateString();
}

const TRANSPORT = ['✈️ Uçak','🚌 Otobüs','🚂 Tren','🚢 Gemi','🚗 Araba','🏍️ Diğer'];

export default function NotesScreen({ navigation, route }: any) {
  const { notesByDate, setNotesByDate, language } = useNotes();
  const t = translations[language];

  const CATEGORIES = [
    { key: 'onemli', label: t.categories.onemli, color: '#FF6B6B' },
    { key: 'randevu', label: t.categories.randevu, color: '#1A73E8' },
    { key: 'ozelgun', label: t.categories.ozelgun, color: '#F4A261' },
    { key: 'toplanti', label: t.categories.toplanti, color: '#2A9D8F' },
    { key: 'seyahat', label: t.categories.seyahat, color: '#6C63FF' },
    { key: 'alisveris', label: t.categories.alisveris, color: '#E76F51' },
  ];

  const REPEAT_OPTIONS = [t.once, t.monthly, t.yearly];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [step, setStep] = useState<'closed'|'category'|'form'>('closed');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [noteDate, setNoteDate] = useState('');
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerTime, setPickerTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState(t.once);
  const [transport, setTransport] = useState(TRANSPORT[0]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ticketNo, setTicketNo] = useState('');
  const [shopItems, setShopItems] = useState<string[]>(['']);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const dateKey = currentDate.toDateString();
  const todayNotes = notesByDate[dateKey] || [];

  React.useEffect(() => {
    const note = route?.params?.editNote;
    if (note) openEdit(note);
  }, []);

  const goBack = () => { const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(d); };
  const goForward = () => { const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(d); };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {}
  };

  const stopRecording = async () => {
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      const uri = recordingRef.current?.getURI() || null;
      setAudioUri(uri);
      recordingRef.current = null;
      setIsRecording(false);
    } catch {}
  };

  const playAudio = async () => {
    if (!audioUri) return;
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if ('didJustFinish' in status && status.didJustFinish) setIsPlaying(false);
      });
    } catch {}
  };

  const openCategory = () => {
    setEditingId(null);
    setTitle(''); setContent(''); setAlarmTime('09:00');
    setRepeat(t.once); setTransport(TRANSPORT[0]);
    setFrom(''); setTo(''); setTicketNo(''); setShopItems(['']);
    setAudioUri(null); setIsRecording(false); setIsPlaying(false);
    const nd = currentDate;
    setNoteDate(`${nd.getDate().toString().padStart(2,'0')}.${(nd.getMonth()+1).toString().padStart(2,'0')}.${nd.getFullYear()}`);
    setPickerDate(nd);
    setPickerTime(new Date());
    setStep('category');
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
    setAudioUri(note.audioUri || null); setIsRecording(false); setIsPlaying(false);
    const d = new Date(note.date);
    setNoteDate(`${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`);
    setPickerDate(d);
    const [h, m] = (note.alarmTime || '09:00').split(':');
    const pt = new Date(); pt.setHours(Number(h)); pt.setMinutes(Number(m));
    setPickerTime(pt);
    setStep('form');
  };

  const selectCategory = (key: string) => { setSelectedCat(key); setStep('form'); };

  const addShopItem = () => setShopItems([...shopItems, '']);
  const updateShopItem = (i: number, val: string) => {
    const arr = [...shopItems]; arr[i] = val; setShopItems(arr);
  };
  const removeShopItem = (i: number) => setShopItems(shopItems.filter((_,idx) => idx !== i));

  const saveNote = () => {
    if (!title.trim() && selectedCat !== 'alisveris') return;
    const saveKey = noteDate ? toDateKey(noteDate) : dateKey;
    const cat = CATEGORIES.find(c => c.key === selectedCat);

    if (editingId) {
      // Düzenleme: eski notu bul, güncelle (farklı tarihe taşınmış olabilir)
      const allUpdated = { ...notesByDate };
      // eski kaydı bütün tarihlerden temizle
      for (const key of Object.keys(allUpdated)) {
        allUpdated[key] = allUpdated[key].filter((n: any) => n.id !== editingId);
      }
      const existing = allUpdated[saveKey] || [];
      const oldNote = Object.values(notesByDate).flat().find((n: any) => n.id === editingId) as any;
      const updatedNote = {
        ...oldNote,
        category: selectedCat,
        title: title || (cat?.label || ''),
        content, date: saveKey, alarmTime, repeat,
        audioUri: audioUri || undefined,
        transport: selectedCat === 'seyahat' ? transport : undefined,
        from: selectedCat === 'seyahat' ? from : undefined,
        to: selectedCat === 'seyahat' ? to : undefined,
        ticketNo: selectedCat === 'seyahat' ? ticketNo : undefined,
        items: selectedCat === 'alisveris' ? shopItems.filter(s => s.trim()) : undefined,
      };
      allUpdated[saveKey] = [...existing, updatedNote].sort((a: any, b: any) => a.time.localeCompare(b.time));
      setNotesByDate(allUpdated);
    } else {
      const now = new Date();
      const existing = notesByDate[saveKey] || [];
      const newNote = {
        id: Date.now().toString(),
        category: selectedCat,
        title: title || (cat?.label || ''),
        content, date: saveKey, alarmTime, repeat,
        time: formatTime(now), done: false,
        transport: selectedCat === 'seyahat' ? transport : undefined,
        from: selectedCat === 'seyahat' ? from : undefined,
        to: selectedCat === 'seyahat' ? to : undefined,
        ticketNo: selectedCat === 'seyahat' ? ticketNo : undefined,
        items: selectedCat === 'alisveris' ? shopItems.filter(s => s.trim()) : undefined,
        audioUri: audioUri || undefined,
      };
      const sorted = [...existing, newNote].sort((a,b) => a.time.localeCompare(b.time));
      setNotesByDate({ ...notesByDate, [saveKey]: sorted });
    }
    setEditingId(null);
    setStep('closed');
    if (route?.params?.editNote) navigation.goBack();
  };

  const toggleDone = (id: string) => {
    const updated = todayNotes.map(n => n.id === id ? { ...n, done: !n.done } : n);
    setNotesByDate({ ...notesByDate, [dateKey]: updated });
  };

  const deleteNote = (id: string) => {
    setNotesByDate({ ...notesByDate, [dateKey]: todayNotes.filter(n => n.id !== id) });
  };

  const getCatColor = (key: string) => CATEGORIES.find(c => c.key === key)?.color || '#1A73E8';
  const getCatLabel = (key: string) => CATEGORIES.find(c => c.key === key)?.label || '';

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
            <Text style={styles.backText}>🏠</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{t.back}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.topBarRight}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          <Text style={styles.dateText}>{formatTime(new Date())}</Text>
        </View>
      </View>

      {/* İleri Geri */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={goBack}>
          <Text style={styles.navBtnText}>{t.previous}</Text>
        </TouchableOpacity>
        <Text style={styles.navDateText}>{currentDate.toLocaleDateString('tr-TR')}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={goForward}>
          <Text style={styles.navBtnText}>{t.next}</Text>
        </TouchableOpacity>
      </View>

      {/* Sekmeler */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, styles.tabActive]}>
          <Text style={styles.tabActiveText}>{t.notes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.tabText}>🗓️ Takvim</Text>
        </TouchableOpacity>
      </View>

      {/* Defter */}
      <ScrollView style={styles.notebook}>
        {todayNotes.length === 0 && (
          <Text style={styles.emptyText}>{t.noNote}</Text>
        )}
        {todayNotes.map(note => (
          <View key={note.id} style={[styles.noteCard, { borderLeftColor: getCatColor(note.category) }]}>
            <View style={styles.noteHeader}>
              <View style={styles.noteHeaderLeft}>
                <Text style={[styles.catBadge, { backgroundColor: getCatColor(note.category) }]}>
                  {getCatLabel(note.category)}
                </Text>
                <Text style={styles.noteTime}>🕐 {note.time}  🔔 {note.alarmTime}  🔁 {note.repeat}</Text>
              </View>
              <View style={styles.noteActions}>
                <TouchableOpacity onPress={() => toggleDone(note.id)}>
                  <Text style={styles.actionBtn}>{note.done ? '↩️' : '✅'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEdit(note)}>
                  <Text style={styles.actionBtn}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteNote(note.id)}>
                  <Text style={styles.actionBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.noteTitle, note.done && styles.doneText]}>{note.title}</Text>
            {note.category === 'seyahat' && (
              <View style={styles.travelBox}>
                <Text style={styles.travelText}>🚏 {note.transport}</Text>
                <Text style={styles.travelText}>📍 {note.from} → {note.to}</Text>
                {note.ticketNo ? <Text style={styles.travelText}>🎫 {note.ticketNo}</Text> : null}
              </View>
            )}
            {note.category === 'alisveris' && note.items && (
              <View>
                {note.items.map((item, i) => (
                  <Text key={i} style={styles.shopItem}>• {item}</Text>
                ))}
              </View>
            )}
            {note.content ? (
              <Text style={[styles.noteContent, note.done && styles.doneText]}>{note.content}</Text>
            ) : null}
            {note.audioUri ? (
              <TouchableOpacity style={styles.playCardBtn} onPress={async () => {
                try {
                  const { sound } = await Audio.Sound.createAsync({ uri: note.audioUri });
                  await sound.playAsync();
                } catch {}
              }}>
                <Text style={styles.playCardBtnText}>▶️ Ses Kaydını Oynat</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCategory}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* KATEGORİ MODAL */}
      <Modal visible={step === 'category'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t.whatAdd}</Text>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catButton, { borderColor: cat.color }]}
                onPress={() => selectCategory(cat.key)}
              >
                <Text style={[styles.catButtonText, { color: cat.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('closed')}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FORM MODAL */}
      <Modal visible={step === 'form'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalBox}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setStep('closed'); setEditingId(null); if (route?.params?.editNote) navigation.goBack(); }}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: getCatColor(selectedCat) }]}>
                {editingId ? '✏️ ' : ''}{getCatLabel(selectedCat)}
              </Text>

              <Text style={styles.label}>{t.title}</Text>
              <TextInput style={styles.input} placeholder={t.titlePlaceholder} value={title} onChangeText={setTitle} />

              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeBox}>
                  <Text style={styles.label}>📅 Tarih</Text>
                  <input
                    type="date"
                    value={pickerDate ? `${pickerDate.getFullYear()}-${(pickerDate.getMonth()+1).toString().padStart(2,'0')}-${pickerDate.getDate().toString().padStart(2,'0')}` : ''}
                    onChange={(e: any) => {
                      const d = new Date(e.target.value + 'T00:00:00');
                      if (!isNaN(d.getTime())) {
                        setPickerDate(d);
                        setNoteDate(`${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`);
                      }
                    }}
                    style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '10px', border: '1px solid #c8dff5', backgroundColor: '#f5faff', marginBottom: '8px', boxSizing: 'border-box' } as any}
                  />
                </View>
                <View style={styles.dateTimeBox}>
                  <Text style={styles.label}>{t.alarmTime}</Text>
                  <input
                    type="time"
                    value={alarmTime}
                    onChange={(e: any) => setAlarmTime(e.target.value)}
                    style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '10px', border: '1px solid #c8dff5', backgroundColor: '#f5faff', marginBottom: '8px', boxSizing: 'border-box' } as any}
                  />
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

              <Text style={styles.label}>🎙️ Ses Kaydı</Text>
              <View style={styles.audioRow}>
                <TouchableOpacity
                  style={[styles.audioBtn, isRecording && styles.audioBtnRecording]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Text style={styles.audioBtnText}>{isRecording ? '⏹ Durdur' : '🎙️ Kaydet'}</Text>
                </TouchableOpacity>
                {audioUri && (
                  <TouchableOpacity
                    style={[styles.audioBtn, styles.audioBtnPlay]}
                    onPress={playAudio}
                  >
                    <Text style={styles.audioBtnText}>{isPlaying ? '🔊 Çalıyor...' : '▶️ Oynat'}</Text>
                  </TouchableOpacity>
                )}
                {audioUri && (
                  <TouchableOpacity style={styles.audioDeleteBtn} onPress={() => setAudioUri(null)}>
                    <Text style={styles.audioDeleteText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isRecording && <Text style={styles.recordingText}>● Kayıt yapılıyor...</Text>}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('category')}>
                  <Text style={styles.cancelText}>{t.back}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: getCatColor(selectedCat) }]} onPress={saveNote}>
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
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarRight: { alignItems: 'flex-end' },
  backBtn: { padding: 6 },
  backText: { color: '#fff', fontSize: 16 },
  dateText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navBtn: { backgroundColor: '#1A73E8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  navBtnText: { color: '#fff', fontWeight: 'bold' },
  navDateText: { color: '#1A73E8', fontWeight: 'bold', fontSize: 15 },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1A73E8',
  },
  tabBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#1A73E8' },
  tabActiveText: { color: '#fff', fontWeight: 'bold' },
  tabText: { color: '#1A73E8', fontWeight: 'bold' },
  notebook: {
    flex: 1, marginHorizontal: 16, backgroundColor: '#fff',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#c8dff5',
  },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 15 },
  noteCard: {
    borderLeftWidth: 4, paddingLeft: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e8f4ff', marginBottom: 4,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  noteHeaderLeft: { flex: 1 },
  catBadge: {
    alignSelf: 'flex-start', color: '#fff', fontSize: 11,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4,
  },
  noteTime: { color: '#888', fontSize: 11 },
  noteActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { fontSize: 18 },
  noteTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  noteContent: { fontSize: 14, color: '#444', lineHeight: 20 },
  doneText: { textDecorationLine: 'line-through', color: '#aaa' },
  travelBox: { backgroundColor: '#f0f4ff', borderRadius: 8, padding: 8, marginVertical: 4 },
  travelText: { fontSize: 13, color: '#444', marginBottom: 2 },
  shopItem: { fontSize: 14, color: '#333', marginLeft: 4, marginBottom: 2 },
  fab: {
    position: 'absolute', bottom: 30, right: 24, width: 60, height: 60,
    borderRadius: 30, backgroundColor: '#1A73E8', alignItems: 'center',
    justifyContent: 'center', elevation: 6, shadowColor: '#1A73E8',
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 6 },
  closeBtnText: { fontSize: 20, color: '#aaa', fontWeight: 'bold' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A73E8', marginBottom: 16, textAlign: 'center' },
  catButton: {
    borderWidth: 2, borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center',
  },
  catButtonText: { fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: '#c8dff5', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 8, backgroundColor: '#f5faff',
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  dateTimeBox: { flex: 1 },
  pickerBtn: {
    borderWidth: 1, borderColor: '#c8dff5', borderRadius: 10,
    padding: 12, backgroundColor: '#f5faff', marginBottom: 8,
  },
  pickerBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  repeatRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  repeatBtn: {
    flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  repeatText: { fontSize: 13, color: '#555', fontWeight: '600' },
  transportRow: { marginBottom: 8 },
  transportBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#6C63FF', marginRight: 8,
  },
  transportText: { color: '#6C63FF', fontWeight: '600' },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeBtn: { padding: 8, backgroundColor: '#ffe0e0', borderRadius: 8 },
  removeBtnText: { color: '#e74c3c', fontWeight: 'bold' },
  addItemBtn: {
    borderWidth: 1, borderColor: '#E76F51', borderRadius: 10,
    padding: 10, alignItems: 'center', marginBottom: 8, borderStyle: 'dashed',
  },
  addItemText: { color: '#E76F51', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#1A73E8', alignItems: 'center',
  },
  cancelText: { color: '#1A73E8', fontWeight: 'bold', fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  audioRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  audioBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1A73E8' },
  audioBtnRecording: { backgroundColor: '#e74c3c' },
  audioBtnPlay: { backgroundColor: '#2A9D8F' },
  audioBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  audioDeleteBtn: { padding: 8 },
  audioDeleteText: { fontSize: 18 },
  recordingText: { color: '#e74c3c', fontSize: 13, marginBottom: 8, fontWeight: 'bold' },
  playCardBtn: { marginTop: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#EAF4FF', borderRadius: 8, alignSelf: 'flex-start' },
  playCardBtnText: { color: '#1A73E8', fontWeight: 'bold', fontSize: 13 },
});