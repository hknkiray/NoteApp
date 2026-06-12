import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Note = {
  id: string;
  category: string;
  title: string;
  content: string;
  date: string;
  alarmTime: string;
  repeat: string;
  time: string;
  done: boolean;
  transport?: string;
  from?: string;
  to?: string;
  ticketNo?: string;
  items?: string[];
  audioUri?: string;
  notificationId?: string;
};

type NotesByDate = { [date: string]: Note[] };

type NotesContextType = {
  notesByDate: NotesByDate;
  setNotesByDate: (notes: NotesByDate) => void;
  language: string;
  setLanguage: (lang: string) => void;
};

const NotesContext = createContext<NotesContextType>({
  notesByDate: {},
  setNotesByDate: () => {},
  language: 'en',
  setLanguage: () => {},
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notesByDate, setNotesByDateState] = useState<NotesByDate>({});
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('notesByDate').then(val => {
      if (val) setNotesByDateState(JSON.parse(val));
    });
    AsyncStorage.getItem('language').then(val => {
      if (val) setLanguageState(val);
    });
  }, []);

  const setNotesByDate = (notes: NotesByDate) => {
    setNotesByDateState(notes);
    AsyncStorage.setItem('notesByDate', JSON.stringify(notes));
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    AsyncStorage.setItem('language', lang);
  };

  return (
    <NotesContext.Provider value={{ notesByDate, setNotesByDate, language, setLanguage }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}
