<template>
  <div class="app-container lesson-page">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" class="lesson-query">
      <el-form-item label="课堂名称" prop="lessonName">
        <el-input v-model="queryParams.lessonName" placeholder="请输入课堂名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="班级名称" prop="className">
        <el-input v-model="queryParams.className" placeholder="请输入班级名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="授课教师" prop="teacherId">
        <el-select v-model="queryParams.teacherId" filterable clearable placeholder="请输入姓名/手机号/邮箱" style="width: 220px">
          <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
        </el-select>
      </el-form-item>
      <el-form-item label="学生" prop="studentKeyword">
        <el-input v-model="studentKeyword" placeholder="请输入姓名/手机号/邮箱/学号" clearable style="width: 220px" />
      </el-form-item>
      <el-form-item label="状态" prop="lessonStatus">
        <el-select v-model="queryParams.lessonStatus" clearable placeholder="全部" style="width: 140px">
          <el-option label="未开始" value="0" />
          <el-option label="进行中" value="1" />
          <el-option label="已结束" value="2" />
          <el-option label="草稿" value="draft" />
        </el-select>
      </el-form-item>
      <el-form-item label="开课日期">
        <el-date-picker v-model="lessonDateRange" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" />
      </el-form-item>
      <el-form-item label="星期">
        <el-select v-model="weekdayFilter" clearable placeholder="全部" style="width: 120px">
          <el-option label="周一" value="1" />
          <el-option label="周二" value="2" />
          <el-option label="周三" value="3" />
          <el-option label="周四" value="4" />
          <el-option label="周五" value="5" />
          <el-option label="周六" value="6" />
          <el-option label="周日" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="lesson-panel">
      <div class="panel-toolbar">
        <strong>课堂数（{{ displayLessons.length }}）</strong>
        <div class="panel-actions">
          <el-dropdown @command="batchCommand">
            <el-button :disabled="!ids.length">批量操作</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="delete">删除课堂</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" link icon="Download" @click="handleExport" v-hasPermi="['edu:lesson:export']">导出Excel</el-button>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </div>
      </div>

      <el-table v-loading="loading" :data="displayLessons" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="序号" width="70" align="center">
          <template #default="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="课堂名称" min-width="180" prop="lessonName" show-overflow-tooltip />
        <el-table-column label="所属班级" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link v-if="row.classId" type="primary" :underline="false" @click="openClass(row.classId)">{{ row.className || '--' }}</el-link>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="单元主题" min-width="170"><template #default>新课程 / 无单元主题</template></el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }"><el-tag :type="statusType(row.lessonStatus)" effect="plain">{{ statusLabel(row.lessonStatus) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="开课日期" min-width="150"><template #default="{ row }">{{ dateText(row) }}</template></el-table-column>
        <el-table-column label="开课时间" width="110"><template #default="{ row }">{{ timeText(row) }}</template></el-table-column>
        <el-table-column label="课堂时长" width="100"><template #default="{ row }">{{ duration(row) }}</template></el-table-column>
        <el-table-column label="授课教师" width="100" align="center">
          <template #default="{ row }"><UserCountPopover :users="teacherUsers(row)" /></template>
        </el-table-column>
        <el-table-column label="联席教师" width="100" align="center"><template #default>--</template></el-table-column>
        <el-table-column label="学生" width="100" align="center"><template #default="{ row }"><UserCountPopover :summary="row.studentSummary" type="student" /></template></el-table-column>
        <el-table-column label="旁听生" width="100" align="center"><template #default>--</template></el-table-column>
        <el-table-column label="默认展示座位席" min-width="190"><template #default>开启(自动上台,非全体静音)</template></el-table-column>
        <el-table-column label="台上人数" width="90"><template #default>1v8</template></el-table-column>
        <el-table-column label="云端录课" min-width="170"><template #default><div><span class="dot"></span>未开启录制ClassIn教室<br><span class="dot"></span>未开启录制现场</div></template></el-table-column>
        <el-table-column label="直播/回放" min-width="130"><template #default>未开启直播<br>未开启回放</template></el-table-column>
        <el-table-column label="云盘资源" width="100"><template #default>未设置</template></el-table-column>
        <el-table-column label="标签" min-width="120"><template #default="{ row }">{{ row.labelNames || '--' }}</template></el-table-column>
        <el-table-column label="课堂简介" min-width="160"><template #default="{ row }">{{ row.remark || '--' }}</template></el-table-column>
        <el-table-column label="创建人" min-width="160">
          <template #default="{ row }">
            <div>{{ row.createBy || '--' }}</div>
            <div class="muted">{{ parseTime(row.createTime) || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="openClass(row.classId)">操作</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup>
import { listClassTeacherOptions } from '@/api/course/class'
import { delLesson, listLesson } from '@/api/course/lesson'
import UserCountPopover from '@/views/course/components/UserCountPopover.vue'

defineOptions({ name: 'CourseLesson' })

const { proxy } = getCurrentInstance()
const router = useRouter()

const lessons = ref([])
const teacherOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const total = ref(0)
const lessonDateRange = ref([])
const studentKeyword = ref('')
const weekdayFilter = ref('')

const queryParams = reactive({
  pageNum: 1,
  pageSize: 50,
  lessonName: undefined,
  className: undefined,
  teacherId: undefined,
  lessonStatus: undefined
})

const displayLessons = computed(() => lessons.value.filter(row => {
  if (weekdayFilter.value && weekday(row.startTime) !== weekdayFilter.value) return false
  if (studentKeyword.value && !String(row.studentSummary || row.transferStudentNames || '').includes(studentKeyword.value)) return false
  return true
}))

function getList() {
  loading.value = true
  const params = { ...queryParams }
  if (lessonDateRange.value?.length === 2) {
    params.beginStartTime = `${lessonDateRange.value[0]} 00:00:00`
    params.endStartTime = `${lessonDateRange.value[1]} 23:59:59`
  }
  listLesson(params).then(response => {
    lessons.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function loadTeachers() {
  listClassTeacherOptions({ teacherStatus: '0' }).then(response => {
    teacherOptions.value = response.data || []
  })
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  lessonDateRange.value = []
  studentKeyword.value = ''
  weekdayFilter.value = ''
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.lessonId)
}

function batchCommand(command) {
  if (command === 'delete') handleDelete()
}

function handleDelete(row) {
  const lessonIds = row?.lessonId || ids.value
  proxy.$modal.confirm('确认删除课堂 "' + lessonIds + '" 吗？').then(() => delLesson(lessonIds)).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

function handleExport() {
  proxy.download('edu/lesson/export', queryParams, `lesson_${new Date().getTime()}.xlsx`)
}

function openClass(classId) {
  if (!classId) return
  const resolved = router.resolve({ path: `/fullPage/teaching/course/detail/${classId}/lesson` })
  window.open(resolved.href, '_blank')
}

function teacherLabel(item) {
  return item.teacherName + (item.phone ? ' / ' + item.phone : '')
}

function teacherUsers(row) {
  return row.teacherName ? [{ name: row.teacherName, phone: row.teacherPhone, email: row.teacherEmail }] : []
}

function statusLabel(status) {
  return { 0: '未开始', 1: '进行中', 2: '已结束', draft: '草稿' }[status] || '未开始'
}

function statusType(status) {
  return { 0: 'info', 1: 'success', 2: 'warning', draft: '' }[status] || 'info'
}

function weekday(value) {
  return value ? String(new Date(value).getDay()) : ''
}

function dateText(row) {
  if (!row.startTime) return '--'
  const day = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(row.startTime).getDay()]
  return `${String(row.startTime).slice(0, 10)} (${day})`
}

function timeText(row) {
  return row.startTime ? String(row.startTime).slice(11, 16) : '--'
}

function duration(row) {
  const start = new Date(row.startTime).getTime()
  const end = new Date(row.endTime).getTime()
  if (!start || !end || end <= start) return '--'
  return Math.round((end - start) / 60000) + '分钟'
}

loadTeachers()
getList()
</script>

<style scoped>
.lesson-query {
  padding: 4px 0 12px;
}

.lesson-panel {
  border: 1px solid #dcdfe6;
  background: #fff;
}

.panel-toolbar {
  min-height: 58px;
  padding: 0 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f6f7f8;
  border-bottom: 1px solid #dcdfe6;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f5222d;
  margin-right: 4px;
}

.muted {
  color: #909399;
  font-size: 12px;
}
</style>
