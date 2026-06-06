const STORAGE_KEY = 'prototypehub_author'

export function getAuthor() {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function setAuthor(name) {
  localStorage.setItem(STORAGE_KEY, name)
}

export function clearAuthor() {
  localStorage.removeItem(STORAGE_KEY)
}

export function isAuthorSet() {
  return !!getAuthor()
}
