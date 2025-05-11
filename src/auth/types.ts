import { TOKEN_VALIDATION_ERROR_CODE } from "../config/auth.config.js";

export type TOKEN_VALIDATION_ERROR =
  (typeof TOKEN_VALIDATION_ERROR_CODE)[keyof typeof TOKEN_VALIDATION_ERROR_CODE];
