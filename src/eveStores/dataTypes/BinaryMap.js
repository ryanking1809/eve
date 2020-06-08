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
        


