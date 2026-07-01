<template>
  <div class="app-container teacher-page">
    <div class="teacher-tabs">
      <span class="active">教师管理</span>
    </div>

    <div class="resource-strip">
      <el-switch
        v-model="resourceSetting.publicResourceEnabled"
        active-value="1"
        inactive-value="0"
        @change="saveSchoolResourceSetting"
        v-hasPermi="['edu:teacher:resource']"
      />
      <span>启用公共授权资源</span>
      <el-divider direction="vertical" />
      <el-icon><Document /></el-icon>
      <span>{{ resourceSetting.publicResourceCount || 0 }}</span>
    </div>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="teacher-query">
      <el-form-item label="搜索：" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="请输入教师姓名/手机号/邮箱"
          clearable
          style="width: 260px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="教师状态：" prop="teacherStatus">
        <el-select v-model="queryParams.teacherStatus" clearable placeholder="全部教师状态" style="width: 170px">
          <el-option label="在职" value="0" />
          <el-option label="停用" value="1" />
          <el-option label="停用中" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="公共授权资源：" prop="publicResourceEnabled">
        <el-select v-model="queryParams.publicResourceEnabled" clearable placeholder="全部状态" style="width: 170px">
          <el-option label="开启" value="1" />
          <el-option label="关闭" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="教师标签：" prop="labelIds">
        <el-select
          v-model="queryParams.labelIds"
          multiple
          collapse-tags
          clearable
          :multiple-limit="3"
          placeholder="最多可同时选择3个标签"
          style="width: 320px"
        >
          <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="teacher-panel">
      <div class="panel-toolbar">
        <div class="panel-title">
          <strong>教师数({{ total }})</strong>
          <el-dropdown @command="handleBatchCommand">
            <el-button :disabled="multiple">
              批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="enable" v-hasPermi="['edu:teacher:status']">批量启用</el-dropdown-item>
                <el-dropdown-item command="disable" v-hasPermi="['edu:teacher:status']">批量停用</el-dropdown-item>
                <el-dropdown-item command="delete" v-hasPermi="['edu:teacher:remove']">批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="panel-actions">
          <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['edu:teacher:add']">添加教师</el-button>
          <el-button type="primary" link icon="Download" @click="handleExport" v-hasPermi="['edu:teacher:export']">下载表格</el-button>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="teacherList"
        border
        class="teacher-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" fixed />
        <el-table-column label="序号" width="70" align="center" fixed>
          <template #default="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="160" fixed>
          <template #default="scope">{{ formatPhone(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="180" prop="email" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.email || '--' }}</template>
        </el-table-column>
        <el-table-column label="姓名" min-width="150" prop="teacherName" show-overflow-tooltip />
        <el-table-column label="形象照" width="100" align="center">
          <template #default="scope">
            <el-avatar :size="54" :src="avatarUrl(scope.row.avatar)">
              {{ scope.row.teacherName ? scope.row.teacherName.slice(0, 1) : '师' }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="授课班级进度" width="130" align="center">
          <template #default="scope">{{ scope.row.classFinished || 0 }}/{{ scope.row.classTotal || 0 }}</template>
        </el-table-column>
        <el-table-column label="授课课堂进度" width="130" align="center">
          <template #default="scope">{{ scope.row.lessonFinished || 0 }}/{{ scope.row.lessonTotal || 0 }}</template>
        </el-table-column>
        <el-table-column label="出勤/缺勤/迟到/早退" width="170" align="center">
          <template #default="scope">
            {{ scope.row.attendCount || 0 }}/{{ scope.row.absentCount || 0 }}/{{ scope.row.lateCount || 0 }}/{{ scope.row.leaveEarlyCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="教师状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.teacherStatus)" effect="plain">{{ statusLabel(scope.row.teacherStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备检测信息" min-width="160" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.deviceInfo || '--' }}</template>
        </el-table-column>
        <el-table-column label="公共授权资源" width="130" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.publicResourceEnabled"
              active-value="1"
              inactive-value="0"
              :disabled="scope.row.teacherStatus === '1' || scope.row.teacherStatus === '2'"
              @change="handlePublicResource(scope.row)"
              v-hasPermi="['edu:teacher:resource']"
            />
          </template>
        </el-table-column>
        <el-table-column label="个人授权资源" width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleResources(scope.row)" v-hasPermi="['edu:teacher:resource']">
              <el-icon><Document /></el-icon>
              <span class="resource-count">{{ scope.row.personalResourceCount || 0 }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="教师标签" min-width="180">
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
            <el-button v-else link type="primary" icon="Plus" @click="handleUpdate(scope.row)" v-hasPermi="['edu:teacher:edit']" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)" v-hasPermi="['edu:teacher:query']">查看</el-button>
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['edu:teacher:edit']">编辑</el-button>
            <el-button
              v-if="scope.row.teacherStatus === '0'"
              link
              type="danger"
              @click="handleDisable(scope.row)"
              v-hasPermi="['edu:teacher:status']"
            >停用</el-button>
            <el-button
              v-else
              link
              type="primary"
              @click="handleEnable(scope.row)"
              v-hasPermi="['edu:teacher:status']"
            >启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" v-model="open" width="920px" append-to-body>
      <el-form ref="teacherRef" :model="form" :rules="rules" label-width="108px" class="teacher-form">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="手机号">
              <div class="phone-row">
                <el-input v-model="form.phoneAreaCode" placeholder="+86" />
                <el-input v-model="form.phone" maxlength="30" placeholder="请输入教师手机号" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" maxlength="100" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="teacherName">
              <el-input v-model="form.teacherName" maxlength="50" show-word-limit placeholder="请输入教师姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教师状态" prop="teacherStatus">
              <el-select v-model="form.teacherStatus" style="width: 100%">
                <el-option label="在职" value="0" />
                <el-option label="停用" value="1" />
                <el-option label="停用中" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="照片">
              <image-upload v-model="form.avatar" :limit="1" :file-size="5" :is-show-tip="false" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教师标签" prop="labelIds">
              <el-select
                v-model="form.labelIds"
                multiple
                collapse-tags
                clearable
                :multiple-limit="3"
                placeholder="选择标签"
                style="width: 100%"
              >
                <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" />
              </el-select>
            </el-form-item>
            <el-form-item label="公共授权">
              <el-switch
                v-model="form.publicResourceEnabled"
                active-value="1"
                inactive-value="0"
                :disabled="form.teacherStatus === '1' || form.teacherStatus === '2'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授课班级进度">
              <div class="inline-number">
                <el-input-number v-model="form.classFinished" :min="0" controls-position="right" />
                <span>/</span>
                <el-input-number v-model="form.classTotal" :min="0" controls-position="right" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授课课堂进度">
              <div class="inline-number">
                <el-input-number v-model="form.lessonFinished" :min="0" controls-position="right" />
                <span>/</span>
                <el-input-number v-model="form.lessonTotal" :min="0" controls-position="right" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出勤/缺勤">
              <div class="inline-number">
                <el-input-number v-model="form.attendCount" :min="0" controls-position="right" />
                <el-input-number v-model="form.absentCount" :min="0" controls-position="right" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="迟到/早退">
              <div class="inline-number">
                <el-input-number v-model="form.lateCount" :min="0" controls-position="right" />
                <el-input-number v-model="form.leaveEarlyCount" :min="0" controls-position="right" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="停用阻塞">
              <div class="blocker-grid">
                <el-input-number v-model="form.pendingLessonCount" :min="0" controls-position="right" />
                <span>未开始课堂</span>
                <el-input-number v-model="form.activeLessonCount" :min="0" controls-position="right" />
                <span>上课中课堂</span>
                <el-input-number v-model="form.headTeacherCourseCount" :min="0" controls-position="right" />
                <span>未结课班主任</span>
                <el-input-number v-model="form.subAccountPermissionCount" :min="0" controls-position="right" />
                <span>子账号权限</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备检测信息">
              <el-input v-model="form.deviceInfo" maxlength="200" placeholder="如 Windows 客户端 / 摄像头正常 / 网络稳定" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="简介" prop="intro">
              <el-input v-model="form.intro" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="请输入教师简介" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer split-footer">
          <el-button @click="openBatchAdd" v-if="!form.teacherId" v-hasPermi="['edu:teacher:add']">批量添加</el-button>
          <span class="footer-spacer"></span>
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="'添加教师(' + filledBatchCount + '/100)'" v-model="batchOpen" width="860px" append-to-body>
      <div class="batch-toolbar">
        <el-button type="primary" plain icon="Plus" :disabled="batchRows.length >= 100" @click="addBatchRow">添加一行</el-button>
        <el-button icon="Upload" @click="openExcelImport" v-hasPermi="['edu:teacher:import']">批量导入</el-button>
      </div>
      <el-table :data="batchRows" border max-height="420">
        <el-table-column label="区号" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.phoneAreaCode" placeholder="+86" />
          </template>
        </el-table-column>
        <el-table-column label="手机号/邮箱" min-width="260">
          <template #default="scope">
            <el-input v-model="scope.row.account" placeholder="请输入手机号/邮箱" />
          </template>
        </el-table-column>
        <el-table-column label="姓名" min-width="220">
          <template #default="scope">
            <el-input v-model="scope.row.teacherName" maxlength="50" show-word-limit placeholder="请输入姓名" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="scope">
            <el-button link type="danger" @click="removeBatchRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitBatchAdd">确定</el-button>
          <el-button @click="batchOpen = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="resourceTitle" v-model="resourceOpen" width="760px" append-to-body>
      <div class="resource-actions">
        <el-button type="primary" plain icon="Plus" @click="addResourceRow">新增资源</el-button>
      </div>
      <el-table :data="resourceList" border>
        <el-table-column label="资源名称" min-width="220">
          <template #default="scope">
            <el-input v-model="scope.row.resourceName" placeholder="请输入资源名称" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="140">
          <template #default="scope">
            <el-select v-model="scope.row.resourceType">
              <el-option label="课件" value="courseware" />
              <el-option label="作业" value="homework" />
              <el-option label="试卷" value="paper" />
              <el-option label="题库" value="question" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="scope">
            <el-select v-model="scope.row.resourceStatus">
              <el-option label="正常" value="normal" />
              <el-option label="空分类" value="empty" />
              <el-option label="异常" value="error" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="scope">
            <el-button link type="danger" @click="resourceList.splice(scope.$index, 1)">删除</el-button>
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

    <el-drawer v-model="detailOpen" title="教师详情" size="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="姓名">{{ detail.teacherName || '--' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ formatPhone(detail) }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detail.email || '--' }}</el-descriptions-item>
        <el-descriptions-item label="教师状态">{{ statusLabel(detail.teacherStatus) }}</el-descriptions-item>
        <el-descriptions-item label="授课班级进度">{{ detail.classFinished || 0 }}/{{ detail.classTotal || 0 }}</el-descriptions-item>
        <el-descriptions-item label="授课课堂进度">{{ detail.lessonFinished || 0 }}/{{ detail.lessonTotal || 0 }}</el-descriptions-item>
        <el-descriptions-item label="出勤/缺勤/迟到/早退">
          {{ detail.attendCount || 0 }}/{{ detail.absentCount || 0 }}/{{ detail.lateCount || 0 }}/{{ detail.leaveEarlyCount || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="设备检测信息">{{ detail.deviceInfo || '--' }}</el-descriptions-item>
        <el-descriptions-item label="公共授权资源">{{ detail.publicResourceEnabled === '1' ? '开启' : '关闭' }}</el-descriptions-item>
        <el-descriptions-item label="个人授权资源">{{ detail.personalResourceCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="教师标签">{{ detail.labelNames || '--' }}</el-descriptions-item>
        <el-descriptions-item label="简介">{{ detail.intro || '--' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <excel-import-dialog
      ref="excelImportRef"
      title="教师 Excel 导入"
      action="/edu/teacher/importData"
      template-action="/edu/teacher/importTemplate"
      template-file-name="teacher_template"
      update-support-label="更新已存在教师数据"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup>
defineOptions({ name: 'Teacher' })
import ExcelImportDialog from '@/components/ExcelImportDialog/index.vue'
import { Document } from '@element-plus/icons-vue'
import {
  listTeacher,
  getTeacher,
  addTeacher,
  updateTeacher,
  delTeacher,
  disableTeacher,
  enableTeacher,
  batchAddTeacher,
  listTeacherLabels,
  getTeacherResourceSetting,
  saveTeacherResourceSetting,
  listTeacherResources,
  saveTeacherResources,
  updateTeacherPublicResource
} from '@/api/course/teacher'

const { proxy } = getCurrentInstance()
const baseUrl = import.meta.env.VITE_APP_BASE_API

const teacherList = ref([])
const labelOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const open = ref(false)
const batchOpen = ref(false)
const detailOpen = ref(false)
const resourceOpen = ref(false)
const title = ref('')
const resourceTitle = ref('')
const resourceTeacherId = ref(undefined)
const resourceList = ref([])
const excelImportRef = ref(null)
const batchRows = ref([])
const detail = ref({})
const resourceSetting = ref({
  settingId: undefined,
  publicResourceEnabled: '0',
  publicResourceCount: 0
})

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    keyword: undefined,
    teacherStatus: '0',
    publicResourceEnabled: undefined,
    labelIds: []
  },
  rules: {
    teacherName: [
      { required: true, message: '教师姓名不能为空', trigger: 'blur' },
      { max: 50, message: '教师姓名不能超过50个字符', trigger: 'blur' }
    ],
    email: [
      { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
    ],
    intro: [
      { max: 300, message: '简介不能超过300个字符', trigger: 'blur' }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)
const filledBatchCount = computed(() => batchRows.value.filter(row => row.account || row.teacherName).length)

function getList() {
  loading.value = true
  const params = { ...queryParams.value }
  if (Array.isArray(params.labelIds)) {
    params.labelIds = params.labelIds.join(',')
  }
  listTeacher(params).then(response => {
    teacherList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function getLabels() {
  listTeacherLabels().then(response => {
    labelOptions.value = response.data || []
  })
}

function getResourceSetting() {
  getTeacherResourceSetting().then(response => {
    resourceSetting.value = response.data || {
      publicResourceEnabled: '0',
      publicResourceCount: 0
    }
  })
}

function reset() {
  form.value = {
    teacherId: undefined,
    teacherName: undefined,
    phoneAreaCode: '+86',
    phone: undefined,
    email: undefined,
    avatar: undefined,
    teacherStatus: '0',
    classFinished: 0,
    classTotal: 0,
    lessonFinished: 0,
    lessonTotal: 0,
    attendCount: 0,
    absentCount: 0,
    lateCount: 0,
    leaveEarlyCount: 0,
    deviceInfo: undefined,
    publicResourceEnabled: '0',
    intro: undefined,
    pendingLessonCount: 0,
    activeLessonCount: 0,
    headTeacherCourseCount: 0,
    subAccountPermissionCount: 0,
    labelIds: [],
    remark: undefined
  }
  proxy.resetForm('teacherRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.value.labelIds = []
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.teacherId)
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  title.value = '添加教师'
  open.value = true
}

function handleUpdate(row) {
  reset()
  getTeacher(row.teacherId).then(response => {
    form.value = response.data || {}
    form.value.labelIds = response.data?.labelIds || []
    title.value = '编辑教师'
    open.value = true
  })
}

function handleView(row) {
  getTeacher(row.teacherId).then(response => {
    detail.value = response.data || {}
    detailOpen.value = true
  })
}

function submitForm() {
  proxy.$refs.teacherRef.validate(valid => {
    if (!valid) {
      return
    }
    if (!form.value.phone && !form.value.email) {
      proxy.$modal.msgError('手机号和邮箱至少填写一个')
      return
    }
    const request = form.value.teacherId ? updateTeacher : addTeacher
    request(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.teacherId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function cancel() {
  open.value = false
  reset()
}

function openBatchAdd() {
  if (!batchRows.value.length) {
    batchRows.value = [createBatchRow()]
  }
  batchOpen.value = true
}

function createBatchRow() {
  return {
    phoneAreaCode: '+86',
    account: '',
    teacherName: ''
  }
}

function addBatchRow() {
  if (batchRows.value.length >= 100) {
    return
  }
  batchRows.value.push(createBatchRow())
}

function removeBatchRow(index) {
  batchRows.value.splice(index, 1)
  if (!batchRows.value.length) {
    batchRows.value.push(createBatchRow())
  }
}

function submitBatchAdd() {
  const teachers = batchRows.value
    .filter(row => row.account || row.teacherName)
    .map(row => {
      const account = (row.account || '').trim()
      return {
        phoneAreaCode: row.phoneAreaCode || '+86',
        phone: account.includes('@') ? undefined : account,
        email: account.includes('@') ? account : undefined,
        teacherName: row.teacherName
      }
    })
  if (!teachers.length) {
    proxy.$modal.msgError('请至少填写一名教师')
    return
  }
  batchAddTeacher(teachers).then(response => {
    proxy.$alert("<div style='overflow:auto;overflow-x:hidden;max-height:70vh;padding:10px 20px 0;'>" + response.msg + '</div>', '批量添加结果', { dangerouslyUseHTMLString: true })
    batchOpen.value = false
    open.value = false
    batchRows.value = [createBatchRow()]
    getList()
  })
}

function handleDisable(row) {
  proxy.$modal.confirm('是否确认停用教师 "' + row.teacherName + '"？停用后将关闭其学校云盘权限。').then(function() {
    return disableTeacher(row.teacherId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('停用成功')
  }).catch(() => {})
}

function handleEnable(row) {
  enableTeacher(row.teacherId).then(() => {
    getList()
    proxy.$modal.msgSuccess('启用成功')
  })
}

function handleBatchCommand(command) {
  if (command === 'delete') {
    handleDelete()
    return
  }
  const action = command === 'enable' ? enableTeacher : disableTeacher
  Promise.all(ids.value.map(id => action(id))).then(() => {
    getList()
    proxy.$modal.msgSuccess('批量操作成功')
  })
}

function handleDelete(row) {
  const teacherIds = row?.teacherId || ids.value
  proxy.$modal.confirm('是否确认删除教师编号为 "' + teacherIds + '" 的数据项？').then(function() {
    return delTeacher(teacherIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handlePublicResource(row) {
  updateTeacherPublicResource(row.teacherId, row.publicResourceEnabled).then(() => {
    proxy.$modal.msgSuccess('保存成功')
    getList()
  }).catch(() => {
    getList()
  })
}

function saveSchoolResourceSetting() {
  saveTeacherResourceSetting(resourceSetting.value).then(response => {
    if (response.data?.settingId) {
      resourceSetting.value.settingId = response.data.settingId
    }
    proxy.$modal.msgSuccess('保存成功')
    getResourceSetting()
  }).catch(() => {
    getResourceSetting()
  })
}

function handleResources(row) {
  resourceTeacherId.value = row.teacherId
  resourceTitle.value = row.teacherName + ' 的个人授权资源'
  listTeacherResources(row.teacherId).then(response => {
    resourceList.value = response.data || []
    resourceOpen.value = true
  })
}

function addResourceRow() {
  resourceList.value.push({
    resourceName: '',
    resourceType: 'courseware',
    resourceScope: 'personal',
    resourceStatus: 'normal'
  })
}

function submitResources() {
  const invalid = resourceList.value.some(item => !item.resourceName || !item.resourceName.trim())
  if (invalid) {
    proxy.$modal.msgError('资源名称不能为空')
    return
  }
  saveTeacherResources(resourceTeacherId.value, resourceList.value).then(() => {
    proxy.$modal.msgSuccess('保存成功')
    resourceOpen.value = false
    getList()
  })
}

function handleExport() {
  const params = { ...queryParams.value }
  if (Array.isArray(params.labelIds)) {
    params.labelIds = params.labelIds.join(',')
  }
  proxy.download('edu/teacher/export', params, `teacher_${new Date().getTime()}.xlsx`)
}

function openExcelImport() {
  excelImportRef.value.open()
}

function handleImportSuccess() {
  batchOpen.value = false
  open.value = false
  getList()
}

function avatarUrl(url) {
  if (!url) {
    return ''
  }
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return url
  }
  return baseUrl + url
}

function formatPhone(row) {
  if (!row || !row.phone) {
    return '--'
  }
  return (row.phoneAreaCode || '+86') + ' ' + row.phone
}

function statusLabel(status) {
  return { 0: '在职', 1: '停用', 2: '停用中' }[status] || '在职'
}

function statusType(status) {
  return { 0: 'success', 1: 'info', 2: 'warning' }[status] || 'success'
}

getLabels()
getResourceSetting()
getList()
</script>

<style scoped>
.teacher-page {
  color: #111827;
}

.teacher-tabs {
  height: 46px;
  border-bottom: 1px solid #dcdfe6;
  margin-bottom: 12px;
}

.teacher-tabs .active {
  display: inline-flex;
  height: 46px;
  align-items: center;
  padding: 0 30px;
  color: #009966;
  border-bottom: 2px solid #009966;
  font-size: 16px;
}

.resource-strip {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #4b5563;
}

.teacher-query {
  padding: 0 0 14px;
}

.teacher-panel {
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
.panel-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.teacher-table :deep(.el-table__cell) {
  vertical-align: middle;
}

.teacher-table :deep(th.el-table__cell) {
  background: #fafafa;
  color: #111827;
}

.resource-count {
  margin-left: 4px;
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 4px;
}

.phone-row {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 8px;
  width: 100%;
}

.inline-number {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.inline-number :deep(.el-input-number) {
  width: 124px;
}

.blocker-grid {
  display: grid;
  grid-template-columns: 120px auto 120px auto 120px auto 120px auto;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.blocker-grid :deep(.el-input-number) {
  width: 120px;
}

.split-footer {
  display: flex;
  align-items: center;
}

.footer-spacer {
  flex: 1;
}

.batch-toolbar,
.resource-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

@media (max-width: 1200px) {
  .panel-toolbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 14px;
    gap: 10px;
  }

  .blocker-grid {
    grid-template-columns: 120px auto 120px auto;
  }
}
</style>
