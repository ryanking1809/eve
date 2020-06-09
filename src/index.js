import { eveState as eState, stateSnapshot, serializedSnapshot, applySnapshot, replaySnapshot, applySerializedSnapshot, replaySerializedSnapshot, resetState } from "./eveState"
import {
	listenTo,
	ignoreEvents,
	fireListeners,
} from "./eveEvents/eveListeners";
export * from "./eveStores/index";
export { eveHistory } from "./eveHistory";
export * from "./frameworks/react";

export const eveState = {
			get raw() {
				return eState;
			},
			snapshot: stateSnapshot,
			serializedSnapshot: serializedSnapshot,
			applySnapshot: applySnapshot,
			replaySnapshot: replaySnapshot,
			applySerializedSnapshot: applySerializedSnapshot,
			replaySerializedSnapshot: replaySerializedSnapshot,
			reset: resetState,
		};
        
export const eveEvents = {
			listenTo: listenTo,
			ignore: ignoreEvents,
			// fire: fireListeners make listenTo except events not just objects
		};