import cuid from "cuid";
import { eveStore, updateEveStore, silentUpdateEveStore } from "../eveStore";
import { addListener } from "../eveListeners";
import { addState } from "./facadeGenerators/addState";
import { addProps } from "./facadeGenerators/addProps";
import { addDerivatives } from "./facadeGenerators/addDerivatives";
import { addActions } from "./facadeGenerators/addActions";
import { addReactions } from "./facadeGenerators/addReactions";
import { addRetroactions } from "./facadeGenerators/addRetroactions";

export * from "./derivativeHelpers/"

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
    modelDef.state && addState(obj, modelDef.state);
    modelDef.props && addProps(obj, modelDef.props);
    modelDef.derivatives && addDerivatives(obj, modelDef.derivatives);
    modelDef.actions && addActions(obj, modelDef.actions);
    modelDef.reactions && addReactions(obj, modelDef.reactions);
    modelDef.retroactions && addRetroactions(obj, modelDef.retroactions);
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
  collectionDef.state && addState(obj, collectionDef.state);
  collectionDef.props && addProps(obj, collectionDef.props);
  collectionDef.derivatives && addDerivatives(obj, collectionDef.derivatives);
  collectionDef.actions && addActions(obj, collectionDef.actions);
  collectionDef.reactions && addReactions(obj, collectionDef.reactions);
  collectionDef.retroactions && addRetroactions(obj, collectionDef.retroactions);
  eveCollections[name] = obj;
  return obj;
}

const valFromPath = (obj, path) => {
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        obj = obj[path[i]];
    };
    return obj;
};