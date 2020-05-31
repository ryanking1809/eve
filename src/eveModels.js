import cuid from "cuid";
import { eveStore, updateEveStore, silentUpdateEveStore } from "./eveStore";
import { listenTo, addListeners, fireListeners, addListener } from "./eveListeners";
import { fireTracerCallbacks } from "./eveTracer";
import {
  fireInterceptors,
  addInterceptors,
  intercept
} from "./eveInterceptors";
import { BinaryMap, GroupedSet, BinarySet } from "./BinaryMap";
import { eveHistory } from "./eveHistory";

export const eveModels = {};
export const eveCollections = {};

export const model = (name, modelDef) => {
  silentUpdateEveStore(store => (store.models[name] = {}));
  addListener({op: "add", path: ["models", name], exactPathMatch: false}, e => {
    if (e.path.length === 3 && !eveModels[name].instances.get(e.path[2])) {
      eveModels[name].instances.set(
        e.path[2],
        createObjectFromRawData(eveStore.models[name][e.path[2]])
      );
    }
  })
  const createObjectFromRawData = (rawObj) => {
    let obj = {
      id: rawObj.id,
      _modelName: name,
      _def: modelDef,
      _path: ["models", name, rawObj.id],
      _listeners: {},
      _interceptors: {},
      getSource: () => eveStore,
      get _model() {
        return eveModels[name];
      },
      get raw() {
        return this.getSource().models[name][this.id] || {};
      },
      update(updater) {
        updateEveStore((store) => {
          obj.getSource = () => store;
          updater(store.models[name][this.id]);
          obj.getSource = () => eveStore;
        });
      },
      destroy() {
        this._model.destroy(this.id);
      },
      removeListeners() {
        Object.values(this._listeners).forEach((l) => l.destroy());
        Object.values(this._interceptors).forEach((l) => l.destroy());
      },
    };
    modelDef.state && addRawStateToObject(obj, modelDef.state);
    modelDef.props && addPropsToObject(obj, modelDef.props);
    modelDef.derivatives && addDerivativesToObject(obj, modelDef.derivatives);
    modelDef.actions && addActionsToObject(obj, modelDef.actions);
    modelDef.reactions && addReactionsToObject(obj, modelDef.reactions);
    modelDef.retroactions && addRetroactionsToObject(obj, modelDef.retroactions);
    return obj;
  };
  const modelClass = {
		_name: name,
    _path: ["models", name],
    _def: modelDef,
		instances: new Map(),
		create(...args) {
			let rawObj = { ...modelDef.state };
			modelDef.constructor(rawObj, ...args);
			rawObj.modelName = name;
      rawObj.id = rawObj.id || cuid();
      this.instances.set(rawObj.id, createObjectFromRawData(rawObj));
      updateEveStore((store) => (store.models[name][rawObj.id] = rawObj));
      return this.instances.get(rawObj.id);
		},
		destroy(id) {
      this.instances.get(id).removeListeners();
      updateEveStore((store) => {
        delete store.models[name][id];
      });
      this.instances.delete(id);
    },
		get(id) {
      if (this.instances.get(id)) return this.instances.get(id);
      if (eveStore.models[name]?.[id]) {
        this.instances.set(
          id,
          createObjectFromRawData(eveStore.models[name][id])
        );
        return this.instances.get(id);
      }
    },
  };
  eveModels[name] = modelClass;
  return modelClass;
};

export const collection = (name, collectionDef) => {
  silentUpdateEveStore((store) => (store.collections[name] = {}));
  let rawObj = { ...collectionDef.state };
  rawObj.modelName = name;
  rawObj.id = rawObj.id || cuid();
  updateEveStore((store) => (store.collections[name] = rawObj));
  let obj = {
		_collectionName: name,
		_path: ["collections", name],
		_def: collectionDef,
		_listeners: {},
		_interceptors: {},
		getSource: () => eveStore,
		get raw() {
			return this.getSource().collections[name] || {};
		},
		update(updater) {
			updateEveStore((store) => {
				obj.getSource = () => store;
				updater(store.collections[name]);
				obj.getSource = () => eveStore;
			});
		},
		destroy() {
			this._model.destroy(this.id);
		},
		removeListeners() {
			Object.values(this._listeners).forEach((l) => l.destroy());
			Object.values(this._interceptors).forEach((l) => l.destroy());
		},
  };
  collectionDef.state && addRawStateToObject(obj, collectionDef.state);
  collectionDef.props && addPropsToObject(obj, collectionDef.props);
  collectionDef.derivatives && addDerivativesToObject(obj, collectionDef.derivatives);
  collectionDef.actions && addActionsToObject(obj, collectionDef.actions);
  collectionDef.reactions && addReactionsToObject(obj, collectionDef.reactions);
  collectionDef.retroactions && addRetroactionsToObject(obj, collectionDef.retroactions);
  eveCollections[name] = obj;
  return obj;
}

