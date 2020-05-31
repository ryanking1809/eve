# Eve

This is the begginings of state management project I'm slowly working on. I really like observable libraries but find them difficult to manage with a large enough system.

The idea behind this library is to make observable state management more flux like by focusing on a global event system. This can allow you to implement efficient observable updates but whilst easily trackig global state.

I don't have a lot of time to work on this right now but I though I'd put it out there to allow for people to participate or take in their own direction.

## API 

You can store observable values in either a `eveModel` or an `eveStore`. An `eveModel` can be used to creat inctances of the same time of object, whereas an `eveStore` only has one instance.

An `eveModel / eveStore` has observable and non-obervable attributes.

```js
const tModel = eveModel(
  "testModel",
  eveAttributes.eveProp("text", "hi"),
  eveAttributes.eveProp("value", 2),
  eveAttributes.eveDerivative(
    "textVal",
    instance => instance.text.repeat(instance.value),
    [listenToOwnProp("text"), listenToOwnProp("value")]
  ),
  eveAttributes.eveReaction(
    "react",
    (intance, event) => console.log("Reaction", console.log("text or value changed")),
    [listenToOwnProp("text"), listenToOwnProp("value")]
  )
);
const t1 = tModel.new();
```

Because `create`, `update`, and `delete` events are triggered from `eveModels` we can create super efficent arrays and maps that know exactly what to update when each ovent occurs.

```js 
const tStore = eveStore(
  "testStore",
  eveAttributes.modelList("testModel", "testModels"),
  eveAttributes.modelLookup("testModel", "testModelsById", obj => obj.id)
);

// above basically translates to
  addListener({
    eventIds: [eventId({ eventType: "create", objectType: modelName })],
    reaction: ({ object }) => addToArray(object)
  });
  addListener({
    eventIds: [eventId({ eventType: "update", objectType: modelName })],
    reaction: ({ object }) => updateObjectWithinArray(object)
  });
  addListener({
    eventIds: [eventId({ eventType: "delete", objectType: modelName })],
    reaction: ({ object }) => removeFromArray(object)
  });
```

Any object can listen to any event it chooses

```js
addListener({ 
  eventIds: [eventId({eventType: "update", objectType: "testModel"})], 
  reaction: () => console.log("model updated")
});
```

[Have a play on codesandbox](https://codesandbox.io/s/eve-test-04e75?file=/src/App.js)

## TODO

- I find the current api pretty illegible, expecially when it comes to creating large stores.
- I like how libraries like [wana](https://github.com/alloc/wana) can make existing objects observable on the fly. This can't do that using the current api.
- A store/model can only update via events, a set function fires an event which the model is listening to. I don't like this because it breaks the object if seperated from the event system.
- Need a good solution for nexted stores.
- Need a good solution for nested events.