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
  getVersions: (pid) => request(`/projects/${pid}/versions`),
  getVersion: (pid, vid) => request(`/projects/${pid}/versions/${vid}`),
  uploadVersion: (pid, file, title) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title || '')
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
}
