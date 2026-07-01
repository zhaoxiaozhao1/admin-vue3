<template>
  <div class="app-container student-page">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="student-query">
      <el-form-item label="学生" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="姓名 / 手机 / 邮箱 / 学号"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="排课显示" prop="displayStatus">
        <el-select v-model="queryParams.displayStatus" clearable placeholder="全部" style="width: 140px">
          <el-option label="显示" value="0" />
          <el-option label="隐藏" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="labelIds">
        <el-select
          v-model="queryParams.labelIds"
          multiple
          collapse-tags
          clearable
          placeholder="请选择标签"
          style="width: 220px"
        >
          <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" />
        </el-select>
      </el-form-item>
      <el-form-item label="添加日期">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['edu:student:add']">添加学生</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['edu:student:edit']">编辑</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['edu:student:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-dropdown @command="handleBatchCommand">
          <el-button plain :disabled="multiple">
            批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="sync" v-hasPermi="['edu:student:sync']">批量同步昵称</el-dropdown-item>
              <el-dropdown-item command="delete" v-hasPermi="['edu:student:remove']">批量删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['edu:student:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="studentList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="姓名" min-width="150" prop="studentName" fixed="left">
        <template #default="scope">
          <div class="student-name">
            <el-link type="primary" :underline="false" @click="openStudentDetail(scope.row)">{{ scope.row.studentName }}</el-link>
            <el-tag v-if="scope.row.displayStatus === '1'" type="info" size="small">隐藏</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="账号" min-width="210">
        <template #default="scope">
          <div>{{ formatPhone(scope.row) }}</div>
          <div class="muted">{{ scope.row.email || '--' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="学号" align="center" prop="studentNo" width="140" show-overflow-tooltip />
      <el-table-column label="标签" min-width="180">
        <template #default="scope">
          <template v-if="scope.row.labelNames">
            <el-tag
              v-for="name in scope.row.labelNames.split(',')"
              :key="name"
              size="small"
              effect="plain"
              class="tag-item"
            >{{ name }}</el-tag>
          </template>
          <span v-else class="muted">--</span>
        </template>
      </el-table-column>
      <el-table-column label="班级进度" align="center" width="110">
        <template #default="scope">{{ scope.row.classJoined || 0 }}/{{ scope.row.classTotal || 0 }}</template>
      </el-table-column>
      <el-table-column label="课堂进度" align="center" width="110">
        <template #default="scope">{{ scope.row.lessonJoined || 0 }}/{{ scope.row.lessonTotal || 0 }}</template>
      </el-table-column>
      <el-table-column label="出勤" align="center" width="160">
        <template #default="scope">
          <span>到 {{ scope.row.attendCount || 0 }}</span>
          <span class="muted stat-gap">缺 {{ scope.row.absentCount || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="迟到/早退" align="center" width="120">
        <template #default="scope">{{ scope.row.lateCount || 0 }}/{{ scope.row.leaveEarlyCount || 0 }}</template>
      </el-table-column>
      <el-table-column label="设备" min-width="160" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.deviceInfo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="授权资源" align="center" width="110">
        <template #default="scope">
          <el-button link type="primary" @click="handleResources(scope.row)" v-hasPermi="['edu:student:resource']">
            {{ scope.row.resourceCount || 0 }} 项
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="添加日期" align="center" prop="addDate" width="170">
        <template #default="scope">{{ parseTime(scope.row.addDate) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" class-name="small-padding fixed-width" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['edu:student:edit']">编辑</el-button>
          <el-button link type="primary" icon="Refresh" @click="handleSync(scope.row)" v-hasPermi="['edu:student:sync']">同步昵称</el-button>
          <el-button link type="primary" icon="Hide" @click="handleHide(scope.row)" v-hasPermi="['edu:student:hide']">隐藏</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['edu:student:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-tabs v-model="activeTab" class="student-tabs">
        <el-tab-pane label="单个添加" name="single">
          <el-form ref="studentRef" :model="form" :rules="rules" label-width="96px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="姓名" prop="studentName">
                  <el-input v-model="form.studentName" maxlength="50" show-word-limit placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="学号" prop="studentNo">
                  <el-input v-model="form.studentNo" maxlength="32" placeholder="字母、数字、.-_" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="区号" prop="phoneAreaCode">
                  <el-input v-model="form.phoneAreaCode" placeholder="+86" />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="form.phone" placeholder="手机号或邮箱至少填写一个" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="form.email" placeholder="手机号或邮箱至少填写一个" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="标签" prop="labelIds">
                  <el-select v-model="form.labelIds" multiple clearable placeholder="请选择标签" style="width: 100%">
                    <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId">
                      <span>{{ item.labelName }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="班级进度">
                  <div class="inline-number">
                    <el-input-number v-model="form.classJoined" :min="0" controls-position="right" />
                    <span>/</span>
                    <el-input-number v-model="form.classTotal" :min="0" controls-position="right" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="课堂进度">
                  <div class="inline-number">
                    <el-input-number v-model="form.lessonJoined" :min="0" controls-position="right" />
                    <span>/</span>
                    <el-input-number v-model="form.lessonTotal" :min="0" controls-position="right" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="出勤">
                  <div class="inline-number">
                    <el-input-number v-model="form.attendCount" :min="0" controls-position="right" />
                    <el-input-number v-model="form.absentCount" :min="0" controls-position="right" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="迟到早退">
                  <div class="inline-number">
                    <el-input-number v-model="form.lateCount" :min="0" controls-position="right" />
                    <el-input-number v-model="form.leaveEarlyCount" :min="0" controls-position="right" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="设备摘要">
                  <el-input v-model="form.deviceInfo" placeholder="如 Windows 客户端、iPad、Android" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注">
                  <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="!form.studentId" label="文本导入" name="text">
          <el-alert title="每行一名学生，支持 手机号#姓名、邮箱#姓名、国际区号-手机号#姓名。单次最多处理 300 条。" type="info" :closable="false" />
          <el-input
            v-model="textImport"
            class="text-import"
            type="textarea"
            :rows="12"
            placeholder="13800000000#张三&#10;student@example.com#李四&#10;1-5550001234#Alice"
          />
        </el-tab-pane>
        <el-tab-pane v-if="!form.studentId" label="Excel 导入" name="excel">
          <div class="excel-pane">
            <el-icon><upload-filled /></el-icon>
            <div>
              <h4>使用模板批量导入学生</h4>
              <p>支持 xls、xlsx 文件。可勾选“更新已存在数据”，按手机号优先、邮箱次之匹配覆盖资料。</p>
              <el-button type="primary" icon="Upload" @click="openExcelImport" v-hasPermi="['edu:student:import']">选择文件</el-button>
              <el-button icon="Download" @click="downloadTemplate">下载模板</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitDialog">{{ activeTab === 'text' ? '开始导入' : '确定' }}</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="resourceTitle" v-model="resourceOpen" width="720px" append-to-body>
      <div class="resource-actions">
        <el-button type="primary" plain icon="Plus" @click="addResourceRow">新增资源</el-button>
      </div>
      <el-table :data="resourceList" border>
        <el-table-column label="资源名称" min-width="220">
          <template #default="scope">
            <el-input v-model="scope.row.resourceName" placeholder="请输入资源名称" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="150">
          <template #default="scope">
            <el-select v-model="scope.row.resourceType">
              <el-option label="课件" value="courseware" />
              <el-option label="题库" value="question" />
              <el-option label="云盘" value="drive" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="范围" width="150">
          <template #default="scope">
            <el-select v-model="scope.row.resourceScope">
              <el-option label="个人" value="personal" />
              <el-option label="班级" value="class" />
              <el-option label="学校" value="school" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="scope">
            <el-button link type="primary" icon="Delete" @click="resourceList.splice(scope.$index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitResources">保存</el-button>
          <el-button @click="resourceOpen = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <excel-import-dialog
      ref="excelImportRef"
      title="学生 Excel 导入"
      action="/edu/student/importData"
      template-action="/edu/student/importTemplate"
      template-file-name="student_template"
      update-support-label="更新已存在学生数据"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup>
defineOptions({ name: 'Student' })
import ExcelImportDialog from '@/components/ExcelImportDialog/index.vue'
import {
  listStudent,
  getStudent,
  addStudent,
  updateStudent,
  delStudent,
  hideStudent,
  syncStudentNickname,
  syncStudentNicknameBatch,
  textImportStudent,
  listStudentLabels,
  listStudentResources,
  saveStudentResources
} from '@/api/course/student'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()

const studentList = ref([])
const labelOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const open = ref(false)
const title = ref('')
const activeTab = ref('single')
const textImport = ref('')
const dateRange = ref([])
const excelImportRef = ref(null)
const resourceOpen = ref(false)
const resourceTitle = ref('')
const resourceStudentId = ref(undefined)
const resourceList = ref([])

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    keyword: undefined,
    displayStatus: '0',
    labelIds: []
  },
  rules: {
    studentName: [
      { required: true, message: '姓名不能为空', trigger: 'blur' },
      { max: 50, message: '姓名不能超过50个字符', trigger: 'blur' }
    ],
    studentNo: [
      { pattern: /^[A-Za-z0-9._-]{1,32}$/, message: '学号仅允许1-32位字母、数字、点、横线、下划线', trigger: 'blur' }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value, 'AddDate')
  if (Array.isArray(params.labelIds)) {
    params.labelIds = params.labelIds.join(',')
  }
  listStudent(params).then(response => {
    studentList.value = response.rows
    total.value = response.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function getLabels() {
  listStudentLabels().then(response => {
    labelOptions.value = response.data || []
  })
}

function reset() {
  form.value = {
    studentId: undefined,
    studentName: undefined,
    phoneAreaCode: '+86',
    phone: undefined,
    email: undefined,
    studentNo: undefined,
    displayStatus: '0',
    classJoined: 0,
    classTotal: 0,
    lessonJoined: 0,
    lessonTotal: 0,
    attendCount: 0,
    absentCount: 0,
    lateCount: 0,
    leaveEarlyCount: 0,
    deviceInfo: undefined,
    labelIds: [],
    remark: undefined
  }
  textImport.value = ''
  proxy.resetForm('studentRef')
}

function cancel() {
  open.value = false
  reset()
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  dateRange.value = []
  queryParams.value.labelIds = []
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.studentId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  title.value = '添加学生'
  activeTab.value = 'single'
  open.value = true
}

function handleUpdate(row) {
  reset()
  const studentId = row.studentId || ids.value[0]
  getStudent(studentId).then(response => {
    form.value = response.data
    form.value.labelIds = response.data?.labelIds || []
    title.value = '编辑学生'
    activeTab.value = 'single'
    open.value = true
  })
}

function openEditFromQuery() {
  const studentId = route.query.editStudentId
  if (!studentId) {
    return
  }
  handleUpdate({ studentId })
  router.replace({ path: '/course/student' })
}

function openStudentDetail(row) {
  const route = router.resolve({
    path: '/singlePage/StudentManagement/Details',
    query: { studentId: row.studentId }
  })
  window.open(route.href, '_blank')
}

function submitDialog() {
  if (activeTab.value === 'text') {
    submitTextImport()
  } else if (activeTab.value === 'excel') {
    openExcelImport()
  } else {
    submitForm()
  }
}

function submitForm() {
  proxy.$refs.studentRef.validate(valid => {
    if (!valid) {
      return
    }
    if (!form.value.phone && !form.value.email) {
      proxy.$modal.msgError('手机号和邮箱至少填写一个')
      return
    }
    const request = form.value.studentId ? updateStudent : addStudent
    request(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.studentId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function submitTextImport() {
  if (!textImport.value.trim()) {
    proxy.$modal.msgError('请输入导入文本')
    return
  }
  textImportStudent(textImport.value).then(response => {
    proxy.$alert("<div style='overflow:auto;overflow-x:hidden;max-height:70vh;padding:10px 20px 0;'>" + response.msg + '</div>', '导入结果', { dangerouslyUseHTMLString: true })
    open.value = false
    getList()
  })
}

function handleDelete(row) {
  const studentIds = row.studentId || ids.value
  proxy.$modal.confirm('是否确认删除学生编号为 "' + studentIds + '" 的数据项？').then(function() {
    return delStudent(studentIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handleHide(row) {
  proxy.$modal.confirm('是否确认隐藏学生 "' + row.studentName + '"？隐藏后默认列表不再显示。').then(function() {
    return hideStudent(row.studentId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('隐藏成功')
  }).catch(() => {})
}

function handleSync(row) {
  syncStudentNickname(row.studentId).then(() => {
    getList()
    proxy.$modal.msgSuccess('同步成功')
  })
}

function handleBatchCommand(command) {
  if (command === 'sync') {
    syncStudentNicknameBatch(ids.value).then(() => {
      getList()
      proxy.$modal.msgSuccess('同步成功')
    })
  }
  if (command === 'delete') {
    handleDelete({})
  }
}

function handleExport() {
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value, 'AddDate')
  if (Array.isArray(params.labelIds)) {
    params.labelIds = params.labelIds.join(',')
  }
  proxy.download('edu/student/export', params, `student_${new Date().getTime()}.xlsx`)
}

function openExcelImport() {
  excelImportRef.value.open()
}

function downloadTemplate() {
  proxy.download('edu/student/importTemplate', {}, `student_template_${new Date().getTime()}.xlsx`)
}

function handleImportSuccess() {
  open.value = false
  getList()
}

function handleResources(row) {
  resourceStudentId.value = row.studentId
  resourceTitle.value = row.studentName + ' 的个人授权资源'
  listStudentResources(row.studentId).then(response => {
    resourceList.value = response.data || []
    resourceOpen.value = true
  })
}

function addResourceRow() {
  resourceList.value.push({
    resourceName: '',
    resourceType: 'courseware',
    resourceScope: 'personal'
  })
}

function submitResources() {
  const invalid = resourceList.value.some(item => !item.resourceName || !item.resourceName.trim())
  if (invalid) {
    proxy.$modal.msgError('资源名称不能为空')
    return
  }
  saveStudentResources(resourceStudentId.value, resourceList.value).then(() => {
    proxy.$modal.msgSuccess('保存成功')
    resourceOpen.value = false
    getList()
  })
}

function formatPhone(row) {
  if (!row.phone) {
    return '--'
  }
  return (row.phoneAreaCode || '+86') + ' ' + row.phone
}

getLabels()
getList()
openEditFromQuery()
</script>

<style scoped>
.student-page :deep(.el-table__cell) {
  vertical-align: top;
}

.student-query {
  padding: 4px 0 8px;
}

.student-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.muted {
  color: #909399;
  font-size: 12px;
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 4px;
}

.stat-gap {
  margin-left: 8px;
}

.student-tabs {
  min-height: 360px;
}

.inline-number {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.inline-number :deep(.el-input-number) {
  width: 112px;
}

.text-import {
  margin-top: 12px;
}

.excel-pane {
  min-height: 260px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 32px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
}

.excel-pane .el-icon {
  font-size: 42px;
  color: #409eff;
}

.excel-pane h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
}

.excel-pane p {
  margin: 0 0 16px;
  color: #606266;
}

.resource-actions {
  margin-bottom: 10px;
}
</style>
