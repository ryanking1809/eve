import { getEventIds, eventId } from "./eveEvents";
import { tracerCallbacks } from "./eveTracer";

export const eventListeners = new WeakMap();

export const fireListeners = (event, type = "react") => {
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
			{ op, path, exactPathMatch = false } = {},
			reaction,
			type = "react"
		) => {
			const event = eventId(op, path, exactPathMatch, type);
			eventListeners[event] = eventListeners[event] || new Set();
			eventListeners[event].add(reaction);
			return createListenerRef(
				[{ op, path, exactPathMatch }],
				reaction,
				type
			);
		};

export const addListeners = (events, reaction, type = "react") => {
			events.forEach((event) => addListener(event, reaction, type));
			return createListenerRef(events, reaction);
		};

export const removeListener = (
	{ op, path, exactPathMatch = false } = {},
  reaction,
  type="react"
) => {
	const event = eventId(op, path, exactPathMatch, type);
	eventListeners[event].delete(reaction);
  return createListenerRef([{ op, path, exactPathMatch }], reaction, type);
};

export const removeListeners = (events, reaction, type = "react") => {
			events.forEach((event) => removeListener(event, reaction, type));
			return createListenerRef(events, reaction, type);
		};

export const listenTo = (getListenerPaths, reaction, type="react") => {
	const listenerIds = traceListenerIds(getListenerPaths);
	addListeners(listenerIds, reaction);
	return createListenerRef(listenerIds, reaction, type);
};

export const traceListenerIds = (getObjects) => {
	if (typeof getObjects === "function") return traceListenerIdsFromFunction(
												getObjects,
												null
											);
	let listenerIds = [];
	["add", "replace", "remove"].forEach(op => {
		op &&
			listenerIds.push(
				...traceListenerIdsFromFunction(getObjects[op], op)
			);
	})
	return listenerIds;
};

export const traceListenerIdsFromFunction = (getObjects, op, returnVal = false) => {
	let listenerPaths = new Set();
	const addPaths = (path) => listenerPaths.add(path);
	tracerCallbacks.add(addPaths);
	const val = getObjects();
	tracerCallbacks.delete(addPaths);
	val._path && listenerPaths.add(val._path);
	Array.isArray(val) && val.forEach(v => {
		v._path && listenerPaths.add(v._path);
	})
	const listenerIds = [...listenerPaths].map((path) => {
		let id = { path };
		op && (id.op = op);
		return id;
	});
	return returnVal ? [val, listenerIds] : listenerIds;
}

const createListenerRef = (ids, reaction, type = "react") => {
	return {
		ids,
    reaction,
    type,
		listen: () => addListeners(ids, reaction),
		destroy: () => removeListeners(ids, reaction),
	};
};
