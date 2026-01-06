import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventsProvider } from "@/providers/EventsProvider";
import { ProfilesProvider } from "@/providers/ProfilesProvider";
import { PaymentProvider } from "@/providers/PaymentProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CouponProvider } from "@/providers/CouponProvider";
import { View, ActivityIndicator, StyleSheet, Pressable } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { trpc, trpcClient } from "@/lib/trpc";
import { X } from "lucide-react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();

  const closeButton = useMemo(
    () =>
      function CloseButton() {
        return (
          <Pressable
            testID="header-close"
            onPress={() => {
              console.log('[ride-history] header close pressed');
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/(tabs)' as any);
            }}
            style={({ pressed }) => [
              {
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(15, 23, 42, 0.08)' : 'transparent',
              },
            ]}
            hitSlop={10}
          >
            <X size={20} color="#0F172A" />
          </Pressable>
        );
      },
    [router]
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen
        name="create-event"
        options={{ presentation: "transparentModal", animation: "none", gestureEnabled: false }}
      />
      <Stack.Screen
        name="event/[id]"
        options={{
          headerShown: true,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="events-nearby" />
      <Stack.Screen name="smart-demo" />
      <Stack.Screen
        name="payment-methods"
        options={{ presentation: "transparentModal", animation: "none", gestureEnabled: false }}
      />
      <Stack.Screen name="manage-coupons" />
      <Stack.Screen name="work-groups" />
      <Stack.Screen
        name="create-group"
        options={{ presentation: "transparentModal", animation: "none", gestureEnabled: false }}
      />
      <Stack.Screen name="group/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="select-driver" />
      <Stack.Screen
        name="ride-chat/[rideId]"
        options={{ headerShown: true, title: "Chat with Driver", gestureEnabled: false }}
      />
      <Stack.Screen
        name="ride-history"
        options={{
          headerShown: true,
          title: "Ride History",
          presentation: "modal",
          gestureEnabled: false,
          headerLeft: closeButton,
        }}
      />
    </Stack>
  );
}

function RootContent() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error during app preparation:', error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfilesProvider>
            <CouponProvider>
              <PaymentProvider>
                <EventsProvider>
                  <RootContent />
                </EventsProvider>
              </PaymentProvider>
            </CouponProvider>
          </ProfilesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
