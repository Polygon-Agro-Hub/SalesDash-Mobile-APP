import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { APP_UPDATE_CONFIG } from './config';
import { getInstalledVersion, getOsVersion, getPlatform, openStore } from './device';
import { isSnoozed, setSnoozed } from './snooze';
import { UpdatePrompt } from './UpdatePrompt';
import {
  decideUpdate,
  fetchUpdatePolicy,
  type UpdateDecision,
  type UpdateMessages,
} from './updatePolicy';

interface AppUpdateContextType {
  checkForUpdate: () => Promise<void>;
}

const AppUpdateContext = createContext<AppUpdateContextType>({
  checkForUpdate: async () => {},
});

export const useAppUpdate = (): AppUpdateContextType => useContext(AppUpdateContext);

interface AppUpdateProviderProps {
  children: ReactNode;
}

export function AppUpdateProvider({ children }: AppUpdateProviderProps) {
  const [decision, setDecision] = useState<UpdateDecision>({ kind: 'none' });
  const [messages, setMessages] = useState<UpdateMessages | undefined>(undefined);
  const [promptVisible, setPromptVisible] = useState(false);

  const isChecking = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (isChecking.current) return;
    isChecking.current = true;

    try {
      const url = APP_UPDATE_CONFIG.policyUrl;
      if (__DEV__) {
        console.log('[AppUpdate] 🔄 Checking policy from:', url);
      }

      const policy = await fetchUpdatePolicy(url, APP_UPDATE_CONFIG.timeoutMs);

      if (!policy) {
        if (__DEV__) {
          console.warn('[AppUpdate] ⚠️ Policy fetch returned null or network error. (URL:', url, ')');
        }
        return;
      }

      const platform = getPlatform();
      const installedVersion = getInstalledVersion();
      const osVersion = getOsVersion();

      if (__DEV__) {
        console.log('[AppUpdate] 📱 Platform:', platform, '| Installed Version:', installedVersion);
        console.log('[AppUpdate] 📋 Policy Rules:', policy[platform]);
      }

      const result = decideUpdate({
        policy,
        platform,
        installedVersion,
        osVersion,
      });

      if (__DEV__) {
        console.log('[AppUpdate] 🎯 Decision:', result);
      }

      if (result.kind === 'none') {
        setPromptVisible(false);
        setDecision(result);
        return;
      }

      // If soft update, check if it was snoozed
      if (result.kind === 'soft') {
        const snoozed = await isSnoozed(result.latestVersion);
        if (snoozed) {
          if (__DEV__) {
            console.log('[AppUpdate] ⏱️ Version', result.latestVersion, 'is currently snoozed.');
          }
          return;
        }
      }

      setMessages(policy.messages);
      setDecision(result);
      setPromptVisible(true);
    } catch (error) {
      if (__DEV__) {
        console.error('[AppUpdate] ❌ Error in checkForUpdate:', error);
      }
    } finally {
      isChecking.current = false;
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkForUpdate();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkForUpdate]);

  const handleUpdate = useCallback(() => {
    openStore();
  }, []);

  const handleLater = useCallback(async () => {
    if (decision.kind === 'soft') {
      await setSnoozed(decision.latestVersion);
    }
    setPromptVisible(false);
  }, [decision]);

  return (
    <AppUpdateContext.Provider value={{ checkForUpdate }}>
      {children}
      {decision.kind !== 'none' && (
        <UpdatePrompt
          visible={promptVisible}
          mode={decision.kind}
          installedVersion={decision.installedVersion}
          latestVersion={decision.latestVersion}
          messages={messages}
          onUpdate={handleUpdate}
          onLater={handleLater}
        />
      )}
    </AppUpdateContext.Provider>
  );
}
