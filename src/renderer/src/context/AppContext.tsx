import React, { createContext, useContext, useReducer } from 'react';
import type { AgentMessage, Settings, SessionMeta } from '@shared/ipc';

// ---- Chat State ----
interface ChatState {
  messages: AgentMessage[]
  isProcessing: boolean
  currentSkill: string | null
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; message: AgentMessage }
  | { type: 'UPDATE_LAST_ASSISTANT'; content: string }
  | { type: 'SET_PROCESSING'; value: boolean }
  | { type: 'SET_SKILL'; name: string | null }
  | { type: 'CLEAR_MESSAGES' }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
	switch (action.type) {
		case 'ADD_MESSAGE':
			return { ...state, messages: [...state.messages, action.message] };
		case 'UPDATE_LAST_ASSISTANT': {
			const msgs = [...state.messages];
			for (let i = msgs.length - 1; i >= 0; i--) {
				if (msgs[i].role === 'assistant') {
					msgs[i] = { ...msgs[i], content: action.content };
					break;
				}
			}
			return { ...state, messages: msgs };
		}
		case 'SET_PROCESSING':
			return { ...state, isProcessing: action.value };
		case 'SET_SKILL':
			return { ...state, currentSkill: action.name };
		case 'CLEAR_MESSAGES':
			return { ...state, messages: [] };
		default:
			return state;
	}
}

// ---- Session State ----
interface SessionState {
  sessions: SessionMeta[]
  activeSessionId: string | null
}

type SessionAction =
  | { type: 'SET_SESSIONS'; sessions: SessionMeta[] }
  | { type: 'SET_ACTIVE_SESSION'; id: string }
  | { type: 'ADD_SESSION'; session: SessionMeta }
  | { type: 'REMOVE_SESSION'; id: string }

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
	switch (action.type) {
		case 'SET_SESSIONS':
			return { ...state, sessions: action.sessions };
		case 'SET_ACTIVE_SESSION':
			return { ...state, activeSessionId: action.id };
		case 'ADD_SESSION':
			return { ...state, sessions: [action.session, ...state.sessions] };
		case 'REMOVE_SESSION':
			return {
				...state,
				sessions: state.sessions.filter(s => s.id !== action.id),
			};
		default:
			return state;
	}
}

// ---- Settings State ----
interface SettingsState {
  settings: Settings
}

type SettingsAction =
  | { type: 'SET_SETTINGS'; settings: Settings }
  | { type: 'UPDATE_SETTINGS'; partial: Partial<Settings> }

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
	switch (action.type) {
		case 'SET_SETTINGS':
			return { settings: action.settings };
		case 'UPDATE_SETTINGS':
			return { settings: { ...state.settings, ...action.partial } };
		default:
			return state;
	}
}

// ---- Combined Context ----
interface AppState {
  chat: ChatState
  session: SessionState
  settings: SettingsState
}

type AppAction =
  | { domain: 'chat'; action: ChatAction }
  | { domain: 'session'; action: SessionAction }
  | { domain: 'settings'; action: SettingsAction }

function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.domain) {
		case 'chat':
			return { ...state, chat: chatReducer(state.chat, action.action) };
		case 'session':
			return { ...state, session: sessionReducer(state.session, action.action) };
		case 'settings':
			return { ...state, settings: settingsReducer(state.settings, action.action) };
		default:
			return state;
	}
}

const initialState: AppState = {
	chat: {
		messages: [],
		isProcessing: false,
		currentSkill: null,
	},
	session: {
		sessions: [],
		activeSessionId: null,
	},
	settings: {
		settings: {
			language: 'zh-CN',
			theme: 'light',
			model: 'claude-sonnet-4-20250514',
			apiKeyConfigured: false,
		},
	},
};

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(appReducer, initialState);
	return (
		<AppContext.Provider value={{ state, dispatch }}>
			{children}
		</AppContext.Provider>
	);
}

export function useAppContext() {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error('useAppContext must be used within AppProvider');
	return ctx;
}
