import Daily from "@daily-co/react-native-daily-js";
import { useCallback, useEffect, useRef } from "react";
import { useDailyContext } from "../components/cvi-provider";

export const useCVICall = (): {
	joinCall: (props: { url: string }) => Promise<void>;
	leaveCall: () => Promise<void>;
} => {
	const { callObject, setCallObject } = useDailyContext();
	const callObjectRef = useRef(callObject);

	// Keep ref in sync with state
	useEffect(() => {
		callObjectRef.current = callObject;
	}, [callObject]);

	const joinCall = useCallback(
		async ({ url }: { url: string }) => {
			if (callObjectRef.current) {
				await callObjectRef.current.destroy();
			}

			const newCallObject = Daily.createCallObject();
			setCallObject(newCallObject);

			await newCallObject.join({
				url: url,
			});
		},
		[setCallObject]
	);

	const leaveCall = useCallback(async () => {
		if (callObjectRef.current) {
			await callObjectRef.current.leave();
			await callObjectRef.current.destroy();
			setCallObject(null);
		}
	}, [setCallObject]);

	return { joinCall, leaveCall };
};
