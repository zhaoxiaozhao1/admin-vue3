<template>
  <div class="app-container class-page">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="class-query">
      <el-form-item label="班级名称" prop="className">
        <el-input v-model="queryParams.className" placeholder="请输入班级名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="班主任" prop="headTeacherId">
        <el-select v-model="queryParams.headTeacherId" filterable clearable placeholder="姓名/手机/邮箱" style="width: 180px">
          <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
        </el-select>
      </el-form-item>
      <el-form-item label="班级教师" prop="teacherIds">
        <el-select v-model="queryParams.teacherIds" multiple collapse-tags clearable placeholder="请选择教师" style="width: 220px">
          <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
        </el-select>
      </el-form-item>
      <el-form-item label="班级学生" prop="studentIds">
        <el-select v-model="queryParams.studentIds" multiple collapse-tags clearable placeholder="请选择学生" style="width: 220px">
          <el-option v-for="item in studentOptions" :key="item.studentId" :label="studentLabel(item)" :value="item.studentId" />
        </el-select>
      </el-form-item>
      <el-form-item label="上课时间">
        <el-date-picker v-model="lessonRange" value-format="YYYY-MM-DD HH:mm:ss" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 340px" />
      </el-form-item>
      <el-form-item label="班级状态" prop="classStatus">
        <el-select v-model="queryParams.classStatus" clearable placeholder="全部" style="width: 130px">
          <el-option label="未结课" value="0" />
          <el-option label="已结课" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="labelIds">
        <el-select v-model="queryParams.labelIds" multiple collapse-tags clearable placeholder="请选择标签" style="width: 220px">
          <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="class-panel">
      <div class="panel-toolbar">
        <div class="panel-title">
          <strong>班级数（{{ total }}）</strong>
          <el-dropdown @command="handleBatchCommand">
            <el-button :disabled="multiple">批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="finish" v-hasPermi="['edu:class:finish']">批量结课</el-dropdown-item>
                <el-dropdown-item command="delete" v-hasPermi="['edu:class:remove']">批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="panel-actions">
          <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['edu:class:add']">创建班级</el-button>
          <el-button type="primary" link icon="Download" @click="handleExport" v-hasPermi="['edu:class:export']">导出Excel</el-button>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </div>
      </div>

      <el-table v-loading="loading" :data="classList" border class="class-table" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" align="center" fixed />
        <el-table-column label="序号" width="70" align="center" fixed>
          <template #default="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="班级名称" min-width="170" fixed show-overflow-tooltip>
          <template #default="scope">
            <el-link type="primary" :href="getClassDetailHref(scope.row, 'lesson')" target="_blank" :underline="false">{{ scope.row.className }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="班级状态" width="100" align="center">
          <template #default="scope"><el-tag :type="scope.row.classStatus === '1' ? 'info' : 'success'" effect="plain">{{ classStatusLabel(scope.row.classStatus) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="班级头像" width="100" align="center">
          <template #default="scope"><el-avatar :size="46" :src="avatarUrl(scope.row.cover)">{{ (scope.row.className || '班').slice(0, 1) }}</el-avatar></template>
        </el-table-column>
        <el-table-column label="首节课日期" width="170" align="center">
          <template #default="scope">{{ parseTime(scope.row.firstLessonDate) || '--' }}</template>
        </el-table-column>
        <el-table-column label="课堂进度" width="110" align="center">
          <template #default="scope">{{ scope.row.lessonFinished || 0 }}/{{ scope.row.lessonTotal || 0 }}</template>
        </el-table-column>
        <el-table-column label="班级有效期" width="130" align="center">
          <template #default="scope">{{ scope.row.validType === 'date' ? parseTime(scope.row.validEndDate, '{y}-{m}-{d}') : '永久有效' }}</template>
        </el-table-column>
        <el-table-column label="录课/直播/回放" width="130" align="center">
          <template #default="scope">{{ yesNo(scope.row.recordEnabled) }}/{{ yesNo(scope.row.liveEnabled) }}/{{ yesNo(scope.row.replayEnabled) }}</template>
        </el-table-column>
        <el-table-column label="班主任" min-width="140" prop="headTeacherName" show-overflow-tooltip />
        <el-table-column label="教师" width="100" align="center">
          <template #default="{ row }"><UserCountPopover :summary="row.memberSummary" type="teacher" /></template>
        </el-table-column>
        <el-table-column label="班级学生" width="100" align="center">
          <template #default="{ row }"><UserCountPopover :count="row.studentCount || 0" :summary="row.memberSummary" type="student" /></template>
        </el-table-column>
        <el-table-column label="旁听生" width="90" align="center">
          <template #default="{ row }"><UserCountPopover :count="row.auditorCount || 0" :summary="row.memberSummary" type="auditor" /></template>
        </el-table-column>
        <el-table-column label="标签" min-width="170">
          <template #default="scope">
            <template v-if="scope.row.labelNames">
              <el-tag v-for="name in scope.row.labelNames.split(',')" :key="name" size="small" effect="plain" class="tag-item">{{ name }}</el-tag>
            </template>
            <span v-else class="muted">--</span>
          </template>
        </el-table-column>
        <el-table-column label="创建&结课信息" min-width="190">
          <template #default="scope">
            <div>创建人：{{ scope.row.creatorName || scope.row.createBy || '--' }}</div>
            <div class="muted">{{ parseTime(scope.row.createTime) || '--' }}</div>
            <div v-if="scope.row.finishTime" class="muted">结课：{{ parseTime(scope.row.finishTime) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" align="center" fixed="right">
          <template #default="scope">
            <el-link type="primary" :href="getClassDetailHref(scope.row, 'lesson')" target="_blank" :underline="false" v-hasPermi="['edu:class:lesson']">班级详情</el-link>
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['edu:class:edit']">编辑</el-button>
            <el-button v-if="scope.row.classStatus !== '1'" link type="danger" @click="handleFinish(scope.row)" v-hasPermi="['edu:class:finish']">结课</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="980px" append-to-body>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础信息" name="base">
          <el-form ref="classRef" :model="form" :rules="rules" label-width="118px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="班级名称" prop="className">
                  <el-input v-model="form.className" maxlength="40" show-word-limit placeholder="请输入班级名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="班主任">
                  <el-select v-model="form.headTeacherId" filterable clearable placeholder="请选择班主任" style="width: 100%">
                    <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="班级头像">
                  <image-upload v-model="form.cover" :limit="1" :file-size="5" :is-show-tip="false" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="标签">
                  <el-select v-model="form.labelIds" multiple collapse-tags clearable :multiple-limit="10" placeholder="每个对象最多10个标签" style="width: 100%">
                    <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="班级简介">
                  <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="300" show-word-limit placeholder="请输入班级简介" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="成员" name="members">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="班级教师">
                <el-select v-model="form.teacherIds" multiple collapse-tags clearable placeholder="请选择教师" style="width: 100%">
                  <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="班级学生">
                <el-select v-model="form.studentIds" multiple collapse-tags clearable placeholder="请选择学生" style="width: 100%">
                  <el-option v-for="item in studentOptions" :key="item.studentId" :label="studentLabel(item)" :value="item.studentId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="旁听生">
                <el-select v-model="form.auditorIds" multiple collapse-tags clearable placeholder="请选择旁听生" style="width: 100%">
                  <el-option v-for="item in studentOptions" :key="item.studentId" :label="studentLabel(item)" :value="item.studentId" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>
        <el-tab-pane label="资源与有效期" name="resource">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="有效期">
                <el-select v-model="form.validType" style="width: 100%">
                  <el-option label="永久有效" value="forever" />
                  <el-option label="指定日期" value="date" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="有效至">
                <el-date-picker v-model="form.validEndDate" value-format="YYYY-MM-DD" type="date" :disabled="form.validType !== 'date'" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="自动结课天数">
                <el-input-number v-model="form.autoFinishDays" :min="1" :max="365" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="回放次数限制">
                <el-input-number v-model="form.replayLimit" :min="1" :max="20" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="课堂能力">
                <el-checkbox v-model="form.recordEnabled" true-label="1" false-label="0">录课</el-checkbox>
                <el-checkbox v-model="form.liveEnabled" true-label="1" false-label="0">直播</el-checkbox>
                <el-checkbox v-model="form.replayEnabled" true-label="1" false-label="0">回放</el-checkbox>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>
        <el-tab-pane label="高级设置" name="advanced">
          <div class="switch-grid">
            <el-checkbox v-model="form.allowStudentJoin" true-label="1" false-label="0">允许学生主动加入班级</el-checkbox>
            <el-checkbox v-model="form.allowMemberFriend" true-label="1" false-label="0">允许班级成员互加好友</el-checkbox>
            <el-checkbox v-model="form.allowTeacherAddLesson" true-label="1" false-label="0">允许教师添加课节/课堂</el-checkbox>
            <el-checkbox v-model="form.allowStudentEditNickname" true-label="1" false-label="0">允许学生修改班级昵称</el-checkbox>
            <el-checkbox v-model="form.allowLeftStudentView" true-label="1" false-label="0">离班后可查看课程内容</el-checkbox>
            <el-checkbox v-model="form.allowTempClassroom" true-label="1" false-label="0">允许开启临时教室</el-checkbox>
          </div>
          <el-form label-width="118px">
            <el-form-item label="教室配置">
              <el-input v-model="form.classroomSetting" placeholder="默认使用学校自定义教室配置" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="lessonTitle" v-model="lessonOpen" width="900px" append-to-body>
      <div class="lesson-toolbar">
        <el-button type="primary" plain icon="Plus" @click="openAddLesson" v-hasPermi="['edu:class:lesson']">添加课堂</el-button>
      </div>
      <el-table :data="lessonList" border max-height="420">
        <el-table-column label="课堂名称" min-width="180" prop="lessonName" show-overflow-tooltip />
        <el-table-column label="时间" min-width="240">
          <template #default="scope">{{ parseTime(scope.row.startTime) || '--' }} - {{ parseTime(scope.row.endTime) || '--' }}</template>
        </el-table-column>
        <el-table-column label="教师" min-width="120" prop="teacherName" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="scope">{{ lessonTypeLabel(scope.row.lessonType, scope.row.dualRole) }}</template>
        </el-table-column>
        <el-table-column label="子课堂" width="90" align="center" prop="childCount" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="openDual(scope.row)" v-hasPermi="['edu:class:dual']">批量子课堂</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog title="添加课堂" v-model="addLessonOpen" width="620px" append-to-body>
      <el-form :model="lessonForm" label-width="96px">
        <el-form-item label="课堂名称"><el-input v-model="lessonForm.lessonName" maxlength="80" /></el-form-item>
        <el-form-item label="上课时间"><el-date-picker v-model="lessonTimeRange" value-format="YYYY-MM-DD HH:mm:ss" type="datetimerange" style="width: 100%" /></el-form-item>
        <el-form-item label="授课教师">
          <el-select v-model="lessonForm.teacherId" clearable filterable style="width: 100%">
            <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitLesson">确定</el-button>
        <el-button @click="addLessonOpen = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog title="批量创建子课堂" v-model="dualOpen" width="760px" append-to-body>
      <div class="lesson-toolbar">
        <el-button type="primary" plain icon="Plus" :disabled="dualRows.length >= 100" @click="dualRows.push(createDualRow())">添加一行</el-button>
      </div>
      <el-table :data="dualRows" border max-height="360">
        <el-table-column label="子课堂名称" min-width="220"><template #default="scope"><el-input v-model="scope.row.lessonName" /></template></el-table-column>
        <el-table-column label="授课教师" min-width="220">
          <template #default="scope">
            <el-select v-model="scope.row.teacherId" filterable clearable style="width: 100%">
              <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center"><template #default="scope"><el-button link type="danger" @click="dualRows.splice(scope.$index, 1)">删除</el-button></template></el-table-column>
      </el-table>
      <template #footer>
        <el-button type="primary" @click="submitDual">确定</el-button>
        <el-button @click="dualOpen = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'CourseClass' })
import { useRouter } from 'vue-router'
import {
  listClass,
  getClass,
  addClass,
  updateClass,
  delClass,
  finishClass,
  batchFinishClass,
  listClassLabels,
  listClassTeacherOptions,
  listClassStudentOptions,
  listClassLessons,
  addClassLesson,
  createDualChildren
} from '@/api/course/class'
import UserCountPopover from '@/views/course/components/UserCountPopover.vue'

const { proxy } = getCurrentInstance()
const router = useRouter()
const baseUrl = import.meta.env.VITE_APP_BASE_API

const classList = ref([])
const teacherOptions = ref([])
const studentOptions = ref([])
const labelOptions = ref([])
const lessonList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const open = ref(false)
const lessonOpen = ref(false)
const addLessonOpen = ref(false)
const dualOpen = ref(false)
const title = ref('')
const lessonTitle = ref('')
const activeTab = ref('base')
const currentClassId = ref(undefined)
const currentParentLessonId = ref(undefined)
const lessonRange = ref([])
const lessonTimeRange = ref([])
const dualRows = ref([])

const data = reactive({
  form: {},
  lessonForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 50,
    className: undefined,
    headTeacherId: undefined,
    teacherIds: [],
    studentIds: [],
    classStatus: undefined,
    labelIds: []
  },
  rules: {
    className: [
      { required: true, message: '班级名称不能为空', trigger: 'blur' },
      { max: 40, message: '班级名称不能超过40个字符', trigger: 'blur' }
    ]
  }
})

const { form, lessonForm, queryParams, rules } = toRefs(data)

function getList() {
  loading.value = true
  const params = buildQuery()
  listClass(params).then(response => {
    classList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function buildQuery() {
  const params = { ...queryParams.value }
  if (Array.isArray(params.teacherIds)) params.teacherIds = params.teacherIds.join(',')
  if (Array.isArray(params.studentIds)) params.studentIds = params.studentIds.join(',')
  if (Array.isArray(params.labelIds)) params.labelIds = params.labelIds.join(',')
  if (lessonRange.value?.length === 2) {
    params.beginLessonTime = lessonRange.value[0]
    params.endLessonTime = lessonRange.value[1]
  }
  return params
}

function loadOptions() {
  listClassLabels().then(response => { labelOptions.value = response.data || [] })
  listClassTeacherOptions({ teacherStatus: '0' }).then(response => { teacherOptions.value = response.data || [] })
  listClassStudentOptions({ displayStatus: '0' }).then(response => { studentOptions.value = response.data || [] })
}

function reset() {
  form.value = {
    classId: undefined,
    className: undefined,
    classStatus: '0',
    cover: undefined,
    intro: undefined,
    headTeacherId: undefined,
    teacherIds: [],
    studentIds: [],
    auditorIds: [],
    labelIds: [],
    lessonFinished: 0,
    lessonTotal: 0,
    validType: 'forever',
    validEndDate: undefined,
    autoFinishDays: 1,
    replayLimit: 20,
    recordEnabled: '0',
    liveEnabled: '1',
    replayEnabled: '1',
    allowStudentJoin: '0',
    allowMemberFriend: '0',
    allowTeacherAddLesson: '1',
    allowStudentEditNickname: '0',
    allowLeftStudentView: '1',
    allowTempClassroom: '0',
    resourceScope: 'class',
    classroomSetting: undefined,
    remark: undefined
  }
  proxy.resetForm('classRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  lessonRange.value = []
  queryParams.value.teacherIds = []
  queryParams.value.studentIds = []
  queryParams.value.labelIds = []
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.classId)
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  title.value = '创建班级'
  activeTab.value = 'base'
  open.value = true
}

function handleUpdate(row) {
  reset()
  getClass(row.classId).then(response => {
    form.value = { ...form.value, ...(response.data || {}) }
    form.value.teacherIds = response.data?.teacherIds || []
    form.value.studentIds = response.data?.studentIds || []
    form.value.auditorIds = response.data?.auditorIds || []
    form.value.labelIds = response.data?.labelIds || []
    title.value = '修改班级'
    activeTab.value = 'base'
    open.value = true
  })
}

function submitForm() {
  proxy.$refs.classRef.validate(valid => {
    if (!valid) return
    const request = form.value.classId ? updateClass : addClass
    request(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.classId ? '修改成功' : '创建成功')
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
}

function handleFinish(row) {
  proxy.$modal.confirm('确认将班级 "' + row.className + '" 结课吗？').then(() => finishClass(row.classId)).then(() => {
    proxy.$modal.msgSuccess('结课成功')
    getList()
  }).catch(() => {})
}

function handleBatchCommand(command) {
  if (command === 'delete') {
    proxy.$modal.confirm('确认删除选中的班级吗？').then(() => delClass(ids.value)).then(() => {
      proxy.$modal.msgSuccess('删除成功')
      getList()
    }).catch(() => {})
  }
  if (command === 'finish') {
    batchFinishClass(ids.value).then(() => {
      proxy.$modal.msgSuccess('批量结课成功')
      getList()
    })
  }
}

function handleExport() {
  proxy.download('edu/class/export', buildQuery(), `class_${new Date().getTime()}.xlsx`)
}

function openLessons(row) {
  currentClassId.value = row.classId
  lessonTitle.value = row.className + ' 的班级课堂数据'
  listClassLessons(row.classId).then(response => {
    lessonList.value = response.data || []
    lessonOpen.value = true
  })
}

function getClassDetailHref(row, tab = 'lesson') {
  const route = router.resolve({
    name: 'CourseClassDetail',
    params: {
      classId: row.classId,
      tab
    }
  })
  return route.href
}

function openClassDetail(row, tab = 'lesson') {
  window.open(getClassDetailHref(row, tab), '_blank')
}

function openAddLesson() {
  lessonForm.value = {
    lessonName: '',
    lessonType: 'normal',
    lessonStatus: '0',
    teacherId: undefined
  }
  lessonTimeRange.value = []
  addLessonOpen.value = true
}

function submitLesson() {
  if (!lessonForm.value.lessonName) {
    proxy.$modal.msgError('课堂名称不能为空')
    return
  }
  if (lessonTimeRange.value?.length === 2) {
    lessonForm.value.startTime = lessonTimeRange.value[0]
    lessonForm.value.endTime = lessonTimeRange.value[1]
  }
  addClassLesson(currentClassId.value, lessonForm.value).then(() => {
    proxy.$modal.msgSuccess('添加成功')
    addLessonOpen.value = false
    openLessons({ classId: currentClassId.value, className: lessonTitle.value.replace(' 的班级课堂数据', '') })
    getList()
  })
}

function openDual(row) {
  currentParentLessonId.value = row.lessonId
  dualRows.value = [createDualRow()]
  dualOpen.value = true
}

function createDualRow() {
  return { lessonName: '', teacherId: undefined }
}

function submitDual() {
  const rows = dualRows.value.filter(item => item.lessonName)
  if (!rows.length) {
    proxy.$modal.msgError('请至少填写一个子课堂')
    return
  }
  createDualChildren(currentParentLessonId.value, rows).then(() => {
    proxy.$modal.msgSuccess('创建成功')
    dualOpen.value = false
    listClassLessons(currentClassId.value).then(response => { lessonList.value = response.data || [] })
  })
}

function teacherLabel(item) {
  return item.teacherName + (item.phone ? ' / ' + item.phone : '')
}

function studentLabel(item) {
  return item.studentName + (item.studentNo ? ' / ' + item.studentNo : '')
}

function classStatusLabel(status) {
  return status === '1' ? '已结课' : '未结课'
}

function lessonTypeLabel(type, dualRole) {
  if (type === 'dual') return dualRole === 'child' ? '子课堂' : '主课堂'
  return type === 'public' ? '公开课' : '普通课'
}

function yesNo(value) {
  return value === '1' ? '是' : '否'
}

function avatarUrl(url) {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('blob:')) return url
  return baseUrl + url
}

loadOptions()
getList()
</script>

<style scoped>
.class-page {
  color: #111827;
}

.class-query {
  padding: 4px 0 12px;
}

.class-panel {
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

.panel-title,
.panel-actions,
.lesson-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lesson-toolbar {
  margin-bottom: 12px;
}

.class-table :deep(th.el-table__cell) {
  background: #fafafa;
  color: #111827;
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 4px;
}

.muted {
  color: #909399;
  font-size: 12px;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

@media (max-width: 1200px) {
  .panel-toolbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 14px;
  }
}
</style>
