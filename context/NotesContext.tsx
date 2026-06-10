import React, { createContext, useContext, useState } from 'react';

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
  const [notesByDate, setNotesByDate] = useState<NotesByDate>({});
  const [language, setLanguage] = useState('en');

  return (
    <NotesContext.Provider value={{ notesByDate, setNotesByDate, language, setLanguage }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}