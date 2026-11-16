import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import {
  timeValidationService,
  TimeValidationState,
} from "@/services/time/timeValidation.service";
import DateInaccurateScreen from "@/components/common/DateInaccurateScreen";

interface TimeValidationContextType {
  isInaccurate: boolean;
  recheckTime: () => Promise<boolean>;
}

const TimeValidationContext = createContext<TimeValidationContextType>({
  isInaccurate: false,
  recheckTime: async () => false,
});

export const useTimeValidation = () => useContext(TimeValidationContext);

interface Props {
  children: ReactNode;
}

export const TimeValidationProvider: React.FC<Props> = ({ children }) => {
  const [state, setState] = useState<TimeValidationState>(
    timeValidationService.getState()
  );

  useEffect(() => {
    // 1. Subscribe to time validation service state updates
    const unsubscribe = timeValidationService.subscribe((newState) => {
      setState(newState);
    });

    // 2. Initial check on app startup
    timeValidationService.checkServerTime();

    // 3. Re-check whenever the app returns to foreground (e.g. after user adjusts their date in Settings)
    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        timeValidationService.checkServerTime();
      }
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, []);

  return (
    <TimeValidationContext.Provider
      value={{
        isInaccurate: state.isInaccurate,
        recheckTime: () => timeValidationService.checkServerTime(),
      }}
    >
      {state.isInaccurate ? (
        <DateInaccurateScreen
          deviceTime={state.deviceTime}
          isChecking={state.isChecking}
          onAdjustDate={() => timeValidationService.openDateSettings()}
          onCheckAgain={() => timeValidationService.checkServerTime()}
        />
      ) : (
        children
      )}
    </TimeValidationContext.Provider>
  );
};

export default TimeValidationProvider;
