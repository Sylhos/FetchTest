import { ref, computed, reactive, Ref } from "vue";
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
export const useFetchApi = (
  url: string,
  config: { headers?: object; skip?: boolean } = { skip: false }
): IFetchApiResponse => {
  const data = ref(null);
  const response = ref({});
  const error = ref();
  const loading = ref(false);
  const fetchAsync = async () => {
    loading.value = true;
    try {
      response.value = await fetch(url, config as RequestInit);
    } catch (ex) {
      error.value = ex;
    } finally {
      loading.value = false;
    }
  };
  !config.skip && fetchAsync();
  return new FetchApiResponse(response, error, data, loading, fetchAsync);
};

const cacheMap = reactive(new Map());

export const fetchApiCache = (
  key: string,
  url: string,
  config: { skip: boolean }
) => {
  config.skip = true;
  const info = useFetchApi(url, config);

  const update = () => cacheMap.set(key, info.response.value);
  const clear = () => cacheMap.set(key, undefined);

  const fetch = async () => {
    try {
      await info.fetchAsync();
      update();
    } catch {
      clear();
    }
  };

  const response = computed(() => cacheMap.get(key));
  const data = computed(() => response.value?.data);

  if (response.value == null) fetch();

  return { ...info, fetch, data, response, clear };
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
