# Eve (WIP)

Eve is a global imumtable store wrapped in an observable layer. All changes in Eve happen through events, allowing you to easily replay sessions, implement undo / redo functionality, and even implement efficient sorted array using binary search. Components can listen to events as they happen and efficiently update when needed.

### Goals

- Simple observable interface both allowing you to update and use js objects as you normally would
- Take on the work of updating to components and derived state as efficiently as possible
- Immutable global store behind the scenes, easily serializable for debugging and built-in session playback
- Event system for built-in undo / redo, being able to filter undobable events

#### Not yet available

    npm install @ryki/eve

## How to use

```js
import { model, derivatives, collection } from "@ryki/eve";
```

A `model` is a store that can generate instances. Below we can create a sticky note model.

```js
const stickyModel = model("sticky", {
  // All your application's state should derive
  // from the state props
  state: {
    note: "This is a sticky note"
  },
  // Derivatives are computed from state
  derivatives: {
    // Eve provides some derivative helpers
    // this will automaticall create a local history for this object
    // making undo / redo super easy
    history: derivatives.history()
  }
})
```

A `collection` does not have instances, and typically stores reference to `model` instances. Here will create a collection for our sticky notes.

```js 
const stickies = collection("stickies", {
  state: {
    selectedNoteId: null
  },
  derivatives: {
    // gets a "sticky" model with the id that matches "selectedNoteId"
    selectedNote: derivatives.modelRef({modelName: "sticky", refProp: "selectedNoteId"}),
    // these will automically updates as sticky models are created
    notes: derivatives.modelList({modelName: "sticky"},
    notesById: derivatives.modelLookup({modelName: "sticky", key: s => s.id})
  }
})
```

Now you can just create some sticky notes and the collection will automically update.

```js
stickyModel.create();
stickyModel.create();
console.log(stickies.notes)
// -> [sticky, sticky]
```

Underneath our immutable store will look like this.

```js
import { eveStore } from "@ryki/eve";
console.log(eveStore);
```

```js
{
	"_session": {
        "id": "ckavnohi700003g6762nvc51l",
         // start of session used for replaying
        "ts": 1590965330335,
         // a recording of all changes to the store, using immer patches
		"log": [...]
    },
    // the instance histories for undo / redo
	"history": {
		"ckavnohij00053g67t4268jvs": {
			"events": {},
			"undone": {}
		},
		"ckavnohim00083g67smk92zet": {
			"events": {},
			"undone": {}
		}
    },
    // our new model instances
	"models": {
		"sticky": {
			"ckavnohij00053g67t4268jvs": {
				"note": "This is a sticky note",
				"modelName": "sticky",
				"id": "ckavnohij00053g67t4268jvs"
			},
			"ckavnohim00083g67smk92zet": {
				"note": "This is a sticky note",
				"modelName": "sticky",
				"id": "ckavnohim00083g67smk92zet"
			}
		}
    },
    // the collection data
	"collections": {
		"stickies": {
			"selectedNoteId": null,
			"modelName": "stickies",
			"id": "ckavnohig00033g67jz3n2t0c"
		}
	}
}
```

You can serialize and replay any session.
```js
import { getSnapshot, replaySnapshot } from "@ryki/eve";
const snap = getSnapshot();
// The 2nd argument is a playback speed multiplier
replaySnapshot(snap, 2);
```

### React

You can ad a react listener to automically update you components like so (soon will be part of the api)

```js
import { listenTo } from "@ryki/eve";

function useListener(propArray) {
	const [reactState, setReactState] = useState(propArray());
	useEffect(() => {
		listenTo(propArray, () => {
			setReactState(propArray());
		});
	}, []);
	return reactState;
}

function Sticky({ sticky }) {
	const [note] = useListener(() => [sticky.note]);
	const selectNote = useCallback(() => {
		stickies.selectedNoteId = sticky.id;
	});
	const deselectNote = useCallback(() => {
		stickies.selectedNoteId = null;
	});
	return (
		<div className="sticky">
			<textarea
				onFocus={selectNote}
				onBlur={deselectNote}
				value={note}
				onChange={(e) => (sticky.note = e.target.value)}
			/>
		</div>
	);
}
```