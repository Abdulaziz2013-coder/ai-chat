export type AvatarMood = 'idle' | 'thinking' | 'speaking' | 'proud';

export type ModelStyle = 'cyber_robot' | 'quantum_core' | 'holo_orb';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isCreatorMentioned?: boolean;
}

export interface VoiceSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  selectedVoiceName?: string;
}

export interface ServerInfo {
  serverName: string;
  creator: string;
  status: 'online' | 'busy' | 'offline';
  pingMs: number;
}