export const derivatives = {
  modelRef: ({modelName, refProp}) => {
    return {
		eventIds: (self) => [{ path: ["models", modelName, self[refProp]] }],
		compute: (self) => eveModels[modelName].get(self[refProp]),
	};
  },
  modelList: ({modelName, filter, transformer, sort, listeners}) => {
    return {
      custom: (self, prop) => {
        let items = sort
			? new BinarySet([], (a, b) =>
					sort(
						eveModels[modelName].get(a),
						eveModels[modelName].get(b)
					)
			  )
			: new Set();
        Object.defineProperty(self, prop, {
          get: () => items,
        });
        const newItemListener = addListener(
          { op: "add", path: ["models", modelName], exactPathMatch: false },
          (e) => {
            if (e.path.length === 3) {
              const newInst = eveModels[modelName].get(e.path[2]);
              if(!filter || filter(newInst)) {
                items.add(
                  newInst
                );
              }
            }
          }
        );
        // add condition if listeners
        const updateItemListener = addListener(
          { path: ["models", modelName], exactPathMatch: false },
          (e) => {
            if (e.path.length > 3) {
              const inst = eveModels[modelName].get(e.path[2]);
              if (!filter || filter(inst)) {
                items.add(
                  inst
                );
              } else {
                items.delete(inst);
              }
            }
          }
        );
        const destroyItemListener = addListener(
          { op: "remove", path: ["models", modelName], exactPathMatch: false },
          (e) => {
            const inst = eveModels[modelName].get(e.path[2]);
            if (e.path.length === 3) {
              items.delete(inst);
            }
          }
        );
        self._listeners[`${prop}-add`] = newItemListener;
        self._listeners[`${prop}-update`] = updateItemListener;
        self._listeners[`${prop}-destroy`] = destroyItemListener;
      }
    };
  },
  modelLookup: ({modelName, key, filter, transformer, sort, listeners}) => {
    return {
      custom: (self, prop) => {
        let items = sort
			? new BinaryMap([], (a, b) =>
					sort(
						eveModels[modelName].get(a),
						eveModels[modelName].get(b)
					)
			  )
			: new Map();
        Object.defineProperty(self, prop, {
          get: () => items,
        });
        const newItemListener = addListener(
          { op: "add", path: ["models", modelName], exactPathMatch: false },
          (e) => {
            if (e.path.length === 3) {
              const newInst = eveModels[modelName].get(e.path[2]);
              if(!filter || filter(newInst)) {
                items.set(
                  key(newInst),
                  newInst
                );
              }
            }
          }
        );
        // add condition if listeners
        const updateItemListener = addListener(
          { path: ["models", modelName], exactPathMatch: false },
          (e) => {
            if (e.path.length > 3) {
              const inst = eveModels[modelName].get(e.path[2]);
              if (!filter || filter(inst)) {
                items.set(key(inst), inst);
              } else {
                items.delete(key(inst));
              }
            }
          }
        );
        const destroyItemListener = addListener(
          { op: "remove", path: ["models", modelName], exactPathMatch: false },
          (e) => {
            const inst = eveModels[modelName].get(e.path[2]);
            if (e.path.length === 3) {
              items.delete(key(inst));
            }
          }
        );
        self._listeners[`${prop}-add`] = newItemListener;
        self._listeners[`${prop}-update`] = updateItemListener;
        self._listeners[`${prop}-destroy`] = destroyItemListener;
      }
    };
  },
  modelListLookup:  ({modelName, key, filter, transformer, listeners}) => {
      return {
        custom: (self, prop) => {
          let items = new GroupedSet([], key);
          Object.defineProperty(self, prop, {
            get: () => items,
          });
          const newItemListener = addListener(
            { op: "add", path: ["models", modelName], exactPathMatch: false },
            (e) => {
              if (e.path.length === 3) {
                const newInst = eveModels[modelName].get(e.path[2]);
                if(!filter || filter(newInst)) {
                  items.add(
                    newInst
                  );
                }
              }
            }
          );
          // add condition if listeners
          const updateItemListener = addListener(
            { path: ["models", modelName], exactPathMatch: false },
            (e) => {
              if (e.path.length > 3) {
                const inst = eveModels[modelName].get(e.path[2]);
                if (!filter || filter(inst)) {
                  items.add(inst);
                } else {
                  items.delete(inst);
                }
              }
            }
          );
          const destroyItemListener = addListener(
            { op: "remove", path: ["models", modelName], exactPathMatch: false },
            (e) => {
              const inst = eveModels[modelName].get(e.path[2]);
              if (e.path.length === 3) {
                items.delete(inst);
              }
            }
          );
          self._listeners[`${prop}-add`] = newItemListener;
          self._listeners[`${prop}-update`] = updateItemListener;
          self._listeners[`${prop}-destroy`] = destroyItemListener;
        }
      };
    },
    history: (op, path) => {
      return {
        custom: (self, prop) => {
          Object.defineProperty(self, prop, {
            value: eveHistory.create({
              name: self.id,
              eventIds: Object.keys(self._def.state).map(prop => ({path: [...self._path, prop]})),
            }),
          });
        },
      };
    },
};

