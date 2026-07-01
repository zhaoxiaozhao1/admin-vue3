import request from '@/utils/request'

export function getQuestionBankState() {
  return request({
    url: '/edu/question-bank/state',
    method: 'get'
  })
}

export function saveQuestionBankState(state) {
  return request({
    url: '/edu/question-bank/state',
    method: 'put',
    data: { state: JSON.stringify(state) }
  })
}
