import { EntityTarget } from 'typeorm';
import { PolymorphicService } from './polymorphic.service';

/**
 * Decorator options
 * - entity: EntityTarget to operate on (class or table name). Defaults to Media entity import path in your project.
 * - property: the property name you are decorating (used to derive method names) — optional, decorator will infer from key
 * - collection: default collection string to use ('profile_picture', 'pictures', etc.)
 * - type: 'one' | 'many' - whether it's a one-to-one collection or one-to-many
 * - opts: optional low-level mapping forwarded to PolymorphicService (ownerTypeColumn, ownerIdColumn, collectionColumn, primaryKey, alias)
 */
export type PolymorphicDecoratorOptions = {
  entity?: EntityTarget<any>;
  collection?: string;
  type?: 'one' | 'many';
  opts?: Record<string, any>;
};

/**
 * PolymorphicRelation decorator
 *
 * Example usages:
 *  @PolymorphicRelation({ entity: Media, collection: 'profile_picture', type: 'one' })
 *  profilePicture?: any;
 *
 *  @PolymorphicRelation({ entity: Media, collection: 'pictures', type: 'many' })
 *  pictures?: any;
 */
export function PolymorphicRelation(options: PolymorphicDecoratorOptions = {}) {
  const {
    entity: entityTarget,
    collection: collectionFromOptions,
    type: relTypeFromOptions,
    opts: lowLevelOpts,
  } = options;

  // decorator factory
  return function(target: any, propKey: string) {
    // derive readable method name fragment: use explicit collection name or propKey
    const prop = propKey;
    const collection = collectionFromOptions ?? prop;
    const relType = relTypeFromOptions ?? (prop.endsWith('s') ? 'many' : 'one'); // naive fallback

    // Create readable capitalized fragment: profile_picture -> Profile_picture -> ProfilePicture
    const humanFragment = (collection || prop)
      .split(/[_\s-]+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');

    // If property is plural (pictures) we want addPicture => singular for add method
    const singularForAdd = (() => {
      // simple english fallback: drop trailing 's' if present
      if (prop.endsWith('s')) return prop.slice(0, -1);
      if (collection.endsWith('s')) return collection.slice(0, -1);
      return prop;
    })();

    // Helper that resolves the entity target to pass to PolymorphicService.
    // If none provided, PolymorphicService will still need an entity; we throw early to help the developer.
    const getEntityTarget = () => {
      if (!entityTarget) {
        throw new Error(
          `PolymorphicRelation on "${target.constructor?.name}.${propKey}" requires an entity target in options (entity: Media or your entity).`,
        );
      }
      return entityTarget;
    };

    // ONE (one-to-one) methods
    if (relType === 'one') {
      // getXxx()
      target[`get${humanFragment}`] = function() {
        const entity = getEntityTarget();
        return PolymorphicService.findOne(entity, this, collection, lowLevelOpts);
      };

      // setXxx(dto) - uses setSingle to atomically replace
      target[`set${humanFragment}`] = function(dto: any) {
        const entity = getEntityTarget();
        // attach collection into dto to ensure service uses it; service will also accept collection param
        const dtoWithCollection = { ...(dto ?? {}), collection };
        return PolymorphicService.setSingle(entity, this, dtoWithCollection, lowLevelOpts);
      };

      // removeXxx()
      target[`remove${humanFragment}`] = function() {
        const entity = getEntityTarget();
        return PolymorphicService.removeForOwner(entity, this, collection, lowLevelOpts);
      };

      return;
    }

    // MANY (one-to-many) methods
    // getXxx(order?)
    target[`get${humanFragment}`] = function(order?: { [k: string]: 'ASC' | 'DESC' }) {
      const entity = getEntityTarget();
      return PolymorphicService.findMany(
        entity,
        this,
        collection,
        order ? { order, opts: lowLevelOpts } : { opts: lowLevelOpts } as any,
      );
    };

    // addXxx(dto) -> addPicture (singular)
    const addMethodName = `add${singularForAdd.charAt(0).toUpperCase() + singularForAdd.slice(1)}`;
    target[addMethodName] = function(dto: any) {
      const entity = getEntityTarget();
      const dtoWithCollection = { ...(dto ?? {}), collection };
      return PolymorphicService.attach(entity, this, dtoWithCollection, lowLevelOpts);
    };

    // removeXxx(mediaId?) - if id provided deletes that row, otherwise deletes all in collection
    target[`remove${humanFragment}`] = function(primaryOrNothing?: string) {
      const entity = getEntityTarget();
      if (primaryOrNothing) {
        return PolymorphicService.remove(entity, primaryOrNothing, lowLevelOpts);
      }
      return PolymorphicService.removeForOwner(entity, this, collection, lowLevelOpts);
    };
  };
}
