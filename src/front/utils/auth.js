// Utils to handle authentication state side-effects across the app

/**
 * If a response indicates unauthorized (401), clear the token and notify listeners
 * so components like Navbar can re-check the login state.
 */
export function handleUnauthorized(resp) {
  try {
    if (resp && resp.status === 401) {
      // Remove token and notify app
      localStorage.removeItem("token");
      // Custom event listened by Navbar (and others) to re-check auth state
      window.dispatchEvent(new Event("loginChange"));
    }
  } catch (_) {
    // No-op: never throw from here
  }
}
