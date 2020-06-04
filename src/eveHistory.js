import { silentUpdateEveStore, eveStore, fireEvents } from "./eveStore";
import { fireListeners, addListeners } from "./eveListeners";

export const histories = {};

const undoHistories = events => {
  fireEvents(events.map(e => e.inverse), false, false);
  events.forEach((e) => fireListeners(e, "undoHistory"));
};

const redoHistories = events => {
  fireEvents(events, false, false);
  events.forEach((e) => fireListeners(e, "redoHistory"));
};

export const addToHistories = events => {
  events.forEach((e) => fireListeners(e, "addToHistory"));
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
    const listenAdd = (e) => history.addEvents([e]);
    const listenUndo = (e) => history.undoEvents([e]);
    const listenRedo = (e) => history.redoEvents([e]);
    if (listenTo) {
      listenTo(listenTo, listenAdd, "addToHistory");
      listenTo(listenTo, listenUndo, "undoHistory");
      listenTo(listenTo, listenRedo, "redoHistory");
    }
    if (eventIds) {
      addListeners(eventIds, listenAdd, "addToHistory");
      addListeners(eventIds, listenUndo, "undoHistory");
      addListeners(eventIds, listenRedo, "redoHistory");
    }
    histories[name] = history;
    return history;
  }
};
