import { mockApi } from "./mockApi";
import { realApi } from "./realApi";

const useRealApi = import.meta.env.VITE_USE_REAL_API === "true";

export const api = useRealApi ? realApi : mockApi;
export const apiMode: "real" | "mock" = useRealApi ? "real" : "mock";
