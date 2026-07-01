import request from '@/utils/request'

export function listClass(query) {
  return request({
    url: '/edu/class/list',
    method: 'get',
    params: query
  })
}

export function getClass(classId) {
  return request({
    url: '/edu/class/' + classId,
    method: 'get'
  })
}

export function getClassOverview(classId) {
  return request({
    url: '/edu/class/' + classId + '/overview',
    method: 'get'
  })
}

export function addClass(data) {
  return request({
    url: '/edu/class',
    method: 'post',
    data
  })
}

export function updateClass(data) {
  return request({
    url: '/edu/class',
    method: 'put',
    data
  })
}

export function delClass(classIds) {
  return request({
    url: '/edu/class/' + classIds,
    method: 'delete'
  })
}

export function finishClass(classId) {
  return request({
    url: '/edu/class/' + classId + '/finish',
    method: 'put'
  })
}

export function batchFinishClass(classIds) {
  return request({
    url: '/edu/class/batchFinish/' + classIds,
    method: 'put'
  })
}

export function listClassLabels() {
  return request({
    url: '/edu/class/label/options',
    method: 'get'
  })
}

export function listClassTeacherOptions(query) {
  return request({
    url: '/edu/class/teacherOptions',
    method: 'get',
    params: query
  })
}

export function listClassStudentOptions(query) {
  return request({
    url: '/edu/class/studentOptions',
    method: 'get',
    params: query
  })
}

export function listClassResources(classId) {
  return request({
    url: '/edu/class/' + classId + '/resources',
    method: 'get'
  })
}

export function saveClassResources(classId, data) {
  return request({
    url: '/edu/class/' + classId + '/resources',
    method: 'put',
    data
  })
}

export function saveClassMembers(classId, data) {
  return request({
    url: '/edu/class/' + classId + '/members',
    method: 'put',
    data
  })
}

export function listClassLessons(classId) {
  return request({
    url: '/edu/class/' + classId + '/lessons',
    method: 'get'
  })
}

export function addClassLesson(classId, data) {
  return request({
    url: '/edu/class/' + classId + '/lesson',
    method: 'post',
    data
  })
}

export function listLessonTransferStudents(lessonId) {
  return request({
    url: '/edu/class/lesson/' + lessonId + '/transferStudents',
    method: 'get'
  })
}

export function saveLessonTransferStudents(lessonId, data) {
  return request({
    url: '/edu/class/lesson/' + lessonId + '/transferStudents',
    method: 'put',
    data
  })
}

export function createDualChildren(parentLessonId, data) {
  return request({
    url: '/edu/class/dual/' + parentLessonId + '/children',
    method: 'post',
    data
  })
}
