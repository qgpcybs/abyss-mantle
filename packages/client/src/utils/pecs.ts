import {
  defineQuery,
  Entity,
  Has,
  Component,
  ComponentValue,
  getComponentValue,
  Schema,
  isComponentUpdate,
  QueryFragment,
} from "@latticexyz/recs";

export function listenComponentValue<S extends Schema>(
  component: Component<S>,
  entity: Entity | undefined,
  callback: (value: unknown) => void
) {
  let value = entity != null ? getComponentValue(component, entity) : undefined;
  const queryResult = defineQuery([Has(component)], {
    runOnInit: true,
  });
  const subscription = queryResult.update$.subscribe((update) => {
    if (isComponentUpdate(update, component)) {
      if (update.entity === entity) {
        const [nextValue] = update.value;
        value = nextValue;
        callback(value);
      }
    }
  });

  return () => subscription.unsubscribe();
}

// [TODO maybe]
export function useEntityQuery(
  fragments: QueryFragment[],
  options?: { updateOnValueChange?: boolean }
) {
  // const
}
