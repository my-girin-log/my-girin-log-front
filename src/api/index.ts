import { mockApi } from "./mockApi";
import { realApi } from "./realApi";

/**
 * 기본 정책:
 *  - 프로덕션 빌드 → realApi (배포 환경은 실제 백엔드 호출)
 *  - 개발(dev) → mockApi (별도 백엔드 띄울 필요 없이 동작)
 *  - VITE_USE_REAL_API=true | false 로 명시 override 가능
 */
const flag = import.meta.env.VITE_USE_REAL_API;
const useRealApi = flag === "true" || (flag !== "false" && import.meta.env.PROD);

export const api = useRealApi ? realApi : mockApi;
export const apiMode: "real" | "mock" = useRealApi ? "real" : "mock";
