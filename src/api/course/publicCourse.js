import request from '@/utils/request'

export function listPublicCourse(query) {
  return request({
    url: '/edu/publicCourse/list',
    method: 'get',
    params: query
  })
}

export function getPublicCourse(lessonId) {
  return request({
    url: '/edu/publicCourse/' + lessonId,
    method: 'get'
  })
}

export function addPublicCourse(data) {
  return request({
    url: '/edu/publicCourse',
    method: 'post',
    data
  })
}

export function updatePublicCourse(data) {
  return request({
    url: '/edu/publicCourse',
    method: 'put',
    data
  })
}

export function delPublicCourse(lessonIds) {
  return request({
    url: '/edu/publicCourse/' + lessonIds,
    method: 'delete'
  })
}

export function getPublicCourseMonitor(lessonId) {
  return request({
    url: '/edu/publicCourse/' + lessonId + '/monitor',
    method: 'get'
  })
}

export function getPublicCourseData(lessonId) {
  return request({
    url: '/edu/publicCourse/' + lessonId + '/data',
    method: 'get'
  })
}

export function getPublicCourseReport(lessonId) {
  return request({
    url: '/edu/publicCourse/' + lessonId + '/report',
    method: 'get'
  })
}
