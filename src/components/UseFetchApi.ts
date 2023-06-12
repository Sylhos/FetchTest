import { ref, reactive, Ref } from "vue";
interface IFetchApiResponse {
  response: Ref;
  error: Ref;
  data: Ref;
  loading: Ref<boolean>;
  fetchAsync: () => Promise<void>;
}

class FetchApiResponse implements IFetchApiResponse {
  response: Ref;
  error: Ref;
  data: Ref;
  loading: Ref<boolean>;
  fetchAsync: () => Promise<void>;
  constructor(
    response: Ref,
    error: Ref,
    data: Ref,
    loading: Ref<boolean>,
    fetchAsync: () => Promise<void>
  ) {
    this.response = response;
    this.error = error;
    this.data = data;
    this.loading = loading;
    this.fetchAsync = fetchAsync;
  }
}
const cacheMap = reactive(new Map());

export const useFetchApi = async (
  url: string,
  config: RequestInit,
  skip = false
): Promise<IFetchApiResponse> => {
  const data = ref();
  const response = ref<Response>();
  const error = ref();
  const loading = ref(false);
  const cfg: RequestInit = config as RequestInit;
  const fetchAsync = async () => {
    loading.value = true;
    try {
      response.value = await fetch(url, cfg);
      error.value = response.value.statusText;
      if (!response.value.ok) return;
      data.value = await response.value.json();
    } catch (ex) {
      error.value = ex;
    } finally {
      loading.value = false;
    }
  };
  !skip && (await fetchAsync());
  return new FetchApiResponse(response, error, data, loading, fetchAsync);
};

export const useFetchApiCache = async (
  key: string,
  url: string,
  config: RequestInit
): Promise<IFetchApiResponse> => {
  const response = await useFetchApi(url, config, true);
  response.data.value = cacheMap.get(key);
  if (!response.data.value) {
    await response.fetchAsync();
    if (response.response.value.ok) cacheMap.set(key, response.data.value);
  }
  return new Promise((resolve, reject) => {
    resolve(response);
  });
};

export const usePost = (url: string, config: RequestInit, payload: string) => {
  const postConfig = {
    ...config,
    method: "POST",
    data: JSON.stringify(payload),
  };
  const info = useFetchApi(url, postConfig);
  return { ...info, fetch };
};

export const usePut = (url: string, config: RequestInit, payload: string) => {
  const postConfig = {
    ...config,
    method: "PUT",
    data: JSON.stringify(payload),
  };
  const info = useFetchApi(url, postConfig);
  return { ...info, fetch };
};
