<template>
  <div class="app-container student-detail-page">
    <div class="detail-crumb">
      <el-link type="primary" :underline="false" @click="goBack">学生管理</el-link>
      <span>&gt;</span>
      <span>{{ student.studentName || '学生详情' }}</span>
    </div>

    <section v-loading="loading" class="student-summary">
      <div class="summary-head">
        <h2>{{ student.studentName || '--' }}</h2>
        <el-button link type="primary" icon="Edit" @click="goEdit">编辑</el-button>
      </div>
      <el-row :gutter="24" class="summary-grid">
        <el-col :span="6">
          <div class="summary-label">手机</div>
          <div class="summary-value">{{ formatPhone(student) }}</div>
        </el-col>
        <el-col :span="6">
          <div class="summary-label">邮箱</div>
          <div class="summary-value">{{ student.email || '--' }}</div>
        </el-col>
        <el-col :span="6">
          <div class="summary-label">学生标签</div>
          <div class="summary-value">{{ student.labelNames || '--' }}</div>
        </el-col>
        <el-col :span="6">
          <div class="summary-label">学号</div>
          <div class="summary-value">{{ student.studentNo || '--' }}</div>
        </el-col>
      </el-row>
      <el-row :gutter="24" class="metric-grid">
        <el-col :span="6"><strong>{{ student.classJoined || 0 }}/{{ student.classTotal || 0 }}</strong><span>参与班级进度</span></el-col>
        <el-col :span="6"><strong>{{ student.lessonJoined || 0 }}/{{ student.lessonTotal || 0 }}</strong><span>参与课堂进度</span></el-col>
        <el-col :span="6"><strong>{{ attendanceText }}</strong><span>出勤/缺勤/迟到/早退</span></el-col>
        <el-col :span="6"><strong>{{ student.resourceCount || 0 }}</strong><span>个人授权资源</span></el-col>
      </el-row>
    </section>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="课堂列表" name="lessons">
        <div class="table-title">课堂数({{ lessons.length }})</div>
        <el-table :data="lessons" border>
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column label="课堂名称" prop="lessonName" min-width="180" show-overflow-tooltip />
          <el-table-column label="班级名称" min-width="140" show-overflow-tooltip>
            <template #default="scope">
              <el-link v-if="scope.row.classId" type="primary" :underline="false" @click="openClass(scope.row.classId)">
                {{ scope.row.className || '--' }}
              </el-link>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="开课日期" width="120" align="center">
            <template #default="scope">{{ dateOnly(scope.row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="时间" width="90" align="center">
            <template #default="scope">{{ timeOnly(scope.row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="时长" width="90" align="center">
            <template #default="scope">{{ lessonDuration(scope.row) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope">{{ lessonStatus(scope.row.lessonStatus) }}</template>
          </el-table-column>
          <el-table-column label="授课教师" prop="teacherName" min-width="130" show-overflow-tooltip />
          <el-table-column label="实际上课时长" width="120" align="center"><template #default>--</template></el-table-column>
          <el-table-column label="出勤" width="80" align="center"><template #default>--</template></el-table-column>
          <el-table-column label="迟到" width="80" align="center"><template #default>--</template></el-table-column>
          <el-table-column label="早退" width="80" align="center"><template #default>--</template></el-table-column>
          <el-table-column label="教师评分" width="90" align="center"><template #default>--</template></el-table-column>
          <el-table-column label="学习报告" width="90" align="center"><template #default>--</template></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="日历课表" name="calendar">
        <div v-if="calendarDays.length" class="calendar-list">
          <div v-for="day in calendarDays" :key="day.date" class="calendar-day">
            <div class="calendar-date">{{ day.date }}</div>
            <div class="calendar-lessons">
              <div v-for="lesson in day.items" :key="lesson.lessonId" class="calendar-item">
                <span>{{ timeOnly(lesson.startTime) }}</span>
                <strong>{{ lesson.lessonName }}</strong>
                <em>{{ lessonStatus(lesson.lessonStatus) }}</em>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无数据" />
      </el-tab-pane>
      <el-tab-pane label="所在班级" name="classes">
        <el-table :data="classes" border>
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column label="班级名称" min-width="180">
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="openClass(scope.row.classId)">{{ scope.row.className }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="scope">{{ scope.row.classStatus === '1' ? '已结课' : '开班中' }}</template>
          </el-table-column>
          <el-table-column label="课堂进度" width="120" align="center">
            <template #default="scope">{{ scope.row.lessonFinished || 0 }}/{{ scope.row.lessonTotal || 0 }}</template>
          </el-table-column>
          <el-table-column label="授课教师" prop="teacherNames" min-width="180" show-overflow-tooltip />
          <el-table-column label="学员数" prop="studentCount" width="90" align="center" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { getStudent, listStudentClasses, listStudentLessons } from '@/api/course/student'

defineOptions({ name: 'StudentManagementDetails' })

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const activeTab = ref('lessons')
const student = ref({})
const lessons = ref([])
const classes = ref([])

const studentId = computed(() => route.query.studentId)
const attendanceText = computed(() => [student.value.attendCount, student.value.absentCount, student.value.lateCount, student.value.leaveEarlyCount].map(v => v || 0).join('/'))
const calendarDays = computed(() => {
  const groups = {}
  lessons.value.forEach(item => {
    const date = dateOnly(item.startTime)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  })
  return Object.keys(groups).sort().map(date => ({ date, items: groups[date] }))
})

function loadDetail() {
  if (!studentId.value) {
    return
  }
  loading.value = true
  getStudent(studentId.value).then(studentRes => {
    student.value = studentRes.data || {}
    return Promise.allSettled([
      listStudentLessons(studentId.value),
      listStudentClasses(studentId.value)
    ])
  }).then(([lessonRes, classRes]) => {
    lessons.value = lessonRes.status === 'fulfilled' ? (lessonRes.value.data || []) : []
    classes.value = classRes.status === 'fulfilled' ? (classRes.value.data || []) : []
  }).finally(() => {
    loading.value = false
  })
}

function formatPhone(row) {
  return row.phone ? (row.phoneAreaCode || '+86') + row.phone : '--'
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '--'
}

function timeOnly(value) {
  return value ? String(value).slice(11, 16) : '--'
}

function lessonDuration(row) {
  const start = new Date(row.startTime).getTime()
  const end = new Date(row.endTime).getTime()
  if (!start || !end || end <= start) {
    return '--'
  }
  return Math.round((end - start) / 60000) + '分'
}

function lessonStatus(status) {
  return { 0: '未开始', 1: '进行中', 2: '已结束' }[status] || status || '--'
}

function openClass(classId) {
  const resolved = router.resolve({ path: `/fullPage/teaching/course/detail/${classId}/lesson` })
  window.open(resolved.href, '_blank')
}

function goBack() {
  router.push('/course/student')
}

function goEdit() {
  router.push({ path: '/course/student', query: { editStudentId: studentId.value } })
}

loadDetail()
</script>

<style scoped>
.student-detail-page {
  background: #f6f7f9;
  min-height: calc(100vh - 84px);
}

.detail-crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #606266;
}

.student-summary,
.detail-tabs {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 18px 22px;
}

.summary-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-head h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.summary-grid {
  margin-top: 18px;
}

.summary-label,
.metric-grid span {
  color: #909399;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  color: #303133;
}

.metric-grid {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #ebeef5;
}

.metric-grid :deep(.el-col) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-grid strong {
  font-size: 22px;
  font-weight: 500;
  color: #303133;
}

.detail-tabs {
  margin-top: 12px;
}

.table-title {
  margin-bottom: 10px;
  font-weight: 600;
  color: #303133;
}

.calendar-list {
  border: 1px solid #ebeef5;
}

.calendar-day {
  display: grid;
  grid-template-columns: 160px 1fr;
  border-bottom: 1px solid #ebeef5;
}

.calendar-day:last-child {
  border-bottom: 0;
}

.calendar-date {
  padding: 14px;
  background: #fafafa;
  color: #606266;
}

.calendar-lessons {
  padding: 8px 14px;
}

.calendar-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 34px;
}

.calendar-item span,
.calendar-item em {
  color: #909399;
  font-style: normal;
}
</style>
