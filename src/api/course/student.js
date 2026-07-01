import request from '@/utils/request'

export function listStudent(query) {
  return request({
    url: '/edu/student/list',
    method: 'get',
    params: query
  })
}

export function getStudent(studentId) {
  return request({
    url: '/edu/student/' + studentId,
    method: 'get'
  })
}

export function listStudentLessons(studentId) {
  return request({
    url: '/edu/student/' + studentId + '/lessons',
    method: 'get'
  })
}

export function listStudentClasses(studentId) {
  return request({
    url: '/edu/student/' + studentId + '/classes',
    method: 'get'
  })
}

export function listStudentDevices(studentId) {
  return request({
    url: '/edu/student/' + studentId + '/devices',
    method: 'get'
  })
}

export function addStudent(data) {
  return request({
    url: '/edu/student',
    method: 'post',
    data
  })
}

export function updateStudent(data) {
  return request({
    url: '/edu/student',
    method: 'put',
    data
  })
}

export function delStudent(studentIds) {
  return request({
    url: '/edu/student/' + studentIds,
    method: 'delete'
  })
}

export function hideStudent(studentId) {
  return request({
    url: '/edu/student/' + studentId + '/hide',
    method: 'put'
  })
}

export function syncStudentNickname(studentId) {
  return request({
    url: '/edu/student/' + studentId + '/syncNickname',
    method: 'put'
  })
}

export function syncStudentNicknameBatch(studentIds) {
  return request({
    url: '/edu/student/syncNickname/' + studentIds,
    method: 'put'
  })
}

export function textImportStudent(text) {
  return request({
    url: '/edu/student/textImport',
    method: 'post',
    data: { text }
  })
}

export function listStudentLabels() {
  return request({
    url: '/edu/student/label/options',
    method: 'get'
  })
}

export function listStudentResources(studentId) {
  return request({
    url: '/edu/student/' + studentId + '/resources',
    method: 'get'
  })
}

export function saveStudentResources(studentId, data) {
  return request({
    url: '/edu/student/' + studentId + '/resources',
    method: 'put',
    data
  })
}
