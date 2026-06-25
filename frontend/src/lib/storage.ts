// Safe localStorage wrappers. Some browser setups throw on access (blocked
// site data, partitioned/denied storage in a browser tab), which must never
// crash app start-up — a thrown error here previously caused a black screen.

export function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — ignore */
  }
}

export function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* storage unavailable — ignore */
  }
}
