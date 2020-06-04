import produce, {
  produceWithPatches,
  applyPatches,
  enableAllPlugins
} from "immer";
import { fireListeners } from "./eveListeners";
import { fireInterceptors } from "./eveInterceptors";
import cuid from "cuid";
import { addToHistories } from "./eveHistory";
import { stringify, parse } from "deserializable";
enableAllPlugins();

export let eveStore = {
			_session: {
				id: cuid(),
				ts: Date.now(),
				log: [],
			},
			history: {},
			models: {},
			collections: {},
		};

export const replaySnapshot = (snapshot, speed = 1) => {
  silentUpdateEveStore(
		(store) => {
      Object.keys(store.models)
      .forEach(m => Object.keys(store.models[m])
        .forEach(i => delete store.models[m][i])
      )
    });
  silentUpdateEveStore((store) => {
		Object.keys(store.models).forEach((m) =>
			delete store.models[m]
    );
    Object.keys(store.models).forEach((m) => delete store.history[m]);
    Object.keys(store.models).forEach((m) => delete store.collections[m]);
    store._session = {
      id: cuid(),
      ts: Date.now(),
      log: [],
    };
	});
  snapshot = parse(snapshot);
  snapshot._session.log.forEach(event => {
    setTimeout(
      () => fireEvent(event, false, event.history),
      (event.timestamp - snapshot._session.ts) / speed
    );
  });
};

export const getSnapshot = () => {
  return stringify(eveStore);
};

export const updateEveStore = updateFunc => {
  const [_, patches, inversePatches] = produceWithPatches(
    eveStore,
    store => void updateFunc(store)
  );
  firePatchEvents(patches, inversePatches);
};

export const silentUpdateEveStore = updateFunc => {
  const [_, patches, inversePatches] = produceWithPatches(
    eveStore,
    store => void updateFunc(store)
  );
  firePatchEvents(patches, inversePatches, false);
};

const invisibleUpdateEveStore = updateFunc => {
  eveStore = produce(eveStore, store => void updateFunc(store));
};

const firePatchEvents = (patches, inversePatches, recordHistory = true) => {
  let events = [];
  patches.forEach((p, i) => {
    const event = {
      ...p,
      inverse: inversePatches[i]
    };
    if (fireListeners(event, "intercept")) {
      events.push(event);
    }
  });
  fireEvents(events, true, recordHistory);
};

export const fireEvents = (
  events,
  skipInterceptors = false,
  recordHistory = true
) => {
  let approvedEvents = [];
  const ts = Date.now();
  events.forEach(e => {
    const event = {
      ...e,
      history: recordHistory,
      timestamp: ts,
      id: cuid()
    };
    if (skipInterceptors || fireListeners(e, "intercept")) {
		approvedEvents.push(event);
	}
  });
  eveStore = applyPatches(eveStore, approvedEvents);
  invisibleUpdateEveStore(
    store => void store._session.log.push(...approvedEvents)
  );
  if (recordHistory) addToHistories(approvedEvents);
  approvedEvents.forEach(e => fireListeners(e, "react"));
};

export const fireEvent = (
  event,
  skipInterceptors = false,
  recordHistory = true
) => {
  fireEvents([event], skipInterceptors, recordHistory);
};
