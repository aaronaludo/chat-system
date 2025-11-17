import * as chatClientApis from './chatClientApis';

type ApiRegistry = {
  chatClient: typeof chatClientApis;
};

const apiRegistry: ApiRegistry = {
  chatClient: chatClientApis,
};

const getApi = <TKey extends keyof ApiRegistry>(name: TKey): ApiRegistry[TKey] => apiRegistry[name];

export { apiRegistry, getApi };
export type { ApiRegistry };
