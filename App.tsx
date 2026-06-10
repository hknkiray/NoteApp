import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotesProvider } from './context/NotesContext';
import LanguageScreen from './screens/LanguageScreen';
import HomeScreen from './screens/HomeScreen';
import NotesScreen from './screens/NotesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NotesProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Notes" component={NotesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NotesProvider>
  );
}