import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventsProvider } from "@/providers/EventsProvider";
import { ProfilesProvider } from "@/providers/ProfilesProvider";
import { PaymentProvider } from "@/providers/PaymentProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CouponProvider } from "@/providers/CouponProvider";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="create-event" options={{ presentation: "modal" }} />
      <Stack.Screen name="event/[id]" />
      <Stack.Screen name="events-nearby" />
      <Stack.Screen name="smart-demo" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="manage-coupons" />
      <Stack.Screen name="work-groups" />
      <Stack.Screen name="create-group" options={{ presentation: "modal" }} />
      <Stack.Screen name="group/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="select-driver" />
      <Stack.Screen name="ride-chat/[rideId]" />
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
      <RootLayoutNav />
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
