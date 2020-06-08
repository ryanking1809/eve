# Eve

Eve is an observable state managment library back by a global immutable store, combining efficient event-based updates with simpler debugging. All changes to state are recorded, serializable, and replayable. Making for easy persistance and undo / redo functionality.

    npm install @ryki/eve

## How to use

For an example, let's build a basic sticky notes app.

```js
import { eveStore, eveStateManager, state, helper, helpers } from "@ryki/eve";
```

We will create the following class for our sticky notes. We must use the `@eveStore` decorator and extend the `eveStateManager`

All properties using the `@state` decorator will be stored in the global state, and all other state should derive from this.

```js
@eveStore("Sticky")
class Sticky extends eveStateManager {
	@state note = "This is a sticky note";
	@state firstName = "Mary"
	@state lastName = "Jane"
}
```

We can use a `@derivative` decorator to create additional values derived from the state. Whenever the state updates the derivative will know to update.

```js
@eveStore("Sticky")
class Sticky extends eveStateManager {
	@state note = "This is a sticky note";
	@state firstName = "Mary"
	@state lastName = "Jane"
	// use @derivative derived values
	@derivative
	get name {
		return `${this.firstName} ${this.lastName}`
	}
```

Adding undo / redo functionality in eve is super easy. In this case we're using the history helper to provide localised undo / redo functionality to each individual sticky note.

```js
@eveStore("Sticky")
class Sticky extends eveStateManager {
	@state note = "This is a sticky note";
	@state firstName = "Mary"
	@state lastName = "Jane"
	@derivative
	get name {
		return `${this.firstName} ${this.lastName}`
	}
	// localised history
	@helper history = helpers.history();
```

Other helpers can be used to automatically create references to other object. Below, the `Stickies` class will automatically update whenever a `Sticky` is created, deleted, or updated.

```js
@eveStore("Stickies", true)
class Stickies extends eveStateManager {
	@helper notes = helpers.storeList({ store: Sticky });
	@helper notesById = helpers.storeLookup({
		store: Sticky,
		key: (s) => s.id,
	});
}
```

Now you can just create some sticky notes and the collection will automically update.

### Persistance

You can serialize and replay any session.

```js
import { eveState } from "@ryki/eve";
const snap = eveState.serializedSnapshot();
// The 2nd argument is a playback speed multiplier
replaySnareplaySerializedSnapshotpshot(snap, 2);
```

### Undo / Redo

A history object can listen to any classes, instances, or properties with state to create undo / redo functionality.

```js
import { eveHistory } from "@ryki/eve";
const history = eveHistory.create({
	name: "undoable",
	listenTo: () => [Sticky]
});
// this will only undo Sticky class instances but no toher instances
history.undo()
history.redo()
```

### React

Eve is framework independant but a `useListener` component is available to react users.

```js
import { useListener } from "@ryki/eve";

function Sticky({ sticky }) {
	const [note] = useListener(() => [sticky.note]);
	const updateNote = useCallback((e) => {
		sticky.note = e.target.value
	})
	// this will automatically update whenever note changes
	// regardless of where the change occurs
	return (
		<div className="sticky">
			<textarea
				value={note}
				onChange={updateNote}
			/>
		</div>
	);
}
```