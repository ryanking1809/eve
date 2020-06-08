import {
	getEventIds,
	eventId,
	storeIdFromPath,
	storeFromId,
	eventIdToObject,
} from "./eveEvents";
import { tracerCallbacks } from "./eveTracer";

export const eventListeners = new WeakMap();

export const fireListeners = (event, type = "listen") => {
			let success = true;
			getEventIds(event, type).forEach((eventId) => {
				eventListeners[eventId] &&
					eventListeners[eventId].size &&
					[...eventListeners[eventId]].forEach((reaction) => {
						// used by intercepts to prevent events
						let result = reaction(event) ?? true;
						if (!result) success = false;
					});
			});
			return success;
		};

export const addListener = (
			{ op, store, storeId, prop, exactMatch = false } = {},
			reaction,
			type = "listen"
		) => {
			const event = eventId({
				op,
				store,
				storeId,
				prop,
				exactMatch,
				type
			});
			eventListeners[event] = eventListeners[event] || new Set();
			eventListeners[event].add(reaction);
			return createListenerRef(
				[{ op, store, storeId, prop, exactMatch }],
				reaction,
				type
			);
		};

export const addListeners = (events, reaction, type = "listen") => {
			events.forEach((event) => addListener(event, reaction, type));
			return createListenerRef(events, reaction);
		};

export const removeListener = (
			{ op, store, storeId, prop, exactMatch = false } = {},
			reaction,
			type = "listen"
		) => {
			const event = eventId({
				op,
				store,
				storeId,
				prop,
				exactMatch,
				type
			});
			eventListeners[event].delete(reaction);
			return createListenerRef(
				[{ op, store, storeId, prop, exactMatch }],
				reaction,
				type
			);
		};

export const removeListeners = (events, reaction, type = "listen") => {
			events.forEach((event) => removeListener(event, reaction, type));
			return createListenerRef(events, reaction, type);
		};

export const listenTo = (getListenerPaths, reaction, type="listen") => {
	const listenerIds = traceListenerIds(getListenerPaths);
	addListeners(listenerIds, reaction);
	return createListenerRef(listenerIds, reaction, type);
};

export const ignoreEvents = (getListenerPaths, reaction, type = "listen") => {
	const listenerIds = traceListenerIds(getListenerPaths);
	removeListeners(listenerIds, reaction);
	return createListenerRef(listenerIds, reaction, type);
};

export const traceListenerIds = (getObjects, op, returnVal = false) => {
	let listenerIds = [];
	const addPaths = (eId) => {
		let id = { ...eId };
		op && (id.op = op);
		listenerIds.push(id);
	};
	tracerCallbacks.add(addPaths);
	const val = getObjects();
	tracerCallbacks.delete(addPaths);
	if (val._tracer) {
		let vt = val._tracer;
		vt && (vt.op = op);
		listenerIds.push(vt);
	}
	Array.isArray(val) && val.forEach(v => {
		if (v._tracer) {
			let vt = v._tracer;
			vt && (vt.op = op);
			listenerIds.push(vt);
		}
	})
	return returnVal ? [val, listenerIds] : listenerIds;
}

const createListenerRef = (ids, reaction, type = "listen") => {
	return {
		ids,
    reaction,
    type,
		listen: () => addListeners(ids, reaction),
		destroy: () => removeListeners(ids, reaction),
	};
};
