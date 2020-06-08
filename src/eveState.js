import produce, {
  produceWithPatches,
  applyPatches,
  enableAllPlugins
} from "immer";
import { fireListeners } from "./eveEvents/eveListeners";
import { addToHistories } from "./eveHistory";
import { stringify, parse } from "deserializable";
import cuid from "cuid";
import { storeIdFromPath } from "./eveEvents/eveEvents";
enableAllPlugins();

export let eveState = {
			_session: {
				id: cuid(),
				ts: Date.now(),
				log: [],
			},
			history: {},
			stores: {},
    };
    
export const replaySerializedSnapshot = (snapshot, speed = 1) => {
  applySnapshot(parse(snapshot), speed);
};

export const applySerializedSnapshot = (snapshot, speed) => {
	applySnapshot(parse(snapshot), speed);
};
    
export const replaySnapshot = (snapshot, speed=1) => {
  applySnapshot(snapshot, speed);
};

export const applySnapshot = (snapshot, speed) => {
  resetState()
  if(speed) {
    snapshot._session.log.forEach((event) => {
			setTimeout(
				() => fireEvent(event, false, event.history),
				(event.timestamp - snapshot._session.ts) / speed
			);
	  });
  } else {
    snapshot._session.log.forEach((event) => {
      fireEvent(event, false, event.history)
    });
  }
};

export const resetState = () => {
			silentUpdateEveState((state) => {
				Object.keys(state.stores).forEach((m) =>
					Object.keys(state.stores[m]).forEach(
						(i) => delete state.stores[m][i]
					)
				);
			});
			silentUpdateEveState((state) => {
				Object.keys(state.stores).forEach(
					(m) => delete state.stores[m]
				);
				Object.keys(state.history).forEach(
					(m) => delete state.history[m]
				);
				state._session = {
					id: cuid(),
					ts: Date.now(),
					log: [],
				};
			});
		};

export const stateSnapshot = () => {
	return parse(serializedSnapshot());
};

export const serializedSnapshot = () => {
  return stringify(eveState);
};

export const updateEveState = updateFunc => {
  const [_, patches, inversePatches] = produceWithPatches(
    eveState,
    state => void updateFunc(state)
  );
  firePatchEvents(patches, inversePatches);
};

export const silentUpdateEveState = updateFunc => {
  const [_, patches, inversePatches] = produceWithPatches(
    eveState,
    state => void updateFunc(state)
  );
  firePatchEvents(patches, inversePatches, false);
};

const invisibleUpdateEveState = updateFunc => {
  eveState = produce(eveState, state => void updateFunc(state));
};

const firePatchEvents = (patches, inversePatches, recordHistory = true) => {
  let events = [];
  patches.forEach((p, i) => {
    const event = {
      ...p,
      inverse: inversePatches[i],
      ...storeIdFromPath(p.path)
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
  eveState = applyPatches(eveState, approvedEvents);
  invisibleUpdateEveState(
    state => void state._session.log.push(...approvedEvents)
  );
  if (recordHistory) addToHistories(approvedEvents);
  approvedEvents.forEach(e => fireListeners(e, "listen"));
};

export const fireEvent = (
  event,
  skipInterceptors = false,
  recordHistory = true
) => {
  fireEvents([event], skipInterceptors, recordHistory);
};
