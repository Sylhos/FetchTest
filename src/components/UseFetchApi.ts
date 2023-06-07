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

export const useFetchApi = (
  url: string,
  config: { headers?: object; skip?: boolean } = { skip: false }
): IFetchApiResponse => {
  const data = ref();
  const response = ref<Response>();
  const error = ref();
  const loading = ref(false);
  const fetchAsync = async () => {
    loading.value = true;
    try {
      response.value = await fetch(url, config as RequestInit);
      error.value = response.value.statusText;
      if (!response.value.ok) return;
      data.value = await response.value.json();
    } catch (ex) {
      error.value = ex;
    } finally {
      loading.value = false;
    }
  };
  !config.skip && fetchAsync();
  return new FetchApiResponse(response, error, data, loading, fetchAsync);
};

export const useFetchApiCache = (
  key: string,
  url: string,
  config: { skip: boolean }
): IFetchApiResponse => {
  config.skip = true;

  const info = useFetchApi(url, config);

  const update = () => cacheMap.set(key, info.data.value);
  const clear = () => cacheMap.set(key, undefined);

  const directFetch = async () => {
    try {
      console.log("direct!");
      await info.fetchAsync();
      update();
    } catch {
      clear();
    }
  };

  const response = ref(cacheMap.get(key));

  !response.value && directFetch();

  return info;
};

export const usePost = (
  url: string,
  config: { headers?: object; skip?: boolean },
  payload: string
) => {
  const postConfig = {
    ...config,
    method: "POST",
    data: JSON.stringify(payload),
  };
  const info = useFetchApi(url, postConfig);
  return { ...info, fetch };
};

export const usePut = (
  url: string,
  config: { skip: boolean },
  payload: string
) => {
  const postConfig = {
    ...config,
    method: "PUT",
    data: JSON.stringify(payload),
  };
  const info = useFetchApi(url, postConfig);
  return { ...info, fetch };
};
