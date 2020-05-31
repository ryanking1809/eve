import { binaryInsert, binaryDelete } from "./binarySearch";

export class BinaryMap extends Map {
			constructor(vals = [], comparitor, presorted = false) {
				super(vals);
				this.comparitor = comparitor;
				this.sortedList = presorted
					? [...super.keys()]
					: [...super.keys()].sort(comparitor);
			}
			get(key) {
				return super.get(key);
			}
			set(key, val) {
				if (this.has(key)) {
					this.sortedList &&
						binaryDelete(this.sortedList, key, this.comparitor);
				}
				this.sortedList &&
					binaryInsert(this.sortedList, key, this.comparitor);
				super.set(key, val);
			}
			delete(key) {
				if (this.has(key)) {
					binaryDelete(this.sortedList, key, this.comparitor);
					super.delete(key);
				}
			}
			clear() {
				this.sortedList = [];
				super.clear();
			}
			*entries() {
				for (let key of this.sortedList) {
					yield [key, this.get(key)];
				}
			}
			*values() {
				for (let key of this.sortedList) {
					yield this.get(key);
				}
			}
			keys() {
				return this.sortedList[Symbol.iterator]();
			}
			forEach(f, that) {
				for (let key of this.sortedList) {
					f.call(that, this.get(key), key, this);
				}
			}
		}

BinaryMap.prototype[Symbol.iterator] = BinaryMap.prototype.entries;
        
export class BinarySet extends Set {
			constructor(vals = [], comparitor, presorted = false) {
				super(vals);
				this.comparitor = comparitor;
				this.sortedList = presorted
					? [...vals]
					: [...vals].sort(comparitor);
			}
			add(item) {
				if (this.has(item)) {
					this.sortedList &&
						binaryDelete(this.sortedList, item, this.comparitor);
				}
				this.sortedList &&
					binaryInsert(this.sortedList, item, this.comparitor);
				super.add(item);
			}
			delete(item) {
				if (this.has(item)) {
					binaryDelete(this.sortedList, item, this.comparitor);
					super.delete(item);
				}
			}
			clear() {
				this.sortedList = [];
				super.clear();
			}
			*entries() {
				for (let key of this.sortedList) {
					yield [key, key];
				}
			}
			values() {
				return this.sortedList[Symbol.iterator]();
			}
			keys() {
				return this.sortedList[Symbol.iterator]();
			}
			forEach(f, that) {
				for (let key of this.sortedList) {
					f.call(that, key, key, this);
				}
			}
		}

BinarySet.prototype[Symbol.iterator] = BinarySet.prototype.entries;

export class GroupedSet extends Map {
	constructor(vals = [], grouper) {
        const groupedMap = new Map();
        const keyLookup = new Map();
        vals.forEach(item => {
            const key = grouper(item);
            if (!groupedMap.get(key)) groupedMap.set(key, new Set());
            if (keyLookup.has(item)) {
                const oldKey = keyLookup.get(item);
                groupedMap.get(oldKey).delete(item);
            }
            keyLookup.set(item, key);
            groupedMap.get(key).add(item);
        })
		super(groupedMap);
		this.grouper = grouper;
		this.keyLookup = keyLookup;
	}
	get(key) {
		return super.get(key);
	}
	set(key, item) {
		if (!this.get(key)) super.set(key, new Set());
		if (this.keyLookup.has(item)) {
            const oldKey = this.keyLookup.get(item);
			this.get(oldKey).delete(item);
		}
		this.keyLookup.set(item, key);
		this.get(key).add(item);
    }
    add(item) {
        const key = this.grouper(item);
		this.set(key, item)
    }
	delete(item) {
		if (this.keyLookup.has(item)) {
			const key = this.keyLookup.get(item);
            this.get(key).delete(item);
            this.keyLookup.delete(item);
		}
	}
	clear() {
		this.keyLookup.clear();
		super.clear();
	}
	forEach(f, that) {
		for (let key of this.sortedList) {
			f.call(that, this.get(key), key, this);
		}
	}
}

GroupedSet.prototype[Symbol.iterator] = GroupedSet.prototype.entries;