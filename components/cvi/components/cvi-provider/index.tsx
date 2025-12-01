import { DailyCall } from "@daily-co/react-native-daily-js";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface CVIContextType {
	callObject: DailyCall | null;
	setCallObject: (call: DailyCall | null) => void;
}

const CVIContext = createContext<CVIContextType | undefined>(undefined);

export const useDailyContext = () => {
	const context = useContext(CVIContext);
	if (!context) {
		throw new Error("useDailyContext must be used within CVIProvider");
	}
	return context;
};

export const CVIProvider = ({ children }: { children: ReactNode }) => {
	const [callObject, setCallObject] = useState<DailyCall | null>(null);

	const value = useMemo(() => ({ callObject, setCallObject }), [callObject]);

	return <CVIContext.Provider value={value}>{children}</CVIContext.Provider>;
};
