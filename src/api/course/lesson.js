import request from '@/utils/request'

export function listLesson(query) {
  return request({
    url: '/edu/lesson/list',
    method: 'get',
    params: query
  })
}

export function delLesson(lessonIds) {
  return request({
    url: '/edu/lesson/' + lessonIds,
    method: 'delete'
  })
}