const addRawStateToObject = (object, stateDefs) => {
  Object.keys(stateDefs).forEach(prop => {
    Object.defineProperty(object, prop, {
      get() {
        fireTracerCallbacks([...object._path, prop]);
        return this.raw[prop];
      },
      set(val) {
        updateEveStore((store) => {
          if (this._modelName) {
            store.models[this._modelName][this.id][prop] = val;
          } else if (this._collectionName) {
						store.collections[this._collectionName][prop] = val;
					}
        });
      }
    });
  })
}

const addPropsToObject = (object, propDefs) => {
	Object.keys(propDefs).forEach((prop) => {
		Object.defineProperty(object, prop, {
			value: propDefs[prop],
		});
	});
};

const addDerivativesToObject = (object, derivativeDefs) => {
    Object.keys(derivativeDefs).forEach((prop) => {
    const propDef = derivativeDefs[prop];
    let cachedVal = null;
    let needsUpdate = true;
    const setNeedsUpdate = () => (needsUpdate = true);
    if (typeof propDef === "function") {
      const updateCache = (self) => {
        const listeners = listenTo(() => propDef(self), setNeedsUpdate);
        object._listeners[prop] = listeners;
        cachedVal = propDef(self);
      }
      Object.defineProperty(object, prop, {
        get() {
          needsUpdate && updateCache(this);
          return cachedVal;
        },
      });
    } else if (propDef.listenTo) {
      const listeners = listenTo(() => propDef.listenTo(object), setNeedsUpdate);
      object._listeners[prop] = listeners;
      const updateCache = (self) =>
        (cachedVal = propDef.compute(self));
      Object.defineProperty(object, prop, {
        get() {
          needsUpdate && updateCache(this);
          return cachedVal;
        },
      });
    } else if (propDef.eventIds) {
      const listeners = addListeners(propDef.eventIds(object), setNeedsUpdate);
      object._listeners[prop] = listeners;
      const updateCache = (self) =>
        (cachedVal = propDef.compute(self));
      Object.defineProperty(object, prop, {
        get() {
          needsUpdate && updateCache(this);
          return cachedVal;
        },
      });
    } else if(propDef.custom) {
      propDef.custom(object, prop);
    }
  });
};

const addActionsToObject = (object, actionDefs) => {
  Object.keys(actionDefs).forEach((prop) => {
		const path = [...object._path, prop];
		Object.defineProperty(object, prop, {
			get() {
				fireTracerCallbacks(path);
				return (...args) => {
					if (fireInterceptors({ path })) {
						const updater = (self) =>
							actionDefs[prop](self, ...args);
						this.update(updater);
						fireListeners({ path });
					}
				};
			},
		});
  });
};

const addReactionsToObject = (object, reactionDefs) => {
  Object.keys(reactionDefs).forEach((prop) => {
		const propDef = reactionDefs[prop];
		if (propDef.listenTo) {
			const reaction = () => propDef.reaction(object);
      const listeners = listenTo(() => propDef.listenTo(object), reaction);
      object._listeners[prop] = listeners;
			Object.defineProperty(object, prop, {
				value: reaction,
			});
		} else if (propDef.eventIds) {
			const reaction = () => propDef.reaction(object);
      const listeners = addListeners(propDef.eventIds(object), reaction);
      object._listeners[prop] = listeners;
			Object.defineProperty(object, prop, {
				value: reaction,
			});
		}
  });
};

const addRetroactionsToObject = (object, retroactionDefs) => {
	Object.keys(retroactionDefs).forEach((prop) => {
		const propDef = retroactionDefs[prop];
		if (propDef.listenTo) {
			const retroaction = () => propDef.retroaction(object);
      const interceptors = intercept(() => propDef.listenTo(object), retroaction);
      object._interceptors[prop] = interceptors;
			Object.defineProperty(object, prop, {
				value: retroaction,
			});
		} else if (propDef.eventIds) {
			const retroaction = () => propDef.retroaction(object);
      const interceptors = addInterceptors(propDef.eventIds(object), retroaction);
      object._interceptors[prop] = interceptors;
			Object.defineProperty(object, prop, {
				value: retroaction,
			});
		}
	});
};

const valFromPath = (obj, path) => {
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        obj = obj[path[i]];
    };
    return obj;
};