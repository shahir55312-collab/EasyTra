import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Train, Menu, Compass } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import SettingsPanel from './components/SettingsPanel';
import { sendMessageToGemini } from './services/geminiService';
import { ChatMessage as ChatMessageType, UserPreferences } from './types';

// Helper: Calculate distance between two coordinates (Haversine Formula)
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Return in meters
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

function App() {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "**Hi there! I'm EasyTra!** 👋\n\nI'm here to help you breeze through the city! I'll check live traffic 🚦, service alerts, and crowd levels to find the absolute best route for you.\n\nWhere are you headed today? 🌍",
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Default User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    routePreference: 'FASTEST',
    accessibilityRequired: false,
    useCurrentLocation: true,
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Ref to track last update to implement jitter filter without re-renders
  const lastLocationRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch User Location (Optimized for Battery & Jitter Reduction)
  useEffect(() => {
    let watchId: number;

    if (preferences.useCurrentLocation && "geolocation" in navigator) {
      const geoOptions = {
        enableHighAccuracy: true, // Needed for precise navigation
        timeout: 20000,
        maximumAge: 10000         // Accept cached positions up to 10s old to save battery
      };

      const success = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        const now = Date.now();
        
        // JITTER FILTER & OPTIMIZATION LOGIC
        // 1. Always accept the very first fix
        // 2. Otherwise, check distance moved and time elapsed
        let shouldUpdate = false;

        if (!lastLocationRef.current) {
          shouldUpdate = true;
        } else {
          const dist = getDistanceFromLatLonInMeters(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            latitude,
            longitude
          );

          // Update if moved > 20 meters (reduces jitter/dancing marker)
          // OR if it's been > 60 seconds (ensures freshness even if stationary)
          // OR if accuracy improved significantly (optional heuristic, keeping it simple here)
          if (dist > 20 || (now - lastLocationRef.current.timestamp > 60000)) {
            shouldUpdate = true;
            // console.log(`Significant movement detected: ${Math.round(dist)}m`);
          }
        }

        if (shouldUpdate) {
          lastLocationRef.current = { lat: latitude, lng: longitude, timestamp: now };
          setUserLocation({ lat: latitude, lng: longitude });
          // console.log(`Location state updated: ${latitude}, ${longitude}`);
        }
      };

      const error = (err: GeolocationPositionError) => {
        console.warn(`Location warning (${err.code}): ${err.message}`);
        // Only try fallback if we have NO location at all yet
        if (!lastLocationRef.current && err.code === err.TIMEOUT) {
           console.log("High accuracy timed out, attempting fallback...");
           navigator.geolocation.getCurrentPosition(
             (pos) => {
               lastLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now() };
               setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
             },
             (e) => console.error("Fallback location failed:", e.message),
             { enableHighAccuracy: false, timeout: 10000 }
           );
        }
      };

      watchId = navigator.geolocation.watchPosition(success, error, geoOptions);
    }

    // Cleanup watcher on unmount or pref change
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      // We don't clear lastLocationRef here so that if the user toggles a setting 
      // and comes back, we don't start from scratch (optional choice)
    };
  }, [preferences.useCurrentLocation]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessageType = {
      id: uuidv4(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Pass the userLocation to the service
      const response = await sendMessageToGemini(messages, text, preferences, userLocation);
      
      const botMsg: ChatMessageType = {
        id: uuidv4(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        groundingChunks: response.groundingChunks
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessageType = {
        id: uuidv4(),
        role: 'model',
        text: "I'm having trouble accessing the network right now. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Train size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">EasyTra</h1>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative group"
            title="Preferences"
          >
            <Menu size={24} />
            {preferences.accessibilityRequired && (
               <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
            )}
          </button>
        </div>
        
        {/* Active Preference Indicator Bar */}
        <div className="bg-indigo-50/50 border-b border-indigo-100 text-xs py-1.5 px-4 text-center text-indigo-800 flex justify-center items-center gap-2">
           <Compass size={12} />
           <span>Optimizing for: <strong>{preferences.routePreference.replace('_', ' ')}</strong></span>
           {userLocation && <span className="text-indigo-600 font-semibold">• GPS Active</span>}
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex w-full gap-4 py-6 bg-slate-50/50 opacity-70">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <BotIcon />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea onSend={handleSendMessage} isLoading={isLoading} />

      {/* Settings Modal */}
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdate={setPreferences}
      />
    </div>
  );
}

// Simple internal icon component to avoid circular deps or complexity
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);

export default App;