/**
 * Builds the WWW-Authenticate header value
 */
export function buildUnauthorizedBearer(
  resourceMetadataUrl: string,
  error?: string,
  errorDescription?: string,
  requiredScopes?: string[],
  realm?: string
): string {
  let bearer = "Bearer";

  if (realm) {
    bearer = `${bearer} realm="${realm}",`;
  } else {
    bearer = `${bearer} `;
  }

  bearer = `${bearer}resource_metadata="${resourceMetadataUrl}"`;

  if (error) {
    bearer = `${bearer}, error="${error}"`;
  }

  if (errorDescription) {
    bearer = `${bearer}, error_description="${errorDescription}"`;
  }

  if (requiredScopes && requiredScopes.length > 0) {
    bearer = `${bearer}, scope="${requiredScopes.join(" ")}"`;
  }

  return bearer;
}
