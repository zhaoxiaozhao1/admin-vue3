<template>
  <div class="app-container public-course-page">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" class="query-bar">
      <el-form-item label="课堂名称" prop="lessonName">
        <el-input v-model="queryParams.lessonName" placeholder="请输入课堂名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="授课教师" prop="teacherId">
        <el-select v-model="queryParams.teacherId" placeholder="请输入姓名/手机号/邮箱" clearable filterable style="width: 200px">
          <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
        </el-select>
      </el-form-item>
      <el-form-item label="联席教师" prop="coTeacherKeyword">
        <el-input v-model="queryParams.coTeacherKeyword" placeholder="请输入姓名/手机号/邮箱" clearable style="width: 190px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="学生" prop="studentKeyword">
        <el-input v-model="queryParams.studentKeyword" placeholder="请输入姓名/手机号/邮箱/学号" clearable style="width: 210px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="lessonStatus">
        <el-select v-model="queryParams.lessonStatus" placeholder="全部" clearable style="width: 130px">
          <el-option label="未开始" value="0" />
          <el-option label="进行中" value="1" />
          <el-option label="已结束" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="开课日期">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 250px" />
      </el-form-item>
      <el-form-item label="开课时间">
        <el-time-picker v-model="timeRange" value-format="HH:mm" format="HH:mm" is-range range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 230px" />
      </el-form-item>
      <el-form-item label="星期" prop="weekday">
        <el-select v-model="queryParams.params.weekday" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="day in weekdays" :key="day.value" :label="day.label" :value="day.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="labelName">
        <el-select v-model="queryParams.labelName" placeholder="请选择标签" clearable filterable style="width: 150px">
          <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelName" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="course-panel">
      <div class="panel-toolbar">
        <strong>公开课（{{ total }}）</strong>
        <div class="panel-actions">
          <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['edu:public:add']">创建公开课</el-button>
          <el-dropdown :disabled="!ids.length" @command="handleBatch">
            <el-button :disabled="!ids.length">批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="remove">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" link icon="Download" @click="handleExport" v-hasPermi="['edu:public:export']">导出Excel</el-button>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
        </div>
      </div>

      <el-table v-loading="loading" :data="courseList" @selection-change="handleSelectionChange" height="620">
        <el-table-column type="selection" width="46" align="center" />
        <el-table-column label="序号" width="70" align="center">
          <template #default="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="课堂名称" min-width="170" prop="lessonName" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">{{ statusLabel(scope.row.lessonStatus) }}</template>
        </el-table-column>
        <el-table-column label="开课日期" width="135">
          <template #default="scope">{{ formatDate(scope.row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="开课时间" width="95">
          <template #default="scope">{{ formatClock(scope.row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="课堂时长" width="95">
          <template #default="scope">{{ durationLabel(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="授课教师" min-width="155">
          <template #default="scope">
            <div>{{ scope.row.teacherName || '--' }}</div>
            <div class="muted">{{ scope.row.teacherPhone || scope.row.teacherEmail || '' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="联席教师" min-width="130">
          <template #default="scope">{{ scope.row.coTeacherNames || '--' }}</template>
        </el-table-column>
        <el-table-column label="学生" width="80" align="center">
          <template #default="scope">
            <el-popover v-if="studentCount(scope.row)" trigger="hover" placement="top" width="270" popper-class="student-popover">
              <template #reference>
                <el-button link type="primary">{{ studentCount(scope.row) }}</el-button>
              </template>
              <div class="student-card" v-for="item in studentItems(scope.row)" :key="item.name + item.phone">
                <div class="student-avatar"></div>
                <div>
                  <div class="student-name">{{ item.displayName }}</div>
                  <div class="student-phone">{{ item.phone ? '+86 ' + item.phone : item.name }}</div>
                </div>
              </div>
            </el-popover>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="学生报名方式" width="130">
          <template #default="scope">{{ signupLabel(scope.row.signupMode) }}</template>
        </el-table-column>
        <el-table-column label="默认展示座位席" width="140">
          <template #default="scope">{{ scope.row.autoSeat === '0' ? '关闭' : '开启' }}{{ scope.row.autoStage === '1' ? '(自动上台)' : '(非自动上台)' }}</template>
        </el-table-column>
        <el-table-column label="台上人数" width="95">
          <template #default="scope">{{ scope.row.stageSize || '1v8' }}</template>
        </el-table-column>
        <el-table-column label="云端录课" min-width="170">
          <template #default="scope">
            <div><span class="dot" :class="{ on: scope.row.recordClassroom === '1' }"></span>{{ scope.row.recordClassroom === '1' ? '已开启' : '未开启' }}录制ClassIn教室</div>
            <div><span class="dot" :class="{ on: scope.row.recordSite === '1' }"></span>{{ scope.row.recordSite === '1' ? '已开启' : '未开启' }}录制现场</div>
          </template>
        </el-table-column>
        <el-table-column label="直播/回放" min-width="140">
          <template #default="scope">
            <div><span class="dot" :class="{ on: scope.row.liveEnabled === '1' }"></span>{{ scope.row.liveEnabled === '1' ? '已开启' : '未开启' }}直播</div>
            <div><span class="dot" :class="{ on: scope.row.replayEnabled === '1' }"></span>{{ scope.row.replayEnabled === '1' ? '已开启' : '未开启' }}回放</div>
          </template>
        </el-table-column>
        <el-table-column label="云盘资源" min-width="120">
          <template #default="scope">{{ scope.row.cloudResourceNames || '未设置' }}</template>
        </el-table-column>
        <el-table-column label="回放观看名单" width="120" align="center">
          <template #default="scope">{{ scope.row.playbackViews || 0 }}</template>
        </el-table-column>
        <el-table-column label="标签" min-width="110">
          <template #default="scope">{{ scope.row.labelNames || '--' }}</template>
        </el-table-column>
        <el-table-column label="课堂简介" min-width="160" prop="remark" show-overflow-tooltip />
        <el-table-column label="创建人" min-width="150">
          <template #default="scope">
            <div>{{ scope.row.createBy || '--' }}</div>
            <div class="muted">{{ parseTime(scope.row.createTime) || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="scope">
            <el-dropdown @command="cmd => handleRowCommand(cmd, scope.row)">
              <el-button link type="primary">操作<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="monitor">监课数据</el-dropdown-item>
                  <el-dropdown-item command="data">课堂数据</el-dropdown-item>
                  <el-dropdown-item command="report">课堂报告</el-dropdown-item>
                  <el-dropdown-item command="edit" divided>编辑</el-dropdown-item>
                  <el-dropdown-item command="remove">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="780px" append-to-body>
      <el-form ref="courseRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="公开课名称" prop="lessonName">
          <el-input v-model="form.lessonName" maxlength="90" show-word-limit placeholder="请输入公开课名称" />
        </el-form-item>
        <el-form-item label="开课时间" prop="startTime">
          <el-date-picker v-model="form.startTime" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" placeholder="请选择开课时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="课堂时长">
          <el-select v-model="durationHour" style="width: 100px">
            <el-option v-for="n in 10" :key="n - 1" :label="n - 1" :value="n - 1" />
          </el-select>
          <span class="duration-unit">小时</span>
          <el-select v-model="durationMinute" style="width: 100px">
            <el-option v-for="m in minuteOptions" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="duration-unit">分钟</span>
          <span class="muted">下课时间：{{ previewEndTime }}</span>
        </el-form-item>
        <el-form-item label="授课教师">
          <el-select v-model="form.teacherId" placeholder="设置授课教师" clearable filterable style="width: 100%">
            <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
          </el-select>
        </el-form-item>
        <el-form-item label="联席教师">
          <el-select v-model="coTeachers" multiple filterable allow-create default-first-option placeholder="设置联席教师" style="width: 100%">
            <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherName" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认展示座位席">
          <el-switch v-model="form.autoSeat" active-value="1" inactive-value="0" />
          <el-checkbox v-model="form.autoStage" true-label="1" false-label="0" class="auto-stage">学生自动上台</el-checkbox>
        </el-form-item>
        <el-form-item label="台上人数">
          <el-select v-model="form.stageSize" style="width: 180px">
            <el-option v-for="item in stageOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="学生">
          <el-select v-model="students" multiple filterable allow-create default-first-option placeholder="添加学生" style="width: 100%">
            <el-option v-for="item in studentOptions" :key="item.studentId" :label="studentLabel(item)" :value="item.studentName" />
          </el-select>
        </el-form-item>
        <el-form-item label="学生报名方式">
          <el-radio-group v-model="form.signupMode">
            <el-radio-button label="closed">报名截止</el-radio-button>
            <el-radio-button label="open">允许报名</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="云盘资源">
          <el-select v-model="cloudResources" multiple placeholder="选择云盘资源" style="width: 100%">
            <el-option label="组织云盘" value="组织云盘" />
            <el-option label="资源中心" value="资源中心" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="labels" multiple filterable allow-create default-first-option placeholder="选择标签，最多10个" :multiple-limit="10" style="width: 100%">
            <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelName" />
          </el-select>
        </el-form-item>
        <el-form-item label="云端录课">
          <el-checkbox v-model="form.recordClassroom" true-label="1" false-label="0">录制ClassIn教室</el-checkbox>
          <el-checkbox v-model="form.recordSite" true-label="1" false-label="0">录制现场</el-checkbox>
        </el-form-item>
        <el-form-item label="直播/回放">
          <el-checkbox v-model="form.liveEnabled" true-label="1" false-label="0">直播</el-checkbox>
          <el-checkbox v-model="form.replayEnabled" true-label="1" false-label="0">回放</el-checkbox>
        </el-form-item>
        <el-form-item label="课堂简介">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportOpen" title="课堂报告" width="820px" append-to-body>
      <el-table :data="reportRows" border>
        <el-table-column label="姓名" min-width="150">
          <template #default="{ row }"><el-link type="primary" :underline="false">{{ row.name }}</el-link></template>
        </el-table-column>
        <el-table-column label="手机号" min-width="150" prop="phone" />
        <el-table-column label="邮箱" min-width="150"><template #default>--</template></el-table-column>
        <el-table-column label="身份" min-width="150" prop="role" />
        <el-table-column label="课堂报告" min-width="150">
          <template #default><el-button link type="primary" icon="Monitor" /></template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'PublicCourse' })

import { ArrowDown } from '@element-plus/icons-vue'
import { parseTime } from '@/utils/ruoyi'
import { listClassTeacherOptions, listClassStudentOptions, listClassLabels } from '@/api/course/class'
import {
  listPublicCourse,
  getPublicCourse,
  addPublicCourse,
  updatePublicCourse,
  delPublicCourse,
  getPublicCourseReport
} from '@/api/course/publicCourse'

const { proxy } = getCurrentInstance()
const router = useRouter()

const courseList = ref([])
const teacherOptions = ref([])
const studentOptions = ref([])
const labelOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const total = ref(0)
const open = ref(false)
const reportOpen = ref(false)
const title = ref('')
const reportRows = ref([])
const dateRange = ref([])
const timeRange = ref([])
const durationHour = ref(0)
const durationMinute = ref(30)
const coTeachers = ref([])
const students = ref([])
const labels = ref([])
const cloudResources = ref([])

const weekdays = [
  { label: '周一', value: '1' },
  { label: '周二', value: '2' },
  { label: '周三', value: '3' },
  { label: '周四', value: '4' },
  { label: '周五', value: '5' },
  { label: '周六', value: '6' },
  { label: '周日', value: '7' }
]
const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const stageOptions = ['1v1(高清)', '1v2', '1v3', '1v4', '1v5', '1v6', '1v6(高清)', '1v7', '1v8', '1v9', '1v10']

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 50,
    lessonName: undefined,
    lessonStatus: undefined,
    teacherId: undefined,
    coTeacherKeyword: undefined,
    studentKeyword: undefined,
    labelName: undefined,
    params: {}
  },
  rules: {
    lessonName: [
      { required: true, message: '公开课名称不能为空', trigger: 'blur' },
      { max: 90, message: '公开课名称不能超过90个字符', trigger: 'blur' }
    ],
    startTime: [{ required: true, message: '请选择开课时间', trigger: 'change' }]
  }
})

const { form, queryParams, rules } = toRefs(data)

const previewEndTime = computed(() => form.value.startTime ? parseTime(buildEndTime(), '{h}:{i}') : '--')

function getList() {
  loading.value = true
  listPublicCourse(buildQuery()).then(response => {
    courseList.value = response.rows || []
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function loadOptions() {
  listClassTeacherOptions({ teacherStatus: '0' }).then(res => { teacherOptions.value = res.data || [] })
  listClassStudentOptions({ studentStatus: '0' }).then(res => { studentOptions.value = res.data || [] })
  listClassLabels().then(res => { labelOptions.value = res.data || [] })
}

function buildQuery() {
  const params = { ...queryParams.value, params: { ...queryParams.value.params } }
  if (dateRange.value?.length === 2) {
    params.params.beginStartTime = dateRange.value[0] + ' 00:00:00'
    params.params.endStartTime = dateRange.value[1] + ' 23:59:59'
  }
  if (timeRange.value?.length === 2) {
    params.params.beginClock = timeRange.value[0]
    params.params.endClock = timeRange.value[1]
  }
  return params
}

function reset() {
  form.value = {
    lessonId: undefined,
    lessonName: undefined,
    lessonType: 'public',
    lessonStatus: '0',
    teacherId: undefined,
    startTime: undefined,
    endTime: undefined,
    signupMode: 'closed',
    autoSeat: '1',
    autoStage: '1',
    stageSize: '1v8',
    recordClassroom: '0',
    recordSite: '0',
    liveEnabled: '0',
    replayEnabled: '0',
    playbackViews: 0,
    remark: undefined
  }
  durationHour.value = 0
  durationMinute.value = 30
  coTeachers.value = []
  students.value = []
  labels.value = []
  cloudResources.value = []
  proxy.resetForm('courseRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  dateRange.value = []
  timeRange.value = []
  proxy.resetForm('queryRef')
  queryParams.value.params = {}
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.lessonId)
}

function handleAdd() {
  reset()
  title.value = '创建公开课'
  open.value = true
}

function handleUpdate(row) {
  reset()
  getPublicCourse(row.lessonId).then(response => {
    form.value = { ...form.value, ...(response.data || {}) }
    coTeachers.value = splitNames(form.value.coTeacherNames)
    students.value = splitNames(form.value.studentNames)
    labels.value = splitNames(form.value.labelNames)
    cloudResources.value = splitNames(form.value.cloudResourceNames)
    setDuration(form.value)
    title.value = '修改公开课'
    open.value = true
  })
}

function submitForm() {
  proxy.$refs.courseRef.validate(valid => {
    if (!valid) return
    form.value.endTime = buildEndTime()
    form.value.coTeacherNames = coTeachers.value.join(',')
    form.value.studentNames = students.value.join(',')
    form.value.labelNames = labels.value.join(',')
    form.value.cloudResourceNames = cloudResources.value.join(',')
    const req = form.value.lessonId ? updatePublicCourse : addPublicCourse
    req(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.lessonId ? '修改成功' : '创建成功')
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
}

function handleDelete(row) {
  const lessonIds = row?.lessonId || ids.value
  proxy.$modal.confirm('确认删除公开课"' + (row?.lessonName || lessonIds) + '"吗？').then(() => delPublicCourse(lessonIds)).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

function handleBatch(command) {
  if (command === 'remove') handleDelete()
}

function handleExport() {
  proxy.download('edu/publicCourse/export', buildQuery(), `public_course_${Date.now()}.xlsx`)
}

function handleRowCommand(command, row) {
  if (command === 'edit') return handleUpdate(row)
  if (command === 'remove') return handleDelete(row)
  if (command === 'report') return openReport(row)
  openActionPage(command, row)
}

function openActionPage(action, row) {
  const route = router.resolve({
    name: 'PublicCourseAction',
    params: { action, lessonId: row.lessonId }
  })
  window.open(route.href, '_blank')
}

function openReport(row) {
  getPublicCourseReport(row.lessonId).then(res => {
    const data = res.data || row
    reportRows.value = [{
      name: maskPhone(data.teacherPhone || row.teacherPhone || '13811587556'),
      phone: data.teacherPhone || row.teacherPhone || '13811587556',
      role: '授课教师'
    }]
    reportOpen.value = true
  })
}

function buildEndTime() {
  const start = toDate(form.value.startTime)
  if (!start) return undefined
  start.setMinutes(start.getMinutes() + Number(durationHour.value || 0) * 60 + Number(durationMinute.value || 0))
  return formatDateTime(start)
}

function setDuration(row) {
  const start = toDate(row.startTime)
  const end = toDate(row.endTime)
  if (!start || !end) return
  const minutes = Math.max(0, Math.round((end - start) / 60000))
  durationHour.value = Math.floor(minutes / 60)
  durationMinute.value = minutes % 60
}

function teacherLabel(item) {
  return item.teacherName + (item.phone ? ' / ' + item.phone : '')
}

function studentLabel(item) {
  return item.studentName + (item.phone ? ' / ' + item.phone : '')
}

function statusLabel(status) {
  return { 0: '未开始', 1: '进行中', 2: '已结束' }[status] || '未开始'
}

function signupLabel(mode) {
  return mode === 'open' ? '允许报名' : '报名截止'
}

function splitNames(value) {
  return value ? value.split(/[,，]/).map(item => item.trim()).filter(Boolean) : []
}

function studentCount(row) {
  return splitNames(row.studentNames).length
}

function studentItems(row) {
  return splitNames(row.studentNames).map(name => {
    const student = studentOptions.value.find(item => item.studentName === name || item.phone === name)
    const phone = student?.phone || (/^\d{7,}$/.test(name) ? name : '')
    return {
      name,
      phone,
      displayName: phone ? maskPhone(phone) : name
    }
  })
}

function maskPhone(phone) {
  return String(phone).replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2')
}

function durationLabel(row) {
  const start = toDate(row.startTime)
  const end = toDate(row.endTime)
  if (!start || !end) return '--'
  const minutes = Math.max(0, Math.round((end - start) / 60000))
  if (minutes >= 60 && minutes % 60 === 0) return minutes / 60 + '小时'
  return minutes + '分钟'
}

function formatDate(value) {
  const date = toDate(value)
  if (!date) return '--'
  return parseTime(date, '{y}-{m}-{d}') + ' (' + weekdays[(date.getDay() + 6) % 7].label + ')'
}

function formatClock(value) {
  return value ? parseTime(value, '{h}:{i}') : '--'
}

function toDate(value) {
  if (!value) return null
  return value instanceof Date ? value : new Date(String(value).replace(/-/g, '/'))
}

function formatDateTime(date) {
  return parseTime(date, '{y}-{m}-{d} {h}:{i}:{s}')
}

loadOptions()
getList()
</script>

<style scoped>
.query-bar {
  padding: 10px 0 4px;
}

.course-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
}

.panel-toolbar {
  min-height: 54px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.muted {
  color: #909399;
  font-size: 12px;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: #f56c6c;
  vertical-align: middle;
}

.dot.on {
  background: #13ae7f;
}

.duration-unit {
  margin: 0 12px 0 6px;
}

.auto-stage {
  margin-left: 16px;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
}

.student-card + .student-card {
  margin-top: 10px;
}

.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #d9d9d9;
  position: relative;
  flex: 0 0 36px;
}

.student-avatar::before,
.student-avatar::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
}

.student-avatar::before {
  top: 9px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.student-avatar::after {
  bottom: 8px;
  width: 18px;
  height: 9px;
  border-radius: 9px 9px 3px 3px;
}

.student-name {
  color: #303133;
  font-size: 16px;
  line-height: 22px;
}

.student-phone {
  color: #909399;
  font-size: 15px;
  line-height: 22px;
}
</style>
