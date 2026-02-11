import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextStore = {
  userId?: string;
  companyId?: string;
  locationId?: string;
  correlationId?: string;
  request?: {
    method?: string;
    url?: string;
    ip?: string;
    ua?: string;
    headers?: Record<string, any>;
  };
};

const als = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  run(store: RequestContextStore, fn: () => Promise<any> | any) {
    return als.run(store, fn);
  },
  getStore(): RequestContextStore | undefined {
    return als.getStore();
  },
  update(updater: Partial<RequestContextStore>) {
    const cur = als.getStore();
    if (cur) {
      Object.assign(cur, updater);
    }
  },
};
