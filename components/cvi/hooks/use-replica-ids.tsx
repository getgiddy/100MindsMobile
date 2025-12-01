import { useEffect, useState } from "react";
import { useDailyContext } from "../components/cvi-provider";

export const useReplicaIDs = (): string[] => {
	const { callObject } = useDailyContext();
	const [replicaIds, setReplicaIds] = useState<string[]>([]);

	useEffect(() => {
		if (!callObject) return;

		const updateReplicaIds = () => {
			const participants = callObject.participants();
			const replicas = Object.entries(participants)
				.filter(([_, participant]) =>
					participant.user_id?.includes("tavus-replica")
				)
				.map(([sessionId, _]) => sessionId);

			setReplicaIds(replicas);
		};

		// Initial update
		updateReplicaIds();

		// Listen for participant changes
		callObject.on("participant-joined", updateReplicaIds);
		callObject.on("participant-left", updateReplicaIds);
		callObject.on("participant-updated", updateReplicaIds);

		return () => {
			callObject.off("participant-joined", updateReplicaIds);
			callObject.off("participant-left", updateReplicaIds);
			callObject.off("participant-updated", updateReplicaIds);
		};
	}, [callObject]);

	return replicaIds;
};
