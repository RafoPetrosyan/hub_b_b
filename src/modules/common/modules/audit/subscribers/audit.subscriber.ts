import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import * as jsonpatch from 'fast-json-patch';
import { redact } from '../redact';
import { RequestContext } from '../types/request-context';
import { AuditLog } from '../entities/audit-log.entity';

const DEFAULT_EXCLUDE_ENTITIES = new Set(['audit_logs']);

const REDACT_OPTIONS = {
  keys: ['password', 'salt', 'ssn', 'token', 'refresh_token', 'credit_card', 'card_number', 'cvv'],
  contains: ['password', 'secret', 'token', 'card', 'credit'],
  patterns: [/password/i, /token/i],
  strategy: 'mask' as 'mask' | 'hash',
  maskPlaceholder: '[REDACTED]',
  hashLength: 12,
  recursive: true,
};

function toPlain(entity: any) {
  try {
    return JSON.parse(JSON.stringify(entity));
  } catch {
    return entity;
  }
}

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<any> {
  constructor(private dataSource: DataSource) {
    // register subscriber into dataSource
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Object; // subscribe to all entities
  }

  async afterInsert(event: InsertEvent<any>) {
    const table = event.metadata.tableName;
    if (DEFAULT_EXCLUDE_ENTITIES.has(table)) return;

    const newEntity = toPlain(event.entity);
    const store = RequestContext.getStore();

    const safeAfter = redact(newEntity, REDACT_OPTIONS);

    const payload: Partial<AuditLog> = {
      action: 'CREATE',
      entity_type: event.metadata.name,
      entity_id: event.entity?.id ? String(event.entity.id) : null,
      company_id: store?.companyId ?? null,
      location_id: store?.locationId ?? null,
      user_id: store?.userId ?? null,
      request_method: store?.request?.method ?? null,
      request_url: store?.request?.url ?? null,
      request_ip: store?.request?.ip ?? null,
      request_user_agent: store?.request?.ua ?? null,
      correlation_id: store?.correlationId ?? null,
      snapshot_after: safeAfter,
      meta: { table },
    };

    await this.writeAudit(event.manager, payload);
  }

  async afterUpdate(event: UpdateEvent<any>) {
    const table = event.metadata.tableName;
    if (DEFAULT_EXCLUDE_ENTITIES.has(table)) return;

    // databaseEntity = state before update
    const before = toPlain(event.databaseEntity);
    // entity or updatedColumns represent after; constructing mergedAfter to be safe
    const partialAfter = toPlain(event.entity || {});
    const mergedAfter = { ...(before || {}), ...(partialAfter || {}) };

    const safeBefore = redact(before, REDACT_OPTIONS);
    const safeAfter = redact(mergedAfter, REDACT_OPTIONS);

    const patch = jsonpatch.compare(safeBefore || {}, safeAfter || {});
    if (!patch || patch.length === 0) {
      return; // nothing changed (or changes only to excluded fields)
    }

    const store = RequestContext.getStore();

    const payload: Partial<AuditLog> = {
      action: 'UPDATE',
      entity_type: event.metadata.name,
      entity_id: event.databaseEntity?.id ? String(event.databaseEntity.id) : null,
      company_id: store?.companyId ?? null,
      location_id: store?.locationId ?? null,
      user_id: store?.userId ?? null,
      request_method: store?.request?.method ?? null,
      request_url: store?.request?.url ?? null,
      request_ip: store?.request?.ip ?? null,
      request_user_agent: store?.request?.ua ?? null,
      correlation_id: store?.correlationId ?? null,
      change_patch: patch,
      snapshot_before: safeBefore,
      snapshot_after: safeAfter,
      meta: { table },
    };

    await this.writeAudit(event.manager, payload);
  }

  async beforeRemove(event: RemoveEvent<any>) {
    // capture removed state before deletion
    const table = event.metadata.tableName;
    if (DEFAULT_EXCLUDE_ENTITIES.has(table)) return;

    const before = toPlain(event.databaseEntity || event.entity);
    const safeBefore = redact(before, REDACT_OPTIONS);
    const store = RequestContext.getStore();

    const payload: Partial<AuditLog> = {
      action: 'DELETE',
      entity_type: event.metadata.name,
      entity_id: event.databaseEntity?.id ? String(event.databaseEntity.id) : null,
      company_id: store?.companyId ?? null,
      location_id: store?.locationId ?? null,
      user_id: store?.userId ?? null,
      request_method: store?.request?.method ?? null,
      request_url: store?.request?.url ?? null,
      request_ip: store?.request?.ip ?? null,
      request_user_agent: store?.request?.ua ?? null,
      correlation_id: store?.correlationId ?? null,
      snapshot_before: safeBefore,
      meta: { table },
    };

    await this.writeAudit(event.manager, payload);
  }

  private async writeAudit(manager: EntityManager, payload: Partial<AuditLog>) {
    try {
      await manager.getRepository(AuditLog).save(payload as any);
    } catch (err) {
      // Do not throw — do best-effort logging
      // Use console.warn to keep dependency-free
      // In prod you may want to log to file monitoring system
      // eslint-disable-next-line no-console
      console.warn('Audit write failed', err);
    }
  }
}
