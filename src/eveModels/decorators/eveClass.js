import cuid from "cuid";
import { updateEveStore, eveStore } from "../../eveStore";
import { traceListenerIds, addListener, traceListenerIdsFromFunction } from "../../eveListeners";
import tuple from "immutable-tuple";

export class eveClass {
    _listeners = new Map();
    _updating = false;
    constructor(props={}) {
        this._path = [...this._child._path];
        if (!this._child._singleton) {
			this.id = props.id || cuid();
			this._path.push(this.id);
			this._child.instances[this.id] = this;
		} else {
			this._child.instance = this;
		}
        this._initializeState();
		Object.keys(props).forEach((propName) => {
			this[propName] = props[propName];
		});
        this._applyListeners();
    }
    get _child() {
        return this.__proto__.constructor;
    }
    get _stateInitializers() {
        return this.__proto__.stateInitializers;
    }
    get _listenTo() {
        return this.__proto__.listenTo;
    }
    _initializeState() {
        if (!this._stateInitializers) return;
        let state = {};
        Object.keys(this._stateInitializers).forEach(
            (prop) =>
                (state[prop] = this._stateInitializers[prop]())
        );
        updateEveStore(
			(store) => {
                if (this.id) {
                    store.models[this._child._name][this.id] = state;
                } else {
                    store.models[this._child._name] = state;
                }
            }
		);
    }
    _applyListeners() {
        if (!this._listenTo) return;
        Object.keys(this._listenTo).forEach((prop) =>
            this._listenTo[prop].forEach((l) => {
                if (typeof l.targets === "function") {
                    traceListenerIdsFromFunction(
						() => l.targets.bind(this)(this)
					).forEach((eId) =>
						this._addListener(prop, l.action, eId, l.type)
					);
                } else if (typeof l.targets === "object") {
                    ["add", "replace", "remove"].forEach((op) => {
                        l.targets[op] &&
							traceListenerIdsFromFunction(() =>
								l.targets[op].bind(this)(this), op
							).forEach((eId) => {
								this._addListener(prop, l.action, eId, l.type)
							});
                    });
                }
            })
        );
    }
    _addListener(prop, action, { op, path }, type) {
        !this._listeners.get(prop) &&
            this._listeners.set(prop, new Set());
        const eId = tuple(op, path, type, action);
        this._listeners.get(prop).add(eId);
        addListener({ op, path }, action(this), type);
    }
    _getSource() {
        return eveStore;
    }
    _getState() {
        let source = this._getSource();
        this._path.forEach((path) => {
            source = source[path];
        });
        return source;
    }
    update(updater) {
        if (this._updating) {
            updater();
        } else {
            updateEveStore((store) => {
                this._updating = true;
                this._getSource = () => store;
                updater();
                this._getSource = () => eveStore;
                this._updating = false;
            });
        }
    }
}