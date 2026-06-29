import request from '@/utils/request'

export function listTeacher(query) {
  return request({
    url: '/edu/teacher/list',
    method: 'get',
    params: query
  })
}

export function getTeacher(teacherId) {
  return request({
    url: '/edu/teacher/' + teacherId,
    method: 'get'
  })
}

export function addTeacher(data) {
  return request({
    url: '/edu/teacher',
    method: 'post',
    data
  })
}

export function updateTeacher(data) {
  return request({
    url: '/edu/teacher',
    method: 'put',
    data
  })
}

export function delTeacher(teacherIds) {
  return request({
    url: '/edu/teacher/' + teacherIds,
    method: 'delete'
  })
}

export function disableTeacher(teacherId) {
  return request({
    url: '/edu/teacher/' + teacherId + '/disable',
    method: 'put'
  })
}

export function enableTeacher(teacherId) {
  return request({
    url: '/edu/teacher/' + teacherId + '/enable',
    method: 'put'
  })
}

export function batchAddTeacher(data) {
  return request({
    url: '/edu/teacher/batchAdd',
    method: 'post',
    data
  })
}

export function listTeacherLabels() {
  return request({
    url: '/edu/teacher/label/options',
    method: 'get'
  })
}

export function getTeacherResourceSetting() {
  return request({
    url: '/edu/teacher/resource/setting',
    method: 'get'
  })
}

export function saveTeacherResourceSetting(data) {
  return request({
    url: '/edu/teacher/resource/setting',
    method: 'put',
    data
  })
}

export function listTeacherResources(teacherId) {
  return request({
    url: '/edu/teacher/' + teacherId + '/resources',
    method: 'get'
  })
}

export function saveTeacherResources(teacherId, data) {
  return request({
    url: '/edu/teacher/' + teacherId + '/resources',
    method: 'put',
    data
  })
}

export function updateTeacherPublicResource(teacherId, publicResourceEnabled) {
  return request({
    url: '/edu/teacher/' + teacherId + '/publicResource',
    method: 'put',
    data: { publicResourceEnabled }
  })
}
