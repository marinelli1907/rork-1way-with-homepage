import { X, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useEvents } from '@/providers/EventsProvider';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { NOW_PLAYING_MOVIES } from '@/constants/movies';
import { CLEVELAND_RESTAURANTS } from '@/constants/restaurants';

const UnoChat = forwardRef((_props, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    toggle: () => setIsOpen(prev => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const {
    upcomingEvents,
    saveFromCatalog,
    getNearbyEvents,
    userLocation,
  } = useEvents();

  const { messages, error, sendMessage } = useRorkAgent({
    tools: {
      findNearbyEvents: createRorkTool({
        description: 'Search for nearby events by category, date range, or keywords',
        zodSchema: z.object({
          category: z.enum(['sports', 'concert', 'bar', 'general', 'all']).optional().describe('Event category filter'),
          searchQuery: z.string().optional().describe('Search keywords'),
          daysAhead: z.number().optional().describe('How many days ahead to search (default 7)'),
          maxDistance: z.number().optional().describe('Max distance in miles (default 25)'),
        }),
        execute: (params) => {
          const now = new Date();
          const endDate = new Date();
          endDate.setDate(now.getDate() + (params.daysAhead || 7));

          const results = getNearbyEvents({
            category: params.category || 'all',
            distance: (params.maxDistance || 25) as any,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            sort: 'nearest',
            searchQuery: params.searchQuery || '',
          });

          const formatted = results.slice(0, 5).map(e => ({
            title: e.title,
            venue: e.venue,
            date: new Date(e.startISO).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }),
            distance: `${e.distance.toFixed(1)} mi`,
            category: e.category,
            estimatedRideCost: `$${Math.round(40 + e.distance * 1.2)}`,
          }));

          return JSON.stringify(formatted, null, 2);
        },
      }),

      getUserCalendar: createRorkTool({
        description: 'Get the user\'s upcoming events',
        zodSchema: z.object({}),
        execute: () => {
          const formatted = upcomingEvents.slice(0, 10).map(e => ({
            title: e.title,
            venue: e.venue,
            date: new Date(e.startISO).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }),
            category: e.category,
          }));

          return JSON.stringify(formatted, null, 2);
        },
      }),

      budgetDate: createRorkTool({
        description: 'Create a budget breakdown for a date night including rides, tickets, and meals',
        zodSchema: z.object({
          eventType: z.string().describe('Type of date (e.g., "dinner and movie", "concert night")'),
          budget: z.number().describe('Total budget in dollars'),
        }),
        execute: (params) => {
          const rideEstimate = 50;
          const ticketEstimate = params.eventType.toLowerCase().includes('concert') ? 80 : 30;
          const remaining = params.budget - rideEstimate - ticketEstimate;
          
          const result = {
            breakdown: {
              rides: `$${rideEstimate} (round trip)`,
              tickets: `$${ticketEstimate}`,
              food: `$${Math.max(0, remaining)}`,
            },
            total: params.budget,
            recommendation: remaining < 40 
              ? 'Budget is tight. Consider food trucks or happy hour specials.'
              : 'You have room for a nice dinner or cocktails!',
          };

          return JSON.stringify(result, null, 2);
        },
      }),

      saveEventToCalendar: createRorkTool({
        description: 'Save a nearby event to the user\'s calendar',
        zodSchema: z.object({
          eventTitle: z.string().describe('Title of the event to save'),
        }),
        execute: async (params) => {
          const nearbyEvents = getNearbyEvents({
            category: 'all',
            distance: 50,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            sort: 'soonest',
            searchQuery: params.eventTitle,
          });

          const event = nearbyEvents[0];
          if (!event) {
            return JSON.stringify({ success: false, message: 'Event not found' });
          }

          const saved = await saveFromCatalog(event.id);
          const result = {
            success: true,
            message: `Added "${event.title}" to your calendar`,
            eventId: saved?.id,
          };

          return JSON.stringify(result, null, 2);
        },
      }),

      getTicketLinks: createRorkTool({
        description: 'Generate affiliate ticket purchase links for events',
        zodSchema: z.object({
          eventName: z.string().describe('Name of the event'),
          venue: z.string().describe('Venue name'),
        }),
        execute: (params) => {
          const encodedEvent = encodeURIComponent(params.eventName);
          
          const result = {
            ticketmaster: `https://www.ticketmaster.com/search?q=${encodedEvent}`,
            seatgeek: `https://seatgeek.com/search?q=${encodedEvent}`,
            stubhub: `https://www.stubhub.com/find/s/?q=${encodedEvent}`,
            recommendation: 'Check Ticketmaster first for best availability',
          };

          return JSON.stringify(result, null, 2);
        },
      }),

      findMovies: createRorkTool({
        description: 'Search for movies currently playing in theaters',
        zodSchema: z.object({
          genre: z.string().optional().describe('Movie genre to filter by (e.g., Action, Comedy, Drama)'),
          searchQuery: z.string().optional().describe('Search keywords for movie title'),
        }),
        execute: (params) => {
          let movies = NOW_PLAYING_MOVIES;
          
          if (params.searchQuery) {
            movies = movies.filter(m => 
              m.title.toLowerCase().includes(params.searchQuery!.toLowerCase())
            );
          }
          
          if (params.genre) {
            movies = movies.filter(m =>
              m.genre.some(g => g.toLowerCase().includes(params.genre!.toLowerCase()))
            );
          }
          
          const formatted = movies.slice(0, 5).map(m => ({
            title: m.title,
            genre: m.genre.join(', '),
            rating: m.rating,
            duration: `${m.duration} min`,
            description: m.description,
          }));
          
          return JSON.stringify(formatted, null, 2);
        },
      }),

      bookMovieTickets: createRorkTool({
        description: 'Book movie tickets at a theater. Opens the movie details page where user can select showtime and theater.',
        zodSchema: z.object({
          movieTitle: z.string().describe('Title of the movie to book'),
        }),
        execute: (params) => {
          const movie = NOW_PLAYING_MOVIES.find(m => 
            m.title.toLowerCase().includes(params.movieTitle.toLowerCase())
          );
          
          if (!movie) {
            return JSON.stringify({ success: false, message: 'Movie not found' });
          }
          
          setTimeout(() => {
            router.push(`/movie/${movie.id}`);
          }, 500);
          
          return JSON.stringify({
            success: true,
            message: `Opening ticket booking for "${movie.title}"`,
            movie: {
              title: movie.title,
              genre: movie.genre.join(', '),
              rating: movie.rating,
            },
          });
        },
      }),

      findRestaurants: createRorkTool({
        description: 'Search for restaurants nearby',
        zodSchema: z.object({
          cuisine: z.string().optional().describe('Type of cuisine (e.g., Italian, Mexican, Sushi)'),
          priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().describe('Price range'),
        }),
        execute: (params) => {
          let restaurants = CLEVELAND_RESTAURANTS;
          
          if (params.cuisine) {
            restaurants = restaurants.filter(r =>
              r.cuisine.some(c => c.toLowerCase().includes(params.cuisine!.toLowerCase()))
            );
          }
          
          if (params.priceRange) {
            restaurants = restaurants.filter(r => r.priceRange === params.priceRange);
          }
          
          const formatted = restaurants.slice(0, 5).map(r => ({
            name: r.name,
            cuisine: r.cuisine.join(', '),
            priceRange: r.priceRange,
            rating: r.rating,
            address: r.address,
            description: r.description,
          }));
          
          return JSON.stringify(formatted, null, 2);
        },
      }),

      bookRestaurant: createRorkTool({
        description: 'Make a reservation at a restaurant. Opens the restaurant details page where user can select date, time, and party size.',
        zodSchema: z.object({
          restaurantName: z.string().describe('Name of the restaurant'),
          partySize: z.number().optional().describe('Number of people (optional)'),
          date: z.string().optional().describe('Preferred date (optional)'),
        }),
        execute: (params) => {
          const restaurant = CLEVELAND_RESTAURANTS.find(r =>
            r.name.toLowerCase().includes(params.restaurantName.toLowerCase())
          );
          
          if (!restaurant) {
            return JSON.stringify({ success: false, message: 'Restaurant not found' });
          }
          
          setTimeout(() => {
            router.push(`/restaurant/${restaurant.id}`);
          }, 500);
          
          return JSON.stringify({
            success: true,
            message: `Opening reservation page for "${restaurant.name}"`,
            restaurant: {
              name: restaurant.name,
              cuisine: restaurant.cuisine.join(', '),
              rating: restaurant.rating,
              priceRange: restaurant.priceRange,
            },
          });
        },
      }),

      bookRide: createRorkTool({
        description: 'Book a ride through 1Way (our internal platform - NOT Uber/Lyft) to/from an event. ALWAYS use this tool for ride booking - never suggest external services like Uber, Lyft, or any third-party ride services. Use this when user asks to book a ride, get a driver, or arrange transportation.',
        zodSchema: z.object({
          eventTitle: z.string().describe('Title of the event to book ride for'),
          rideType: z.enum(['arrival', 'return']).describe('Whether ride is to arrive at event or return from event'),
          pickupAddress: z.string().optional().describe('Pickup address (optional, will use user location if not provided)'),
        }),
        execute: async (params) => {
          const event = upcomingEvents.find(e => 
            e.title.toLowerCase().includes(params.eventTitle.toLowerCase())
          );

          if (!event) {
            return JSON.stringify({
              success: false,
              message: `Event "${params.eventTitle}" not found in your calendar. Please add it first.`,
            });
          }

          const pickupAddress = params.pickupAddress || 
            (userLocation ? `${userLocation.lat},${userLocation.lng}` : 'Current Location');
          const dropoffAddress = event.address;
          const pickupTime = params.rideType === 'arrival' 
            ? new Date(new Date(event.startISO).getTime() - 90 * 60 * 1000).toISOString()
            : event.endISO;

          const basePrice = 45;

          setTimeout(() => {
            router.push({
              pathname: '/select-driver',
              params: {
                eventId: event.id,
                eventTitle: event.title,
                rideType: params.rideType,
                basePrice: basePrice.toString(),
                pickupAddress,
                dropoffAddress,
                pickupTime,
              },
            });
          }, 500);

          return JSON.stringify({
            success: true,
            message: `Opening ride booking for ${params.rideType === 'arrival' ? 'arrival to' : 'return from'} "${event.title}"`,
            estimatedPrice: `${basePrice}`,
            pickupTime: new Date(pickupTime).toLocaleString(),
          });
        },
      }),
    },
  });

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.unoAvatar}>
            <Text style={styles.unoAvatarText}>U</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Uno</Text>
            <Text style={styles.headerSubtitle}>Your 1Way Concierge</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
          onPress={() => setIsOpen(false)}
        >
          <X size={24} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              👋 Hi! I&apos;m Uno, your personal concierge.
            </Text>
            <Text style={styles.welcomeSubtext}>
              Ask me to find events, movies, restaurants, book rides, and more!
            </Text>
            <View style={styles.suggestions}>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => sendMessage('Find concerts this weekend')}
              >
                <Text style={styles.suggestionText}>🎵 Find concerts</Text>
              </Pressable>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => sendMessage('Budget a $150 date night for me')}
              >
                <Text style={styles.suggestionText}>💰 Budget date</Text>
              </Pressable>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => sendMessage('Show my upcoming events')}
              >
                <Text style={styles.suggestionText}>📅 My calendar</Text>
              </Pressable>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => sendMessage('Book me a ride to my next event')}
              >
                <Text style={styles.suggestionText}>🚗 Book ride</Text>
              </Pressable>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => sendMessage('Find movies playing this weekend')}
              >
                <Text style={styles.suggestionText}>🎬 Find movies</Text>
              </Pressable>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => sendMessage('Book a table for 2 at an Italian restaurant')}
              >
                <Text style={styles.suggestionText}>🍝 Book restaurant</Text>
              </Pressable>
            </View>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.unoBubble,
            ]}
          >
            {msg.parts.map((part, i) => {
              if (part.type === 'text') {
                return (
                  <Text
                    key={`${msg.id}-${i}`}
                    style={[
                      styles.messageText,
                      msg.role === 'user' && styles.userMessageText,
                    ]}
                  >
                    {part.text}
                  </Text>
                );
              }

              if (part.type === 'tool') {
                const toolName = part.toolName;

                switch (part.state) {
                  case 'input-streaming':
                  case 'input-available':
                    return (
                      <View key={`${msg.id}-${i}`} style={styles.toolThinking}>
                        <ActivityIndicator size="small" color="#1E3A8A" />
                        <Text style={styles.toolThinkingText}>
                          {toolName === 'findNearbyEvents' && 'Searching nearby events...'}
                          {toolName === 'getUserCalendar' && 'Checking your calendar...'}
                          {toolName === 'budgetDate' && 'Calculating budget...'}
                          {toolName === 'saveEventToCalendar' && 'Adding to calendar...'}
                          {toolName === 'getTicketLinks' && 'Finding tickets...'}
                          {toolName === 'bookRide' && 'Booking your ride...'}
                          {toolName === 'findMovies' && 'Searching for movies...'}
                          {toolName === 'bookMovieTickets' && 'Opening ticket booking...'}
                          {toolName === 'findRestaurants' && 'Finding restaurants...'}
                          {toolName === 'bookRestaurant' && 'Opening reservation page...'}
                        </Text>
                      </View>
                    );

                  case 'output-available':
                    return (
                      <View key={`${msg.id}-${i}`} style={styles.toolResult}>
                        <Text style={styles.toolResultText}>✓ Done</Text>
                      </View>
                    );

                  case 'output-error':
                    return (
                      <View key={`${msg.id}-${i}`} style={styles.toolError}>
                        <Text style={styles.toolErrorText}>Error: {part.errorText}</Text>
                      </View>
                    );
                }
              }

              return null;
            })}
          </View>
        ))}

        {error && (
          <View style={styles.errorBubble}>
            <Text style={styles.errorText}>Oops, something went wrong. Try again?</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Uno anything..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.sendButtonPressed,
              !input.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send size={20} color={input.trim() ? '#FFFFFF' : '#94A3B8'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
});

UnoChat.displayName = 'UnoChat';

export default UnoChat;

const styles = StyleSheet.create({
  chatContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    height: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unoAvatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1E293B',
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E3A8A',
    borderBottomRightRadius: 4,
  },
  unoBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  toolThinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  toolThinkingText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic' as const,
  },
  toolResult: {
    paddingVertical: 4,
  },
  toolResultText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600' as const,
  },
  toolError: {
    paddingVertical: 4,
  },
  toolErrorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  errorBubble: {
    alignSelf: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
});
