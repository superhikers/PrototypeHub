const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error?.message || '请求失败')
  return body
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Versions
  getVersions: (pid, params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/projects/${pid}/versions${qs}`)
  },
  getVersion: (pid, vid) => request(`/projects/${pid}/versions/${vid}`),
  uploadVersion: (pid, file, title, prototypeId, folderId) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title || '')
    if (prototypeId) form.append('prototype_id', prototypeId)
    if (folderId) form.append('folder_id', folderId)
    return fetch(`${BASE_URL}/projects/${pid}/versions`, { method: 'POST', body: form }).then(r => r.json())
  },
  deleteVersion: (pid, vid) => request(`/projects/${pid}/versions/${vid}`, { method: 'DELETE' }),

  // Annotations
  getAnnotations: (vid) => request(`/versions/${vid}/annotations`),
  createAnnotation: (vid, data) => request(`/versions/${vid}/annotations`, { method: 'POST', body: JSON.stringify(data) }),
  updateAnnotation: (vid, aid, data) => request(`/versions/${vid}/annotations/${aid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnotation: (vid, aid) => request(`/versions/${vid}/annotations/${aid}`, { method: 'DELETE' }),

  // Comments
  getComments: (aid) => request(`/annotations/${aid}/comments`),
  addComment: (aid, data) => request(`/annotations/${aid}/comments`, { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: (pid) => request(`/projects/${pid}/settings`),
  updateSettings: (pid, data) => request(`/projects/${pid}/settings`, { method: 'PUT', body: JSON.stringify(data) }),

  // Prototypes
  getPrototypes: (pid, params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/projects/${pid}/prototypes${qs}`)
  },
  createPrototype: (pid, data) => request(`/projects/${pid}/prototypes`, { method: 'POST', body: JSON.stringify(data) }),
  renamePrototype: (ptid, data) => request(`/prototypes/${ptid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePrototype: (ptid) => request(`/prototypes/${ptid}`, { method: 'DELETE' }),

  // Folders
  getFolders: (pid) => request(`/projects/${pid}/folders`),
  createFolder: (pid, data) => request(`/projects/${pid}/folders`, { method: 'POST', body: JSON.stringify(data) }),
  renameFolder: (fid, data) => request(`/folders/${fid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFolder: (fid) => request(`/folders/${fid}`, { method: 'DELETE' }),
}
