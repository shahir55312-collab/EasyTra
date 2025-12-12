export type Role = 'user' | 'model';

export type RoutePreference = 'FASTEST' | 'LEAST_CROWDED' | 'LOW_WALKING' | 'FEWEST_TRANSFERS';

export interface UserPreferences {
  routePreference: RoutePreference;
  accessibilityRequired: boolean;
  useCurrentLocation: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isError?: boolean;
  groundingChunks?: GroundingChunk[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
}