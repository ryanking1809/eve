import { silentUpdateEveStore, eveStore, fireEvents } from "./eveStore";

import { getEventIds, eventId } from "./eveEvents";
import { tracerCallbacks } from "./eveTracer";

export const eventHistoryListeners = new Map();
export const histories = {};

export const fireHistoryListeners = (event, type) => {
	getEventIds(event).forEach((eventId) => {
		eventHistoryListeners[eventId] &&
			eventHistoryListeners[eventId].size &&
			[...eventHistoryListeners[eventId]].forEach((reaction) => reaction(event, type));
	});
};

export const addHistoryListener = (
	{ op, path, exactPathMatch = false } = {},
	reaction
) => {
	const event = eventId(op, path, exactPathMatch);
	eventHistoryListeners[event] = eventHistoryListeners[event] || new Set();
	eventHistoryListeners[event].add(reaction);
	return createHistoryListenerRef([{ op, path, exactPathMatch }], reaction);
};

export const addHistoryListeners = (events, reaction) => {
	events.forEach((event) => addHistoryListener(event, reaction));
	return createHistoryListenerRef(events, reaction);
};

export const removeHistoryListener = (
	{ op, path, exactPathMatch = false } = {},
	reaction
) => {
	const event = eventId(op, path, exactPathMatch);
	eventHistoryListeners[event].delete(reaction);
	return createHistoryListenerRef([{ op, path, exactPathMatch }], reaction);
};

export const removeHistoryListeners = (events, reaction) => {
	events.forEach((event) => removeHistoryListener(event, reaction));
	return createHistoryListenerRef(events, reaction);
};

export const historyListenTo = (getListenerPaths, reaction) => {
	let listenerPaths = new Set();
	const addPaths = (path) => listenerPaths.add(path);
	tracerCallbacks.add(addPaths);
	getListenerPaths();
	tracerCallbacks.delete(addPaths);
	listenerPaths = [...listenerPaths].map((path) => ({ path }));
	addHistoryListeners(listenerPaths, reaction);
	return createHistoryListenerRef(listenerPaths, reaction);
};

const createHistoryListenerRef = (ids, reaction) => {
	return {
		ids,
		reaction,
		listen: () => addHistoryListeners(ids, reaction),
		destroy: () => removeHistoryListeners(ids, reaction),
	};
};

const undoHistories = events => {
  fireEvents(events.map(e => e.inverse), false, false);
  events.forEach((e) => fireHistoryListeners(e, "undo"));
  // Object.values(histories).forEach(hist => hist.undoEvents(events));
};

const redoHistories = events => {
  fireEvents(events, false, false);
  events.forEach((e) => fireHistoryListeners(e, "redo"));
  // Object.values(histories).forEach(hist => hist.redoEvents(events));
};

export const addToHistories = events => {
  events.forEach((e) => fireHistoryListeners(e, "add"));
  // Object.values(histories).forEach(hist => hist.addEvents(events));
};

export const eveHistory = {
  create: ({name, listenTo, eventIds}) => {
    silentUpdateEveStore(
      store =>
        (store.history[name] = {
          events: new Map(),
          undone: new Map()
        })
    );
    const history = {
      get raw() {
        return eveStore.history[name];
      },
      get events() {
        return this.raw.events;
      },
      get undone() {
        return this.raw.undone;
      },
      undo() {
        const latestEvents = Array.from(
          Array.from(this.events)[this.events.size - 1]?.[1].values() ?? []
        );
        undoHistories(latestEvents);
      },
      redo() {
        const latestUndoneEvents = Array.from(
          Array.from(this.undone)[this.undone.size - 1]?.[1].values() ?? []
        );
        redoHistories(latestUndoneEvents);
      },
      undoEvents(events) {
        let ownedEvents = [];
        events.forEach(event => {
          if (this.events.get(event.timestamp)?.get(event.id)) {
            ownedEvents.push(event);
          }
        });
        if (!ownedEvents.length) return;
        silentUpdateEveStore(store => {
          const self = store.history[name];
          ownedEvents.forEach(e => {
            const undoneAtTimestamp = self.undone.get(e.timestamp) || new Map();
            undoneAtTimestamp.set(e.id, e);
            store.history[name].undone.set(e.timestamp, undoneAtTimestamp);
            const eventsAtTimestamp = self.events.get(e.timestamp);
            eventsAtTimestamp.delete(e.id);
            if (!eventsAtTimestamp.size) self.events.delete(e.timestamp);
          });
        });
      },
      redoEvents(events) {
        let ownedEvents = [];
        events.forEach(event => {
          if (this.undone.get(event.timestamp)?.get(event.id)) {
            ownedEvents.push(event);
          }
        });
        if (!ownedEvents.length) return;
        silentUpdateEveStore(store => {
          const self = store.history[name];
          ownedEvents.forEach(e => {
            const eventsAtTimestamp = self.events.get(e.timestamp) || new Map();
            eventsAtTimestamp.set(e.id, e);
            store.history[name].events.set(e.timestamp, eventsAtTimestamp);
            const undoneAtTimestamp = self.undone.get(e.timestamp);
            undoneAtTimestamp.delete(e.id);
            if (!undoneAtTimestamp.size) self.undone.delete(e.timestamp);
          });
        });
      },
      addEvents(events) {
        if (eveStore.history[name]) {
          // console.log(eveStore.history[name]);
          silentUpdateEveStore(store => {
            const self = store.history[name];
            events.forEach(event => {
              const eventsAtTimestamp =
                self.events.get(event.timestamp) || new Map();
              eventsAtTimestamp.set(event.id, event);
              store.history[name].events.set(
                event.timestamp,
                eventsAtTimestamp
              );
            });
          });
        }
      }
    };
    const listen = (e, type) => {
      if (type === "add") {
        history.addEvents([e]);
      } else if (type === "undo") {
        history.undoEvents([e]);
      } else if (type === "redo") {
        history.redoEvents([e]);
      }
    };
    if (listenTo) {
      historyListenTo(listenTo, listen)
    }
    if (eventIds) {
      addHistoryListeners(eventIds, listen);
    }
    histories[name] = history;
    return history;
  }
};
