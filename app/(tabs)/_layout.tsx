import { Tabs } from 'expo-router';
import { Compass, Calendar, User, Users, Bot, Home } from 'lucide-react-native';

export const unstable_settings = {
  initialRouteName: 'home',
};

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Home size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Compass size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: 'My Events',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Calendar size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Users size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-luca"
        options={{
          title: 'AI Uno',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Bot size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <User size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="past"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
