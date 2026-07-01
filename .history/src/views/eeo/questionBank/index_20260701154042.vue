<template>
  <div class="qb-page">
    <div class="qb-tabs">
      <button :class="{ active: bankTab === 'org' }" @click="bankTab = 'org'">组织题库</button>
      <button :class="{ active: bankTab === 'classin' }" @click="bankTab = 'classin'">ClassIn题库</button>
    </div>

    <div class="qb-topline">
      <el-popover v-if="subjects.length" placement="bottom-start" width="250" trigger="click" popper-class="qb-subject-menu">
        <template #reference>
          <button class="subject-select">{{ activeSubjectLabel }}<el-icon><ArrowDown /></el-icon></button>
        </template>
        <div class="subject-menu-title">{{ activeSubjectLabel }}</div>
        <div class="subject-menu-row" @click="openSubjectDialog('add')"><el-icon><Plus /></el-icon>添加<el-icon><ArrowRight /></el-icon></div>
        <div class="subject-menu-row" @click="subjectManageOpen = true"><el-icon><Setting /></el-icon>管理<el-icon><ArrowRight /></el-icon></div>
      </el-popover>
      <button v-else class="subject-select" @click="openSubjectDialog('add')">添加学段学科<el-icon><ArrowDown /></el-icon></button>
      <button :class="['pill', { active: contentTab === 'question' }]" @click="contentTab = 'question'">试题</button>
      <button :class="['pill', { active: contentTab === 'paper' }]" @click="contentTab = 'paper'">试卷</button>
      <el-input v-model="keyword" class="global-search" placeholder="搜索" :prefix-icon="Search" clearable />
    </div>

    <template v-if="bankTab === 'org'">
      <div class="qb-body">
        <aside :class="['qb-tree', { collapsed: treeCollapsed }]">
          <template v-if="contentTab === 'question'">
            <div class="tree-head">
              <button :class="{ active: treeKind === 'point' }" @click="treeKind = 'point'">知识点</button>
              <button :class="{ active: treeKind === 'chapter' }" @click="treeKind = 'chapter'">章节</button>
              <el-icon @click="treeSearch = !treeSearch"><Search /></el-icon>
              <el-icon @click="treeCollapsed = !treeCollapsed"><Menu /></el-icon>
            </div>
            <el-input v-if="treeSearch" v-model="treeKeyword" class="tree-search" placeholder="搜索" clearable />
            <p class="add-link" @click="startNodeAdd">{{ treeKind === 'point' ? '添加知识点' : '添加章节' }}</p>
            <el-input v-if="nodeAdding" v-model="nodeName" class="node-input" :placeholder="treeKind === 'point' ? '请输入知识点名称' : '请输入章节名称'" @keyup.enter="saveNode" @blur="saveNode" clearable />
            <div v-for="node in filteredNodes" :key="node.id" :class="['tree-item', { active: activeNodeId === node.id }]" @click="activeNodeId = node.id">{{ node.name }}</div>
          </template>
          <template v-else>
            <div class="paper-tree-title">试卷分类</div>
            <p class="add-link" @click="startCategoryAdd">添加分类</p>
            <el-input v-if="categoryAdding" v-model="categoryName" class="node-input" placeholder="请输入分类名称" @keyup.enter="saveCategory" @blur="saveCategory" clearable />
            <div v-for="cat in paperCategories" :key="cat.id" :class="['tree-item', { active: activePaperCategoryId === cat.id }]" @click="activePaperCategoryId = cat.id">{{ cat.name }}</div>
          </template>
        </aside>

        <main class="qb-main">
          <template v-if="contentTab === 'question'">
            <div v-if="filteredQuestions.length" class="question-list">
              <article v-for="(q, index) in filteredQuestions" :key="q.id" class="question-card">
                <div class="q-meta"><span>{{ q.type }}</span><span>{{ q.difficulty }}</span></div>
                <div class="q-title">{{ index + 1 }}. {{ q.title }}</div>
                <ol v-if="q.options?.length" type="A" class="q-options">
                  <li v-for="opt in q.options" :key="opt.text" :class="{ answer: q.answers?.includes(opt.key) && showAnswers }">{{ opt.text }}</li>
                </ol>
                <div v-if="showAnswers" class="q-answer">答案：{{ q.answers?.join('、') || q.answer || '略' }}<br />解析：{{ q.analysis || '暂无解析' }}</div>
                <div class="q-actions"><el-button link type="primary" @click="editQuestion(q)">编辑</el-button><el-button link type="primary" @click="removeQuestion(q)">删除</el-button></div>
              </article>
            </div>
            <div v-else class="empty"><div class="wing">⌁</div><p>暂无试题</p></div>
            <div class="floating-actions">
              <el-button round @click="batchOpen = true"><el-icon><Upload /></el-icon>批量添加试题</el-button>
              <el-button type="success" round @click="openQuestionDialog()"><el-icon><Plus /></el-icon>添加试题</el-button>
            </div>
          </template>

          <template v-else>
            <div v-if="filteredPapers.length" class="paper-list">
              <article v-for="paper in filteredPapers" :key="paper.id" class="paper-card">
                <h3>{{ paper.title }}</h3>
                <p>{{ paper.desc || '请填写说明（选填）' }}</p>
                <span>试题数：{{ paper.questionCount }} / 200</span><span>满分：{{ paper.score }}</span>
              </article>
            </div>
            <div v-else class="empty"><div class="wing">⌁</div><p>暂无试卷</p></div>
            <div class="floating-actions single"><el-button type="success" round @click="paperOpen = true"><el-icon><Plus /></el-icon>添加试卷</el-button></div>
          </template>
        </main>
      </div>
    </template>

    <template v-else>
      <div class="classin-layout">
        <aside class="qb-tree">
          <div class="tree-head">
            <button :class="{ active: treeKind === 'point' }" @click="treeKind = 'point'">知识点</button>
            <button :class="{ active: treeKind === 'chapter' }" @click="treeKind = 'chapter'">章节</button>
          </div>
          <div v-for="name in classInTree" :key="name" class="tree-item">{{ name }}</div>
        </aside>
        <main class="classin-main">
          <div v-for="group in classInFilters" :key="group.name" class="filter-line">
            <b>{{ group.name }}</b>
            <button v-for="item in group.items" :key="item" :class="{ active: filters[group.name] === item }" @click="filters[group.name] = item">{{ item }}</button>
          </div>
          <div class="sort-line"><button class="active">最新</button><button>难度</button><span>共 52,291 题</span><el-switch v-model="showAnswers" active-text="显示答案" /></div>
          <article v-for="(q, index) in classInQuestions" :key="q.id" class="question-card">
            <div class="q-meta"><span>{{ q.type }}</span><span>{{ q.difficulty }}</span></div>
            <div class="q-title">{{ index + 1 }}. {{ q.title }}</div>
            <p>{{ q.body }}</p>
            <div v-if="showAnswers" class="q-answer">答案：{{ q.answer }}</div>
          </article>
        </main>
      </div>
    </template>

    <el-dialog v-model="subjectDialogOpen" title="添加学段学科" width="520px" class="eeo-dialog">
      <p class="dialog-sub">学段学科可作为内容的分类，可自定义你需要的任何名称</p>
      <h4>学段</h4>
      <div class="chip-row">
        <template v-for="stage in stageOptions" :key="stage">
          <el-input v-if="editingStage === stage" v-model="editingStageName" placeholder="请输入学段名称" @keyup.enter="commitStageEdit" @blur="commitStageEdit" />
          <el-popover v-else-if="!stages.includes(stage)" trigger="click" placement="bottom-end" width="84" popper-class="stage-popover">
            <template #reference>
              <button :class="{ selected: subjectForm.stage === stage }" @click="selectStage(stage)">{{ stage }}<span class="stage-more" @click.stop>⋮</span></button>
            </template>
            <div class="stage-menu-item" @click="startStageEdit(stage)"><el-icon><Edit /></el-icon>编辑</div>
            <div class="stage-menu-item delete" @click="removeStage(stage)"><el-icon><Delete /></el-icon>删除</div>
          </el-popover>
          <button v-else :class="{ selected: subjectForm.stage === stage }" @click="selectStage(stage)">{{ stage }}</button>
        </template>
        <el-input v-if="customStage" v-model="customStageName" placeholder="请输入学段名称" @keyup.enter="commitCustomStage" @blur="hideEmptyCustomStage" />
        <span @click="startCustomStage">+ 自定义</span>
      </div>
      <h4>学科</h4>
      <div class="chip-row">
        <button v-for="subject in subjectOptions" :key="subject" :disabled="subjectExists(subjectForm.stage, subject)" :class="{ selected: subjectForm.subject === subject }" @click="selectSubject(subject)">{{ subject }}</button>
        <el-input v-if="customSubject" v-model="customSubjectName" placeholder="请输入学科名称" @keyup.enter="commitCustomSubject" @blur="hideEmptyCustomSubject" />
        <span @click="startCustomSubject">+ 自定义</span>
      </div>
      <template #footer><el-button @click="subjectDialogOpen = false">取 消</el-button><el-button type="success" @click="saveSubject">确 定</el-button></template>
    </el-dialog>

    <el-dialog v-model="subjectManageOpen" title="管理学段学科" width="520px" class="eeo-dialog">
      <div class="manage-actions"><el-button round @click="openSubjectDialog('add')">添加</el-button><el-button round @click="taxonomyOpen = true"><el-icon><Edit /></el-icon>编辑学段学科</el-button></div>
      <div class="manage-row head"><span>学段学科</span><span>状态</span><span>操作</span></div>
      <div v-for="item in subjects" :key="item.id" class="manage-row"><span>{{ labelOf(item) }}</span><span><el-switch v-model="item.enabled" active-text="已启用" @change="persist" /></span><span><el-icon @click="openMember(item)"><User /></el-icon><el-icon @click="deleteSubject(item)"><Delete /></el-icon></span></div>
    </el-dialog>

    <el-dialog v-model="memberOpen" :title="activeSubjectLabel + '成员管理'" width="520px">
      <div class="member-head"><b>成员及权限</b><el-button round @click="memberSelectOpen = true">添加成员</el-button></div>
      <el-checkbox disabled checked>138****7556 创建者</el-checkbox><span class="role">超级管理员</span>
    </el-dialog>
    <el-dialog v-model="memberSelectOpen" title="选择组织成员" width="800px"><el-empty description="暂无可选成员" /><template #footer><el-button @click="memberSelectOpen = false">取 消</el-button><el-button type="success" @click="memberSelectOpen = false">确 定</el-button></template></el-dialog>
    <el-dialog v-model="taxonomyOpen" title="编辑学段学科" width="520px"><h4>学段</h4><div class="chip-row"><button v-for="stage in stages" :key="stage">{{ stage }}</button></div><h4>学科</h4><div class="chip-row"><button v-for="subject in subjectNames" :key="subject">{{ subject }}</button></div></el-dialog>

    <el-dialog v-model="questionOpen" title="添加试题" width="670px" class="question-dialog">
      <h4>题型</h4>
      <div class="type-row"><button v-for="type in questionTypes" :key="type" :class="{ selected: questionForm.type === type }" @click="questionForm.type = type">{{ type }}</button></div>
      <el-input v-model="questionForm.title" type="textarea" :rows="4" maxlength="15000" show-word-limit placeholder="请输入题干" />
      <h4>答案 <small>（点击选项字母部分，设为正确答案）</small></h4>
      <div v-if="usesOptions" class="option-list">
        <div v-for="opt in questionForm.options" :key="opt.key" class="option-row"><button :class="{ selected: questionForm.answers.includes(opt.key) }" @click="toggleAnswer(opt.key)">{{ opt.key }}</button><el-input v-model="opt.text" maxlength="500" /><el-icon @click="removeOption(opt.key)"><Delete /></el-icon></div>
        <button class="text-action" @click="addOption">添加选项</button>
      </div>
      <el-input v-else v-model="questionForm.answer" placeholder="请输入答案" />
      <button class="text-action" @click="questionForm.showAnalysis = true">添加解析</button>
      <el-input v-if="questionForm.showAnalysis" v-model="questionForm.analysis" type="textarea" :rows="3" placeholder="请输入解析" />
      <h4>学段学科*</h4><el-select v-model="questionForm.subjectId" class="wide"><el-option v-for="s in subjects" :key="s.id" :value="s.id" :label="labelOf(s)" /></el-select>
      <h4>关联知识点</h4><el-select v-model="questionForm.pointIds" multiple class="wide" placeholder="请关联知识点"><el-option v-for="n in pointNodes" :key="n.id" :value="n.id" :label="n.name" /></el-select>
      <h4>关联章节</h4><el-select v-model="questionForm.chapterIds" multiple class="wide" placeholder="请关联章节"><el-option v-for="n in chapterNodes" :key="n.id" :value="n.id" :label="n.name" /></el-select>
      <h4>难度</h4><div class="degree-row"><button v-for="d in difficulties" :key="d" :class="{ selected: questionForm.difficulty === d }" @click="questionForm.difficulty = d">{{ d }}</button></div>
      <template #footer><el-button round @click="saveQuestion(true)">保存并继续添加</el-button><el-button type="success" round @click="saveQuestion(false)">确 定</el-button></template>
    </el-dialog>

    <el-dialog v-model="batchOpen" width="96vw" class="full-dialog" :show-close="true">
      <div class="batch-panel"><h2>批量添加试题</h2><div class="steps"><span>1 上传试题</span><span>2 编辑试题</span></div><h3>原题录入</h3><div class="batch-actions"><span>录入说明</span><el-button round>下载模板</el-button></div><p>上传模板</p><el-input v-model="batchText" type="textarea" :rows="12" placeholder="粘贴试题文本 或者 拖入 Word、Excel 文档" /><el-button link>说明</el-button><div class="batch-footer"><el-button type="success" :disabled="!batchText.trim()" @click="saveBatch">下一步</el-button></div></div>
    </el-dialog>

    <el-dialog v-model="paperOpen" width="96vw" class="full-dialog" :show-close="true">
      <div class="paper-editor"><h2>添加试卷</h2><el-input v-model="paperForm.title" placeholder="请填写试卷标题（100字以内）" maxlength="100" /><el-input v-model="paperForm.desc" type="textarea" :rows="5" placeholder="请填写说明（选填）" /><div class="paper-stats">试题数：{{ paperForm.questionCount }} / 200　满分：{{ paperForm.score }}</div><div class="paper-nav"><button>题库选题</button><button @click="openQuestionDialog()">添加试题</button><button @click="batchOpen = true">批量添加试题</button></div><el-empty description="无题目，请根据上方导航指示添加试题，或点击此处" /><div class="paper-footer"><el-button round>预 览</el-button><span>保存路径 组织题库（13811587556的在线课堂）_{{ activeSubjectLabel }}_默认分类</span><el-button type="success" round @click="savePaper">保存试卷</el-button></div></div>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'QuestionBank' })
import { Search } from '@element-plus/icons-vue'
import { getQuestionBankState, saveQuestionBankState } from '@/api/eeo/questionBank'

const { proxy } = getCurrentInstance()
const stages = ['小学', '初中', '高中']
const subjectNames = ['语文', '数学', '英语', '科学', '道德与法治']
const questionTypes = ['单选题', '多选题', '判断题', '填空题', '问答题', '综合题']
const difficulties = ['易', '较易', '中档', '较难', '难']
const classInTree = ['语文基础知识', '语言表达及应用', '阅读鉴赏', '作文']
const classInFilters = [
  { name: '题型', items: ['全部', '判断题', '填空题', '问答题', '选择题', '语言表达', '连线题', '翻译', '文言文阅读', '现代文阅读', '解答题', '古诗词赏析', '习作', '综合性学习', '默写', '排序', '汉字书写'] },
  { name: '题类', items: ['全部', '常考题', '易错题', '好题', '压轴题'] },
  { name: '来源', items: ['全部', '小升初真题', '名校小升初', '小升初模拟', '小升初复习', '期末试题', '期中试题', '月考试题', '单元测验', '同步练习', '竞赛试题', '假期作业'] },
  { name: '难度', items: ['全部', '易', '较易', '中档', '较难', '难'] }
]

const bankTab = ref('org')
const contentTab = ref('question')
const treeKind = ref('point')
const keyword = ref('')
const treeKeyword = ref('')
const treeSearch = ref(false)
const treeCollapsed = ref(false)
const activeNodeId = ref(0)
const activePaperCategoryId = ref(0)
const nodeAdding = ref(false)
const nodeName = ref('')
const categoryAdding = ref(false)
const categoryName = ref('')
const showAnswers = ref(false)
const subjectDialogOpen = ref(false)
const subjectManageOpen = ref(false)
const taxonomyOpen = ref(false)
const memberOpen = ref(false)
const memberSelectOpen = ref(false)
const questionOpen = ref(false)
const batchOpen = ref(false)
const paperOpen = ref(false)
const customStage = ref(false)
const customSubject = ref(false)
const customStageName = ref('')
const customSubjectName = ref('')
const customStages = ref([])
const customSubjects = ref([])
const editingStage = ref('')
const editingStageName = ref('')
const batchText = ref('')
const filters = reactive({ 题型: '全部', 题类: '全部', 来源: '全部', 难度: '全部' })
const subjectForm = reactive({ stage: '小学', subject: '语文' })
const questionForm = reactive(blankQuestion())
const paperForm = reactive({ title: '试卷 7月1日 星期三', desc: '', questionCount: 0, score: 0 })
const state = reactive(defaultState())

const subjects = computed(() => state.subjects.filter(s => s.enabled !== false))
const activeSubject = computed(() => subjects.value[0] || state.subjects[0])
const activeSubjectLabel = computed(() => activeSubject.value ? labelOf(activeSubject.value) : '')
const stageOptions = computed(() => {
  const names = [...stages, ...state.subjects.map(s => s.stage), ...customStages.value]
  if (subjectForm.stage && !names.includes(subjectForm.stage)) names.push(subjectForm.stage)
  return [...new Set(names)]
})
const subjectOptions = computed(() => {
  const saved = state.subjects.filter(s => s.stage === subjectForm.stage).map(s => s.subject)
  const base = stages.includes(subjectForm.stage) ? subjectNames : []
  return [...new Set([...base, ...saved, ...customSubjects.value])]
})
const pointNodes = computed(() => state.nodes.filter(n => n.kind === 'point'))
const chapterNodes = computed(() => state.nodes.filter(n => n.kind === 'chapter'))
const paperCategories = computed(() => state.paperCategories)
const filteredNodes = computed(() => state.nodes.filter(n => n.kind === treeKind.value && n.name.includes(treeKeyword.value)))
const filteredQuestions = computed(() => state.questions.filter(q => (!keyword.value || q.title.includes(keyword.value)) && (!activeNodeId.value || q.pointIds?.includes(activeNodeId.value) || q.chapterIds?.includes(activeNodeId.value))))
const filteredPapers = computed(() => state.papers.filter(p => !keyword.value || p.title.includes(keyword.value)))
const usesOptions = computed(() => ['单选题', '多选题'].includes(questionForm.type))
const classInQuestions = computed(() => defaultClassInQuestions().filter(q => filters.题型 === '全部' || q.type === filters.题型).filter(q => filters.难度 === '全部' || q.difficulty === filters.难度))

function defaultState() {
  return {
    subjects: [{ id: 29084676, stage: '小学', subject: '语文', enabled: true }],
    nodes: [{ id: 1, kind: 'point', name: '默认知识点' }],
    paperCategories: [{ id: 1, name: '默认分类' }],
    questions: [],
    papers: []
  }
}

function blankQuestion() {
  return { id: null, type: '单选题', title: '', options: ['A', 'B', 'C', 'D'].map(key => ({ key, text: key })), answers: [], answer: '', analysis: '', showAnalysis: false, subjectId: 29084676, pointIds: [], chapterIds: [], difficulty: '易' }
}

function labelOf(item) {
  return item ? `${item.stage}·${item.subject}` : ''
}

function persist() {
  saveQuestionBankState(state)
}

function load() {
  getQuestionBankState().then(res => {
    if (res.data) Object.assign(state, JSON.parse(res.data))
    seedIfEmpty()
    if (!state.subjects?.length) subjectDialogOpen.value = true
  })
}

function openSubjectDialog() {
  subjectManageOpen.value = false
  customStage.value = false
  customSubject.value = false
  editingStage.value = ''
  customStageName.value = ''
  customSubjectName.value = ''
  editingStageName.value = ''
  customStages.value = []
  customSubjects.value = []
  subjectDialogOpen.value = true
}

function selectStage(stage) {
  const baseSubjects = stages.includes(stage) ? subjectNames : state.subjects.filter(s => s.stage === stage).map(s => s.subject)
  subjectForm.stage = stage
  subjectForm.subject = baseSubjects[0] || ''
  customStage.value = false
  customStageName.value = ''
  customSubjects.value = []
}

function selectSubject(subject) {
  subjectForm.subject = subject
  customSubject.value = false
  customSubjectName.value = ''
}

function startCustomStage() {
  customStageName.value = ''
  customStage.value = true
}

function startCustomSubject() {
  customSubjectName.value = ''
  customSubject.value = true
}

function hideEmptyCustomStage() {
  if (!customStageName.value.trim()) customStage.value = false
}

function hideEmptyCustomSubject() {
  if (!customSubjectName.value.trim()) customSubject.value = false
}

function commitCustomStage() {
  const name = customStageName.value.trim()
  if (!name) return hideEmptyCustomStage()
  if (stages.includes(name) || state.subjects.some(s => s.stage === name)) return selectStage(name)
  if (!customStages.value.includes(name)) customStages.value.push(name)
  subjectForm.stage = name
  subjectForm.subject = ''
  customStage.value = false
  customStageName.value = ''
  customSubjects.value = []
}

function startStageEdit(stage) {
  editingStage.value = stage
  editingStageName.value = stage
  customStage.value = false
}

function commitStageEdit() {
  const oldName = editingStage.value
  const name = editingStageName.value.trim()
  editingStage.value = ''
  editingStageName.value = ''
  if (!oldName || !name || name === oldName) return
  if (stageOptions.value.includes(name)) {
    removeStage(oldName)
    selectStage(name)
    return
  }
  customStages.value = customStages.value.map(stage => stage === oldName ? name : stage)
  state.subjects.forEach(item => {
    if (item.stage === oldName) item.stage = name
  })
  if (subjectForm.stage === oldName) subjectForm.stage = name
}

function removeStage(stage) {
  customStages.value = customStages.value.filter(item => item !== stage)
  state.subjects = state.subjects.filter(item => item.stage !== stage)
  if (subjectForm.stage === stage) selectStage(stages[0])
}

function commitCustomSubject() {
  const name = customSubjectName.value.trim()
  if (!name) return hideEmptyCustomSubject()
  if (!subjectOptions.value.includes(name)) customSubjects.value.push(name)
  subjectForm.subject = name
  customSubject.value = false
  customSubjectName.value = ''
}

function subjectExists(stage, subject) {
  return state.subjects.some(s => s.stage === stage && s.subject === subject)
}

function saveSubject() {
  if (!subjectForm.stage || !subjectForm.subject) return proxy.$modal.msgError('学段学科不能为空')
  if (subjectExists(subjectForm.stage, subjectForm.subject)) return proxy.$modal.msgError('学段学科已存在')
  state.subjects.push({ id: Date.now(), stage: subjectForm.stage, subject: subjectForm.subject, enabled: true })
  subjectDialogOpen.value = false
  persist()
}

function deleteSubject(item) {
  proxy.$modal.confirm(`确认删除 ${labelOf(item)}？`).then(() => {
    state.subjects = state.subjects.filter(s => s.id !== item.id)
    persist()
  }).catch(() => {})
}

function openMember() {
  memberOpen.value = true
}

function startNodeAdd() {
  nodeName.value = ''
  nodeAdding.value = true
}

function saveNode() {
  const name = nodeName.value.trim()
  nodeAdding.value = false
  if (!name) return
  state.nodes.push({ id: Date.now(), kind: treeKind.value, name })
  persist()
}

function startCategoryAdd() {
  categoryName.value = ''
  categoryAdding.value = true
}

function saveCategory() {
  const name = categoryName.value.trim()
  categoryAdding.value = false
  if (!name) return
  state.paperCategories.push({ id: Date.now(), name })
  persist()
}

function openQuestionDialog(question) {
  Object.assign(questionForm, question ? JSON.parse(JSON.stringify(question)) : blankQuestion(), { subjectId: activeSubject.value?.id || 29084676 })
  questionOpen.value = true
}

function editQuestion(question) {
  openQuestionDialog(question)
}

function toggleAnswer(key) {
  if (questionForm.type === '单选题') questionForm.answers = [key]
  else questionForm.answers = questionForm.answers.includes(key) ? questionForm.answers.filter(k => k !== key) : [...questionForm.answers, key]
}

function addOption() {
  questionForm.options.push({ key: String.fromCharCode(65 + questionForm.options.length), text: '' })
}

function removeOption(key) {
  questionForm.options = questionForm.options.filter(o => o.key !== key)
}

function saveQuestion(again) {
  if (!questionForm.title.trim()) return proxy.$modal.msgError('请输入题干')
  const copy = JSON.parse(JSON.stringify(questionForm))
  copy.id = copy.id || Date.now()
  state.questions = state.questions.filter(q => q.id !== copy.id).concat(copy)
  persist()
  if (again) Object.assign(questionForm, blankQuestion())
  else questionOpen.value = false
}

function removeQuestion(question) {
  state.questions = state.questions.filter(q => q.id !== question.id)
  persist()
}

function saveBatch() {
  batchText.value.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(line => state.questions.push({ ...blankQuestion(), id: Date.now() + Math.random(), title: line }))
  batchText.value = ''
  batchOpen.value = false
  persist()
}

function savePaper() {
  if (!paperForm.title.trim()) return proxy.$modal.msgError('请填写试卷标题')
  state.papers.push({ id: Date.now(), ...paperForm })
  paperOpen.value = false
  persist()
}

const seedTopics = ['字音字形', '词语运用', '句子改写', '标点符号', '古诗积累', '文言翻译', '现代文阅读', '说明文阅读', '语言表达', '作文审题']

function seedIfEmpty() {
  if (state.questions?.length) return
  state.nodes = [
    { id: 1, kind: 'point', name: '默认知识点' },
    { id: 2, kind: 'point', name: '字音字形' },
    { id: 3, kind: 'point', name: '词语与成语' },
    { id: 4, kind: 'point', name: '阅读理解' },
    { id: 5, kind: 'point', name: '习作表达' },
    { id: 101, kind: 'chapter', name: '第一单元 基础积累' },
    { id: 102, kind: 'chapter', name: '第二单元 阅读训练' },
    { id: 103, kind: 'chapter', name: '第三单元 表达与习作' }
  ]
  state.paperCategories = [{ id: 1, name: '默认分类' }, { id: 2, name: '同步练习' }, { id: 3, name: '期末复习' }]
  state.questions = Array.from({ length: 120 }, (_, index) => seedOrgQuestion(index))
  state.papers = [
    { id: 700001, title: '小学语文基础巩固卷', desc: '字词、句子、阅读综合训练。', questionCount: 24, score: 100 },
    { id: 700002, title: '小学语文阅读提升卷', desc: '现代文阅读和表达题组合。', questionCount: 18, score: 100 },
    { id: 700003, title: '小学语文期末模拟卷', desc: '覆盖基础、阅读、习作。', questionCount: 30, score: 100 }
  ]
  persist()
}

function seedOrgQuestion(index) {
  const type = questionTypes[index % questionTypes.length]
  const difficulty = difficulties[index % difficulties.length]
  const topic = seedTopics[index % seedTopics.length]
  const isChoice = type === questionTypes[0] || type === questionTypes[1]
  return {
    id: 900000 + index,
    type,
    title: `${topic}：完成第 ${index + 1} 题。`,
    options: isChoice ? ['A', 'B', 'C', 'D'].map((key, optionIndex) => ({ key, text: `${key}. ${seedOption(topic, optionIndex)}` })) : [],
    answers: isChoice ? [['A'], ['B'], ['C'], ['D']][index % 4] : [],
    answer: isChoice ? '' : seedAnswer(type, topic, index),
    analysis: `考查${topic}，先抓关键词，再结合语境判断。`,
    showAnalysis: true,
    subjectId: 29084676,
    pointIds: [2 + (index % 4)],
    chapterIds: [101 + (index % 3)],
    difficulty
  }
}

function seedClassInQuestions() {
  const types = classInFilters[0].items.slice(1)
  const sources = classInFilters[2].items.slice(1)
  return Array.from({ length: 180 }, (_, index) => {
    const type = types[index % types.length]
    const topic = seedTopics[index % seedTopics.length]
    return {
      id: index + 1,
      type,
      difficulty: difficulties[index % difficulties.length],
      title: `${topic}专项练习 ${index + 1}`,
      body: seedBody(type, topic, index),
      answer: seedAnswer(type, topic, index),
      source: sources[index % sources.length]
    }
  })
}

function seedOption(topic, index) {
  return [`${topic}判断正确`, `${topic}表述有误`, `${topic}需要结合上下文`, `${topic}属于拓展理解`][index]
}

function seedBody(type, topic, index) {
  if (type.includes('阅读')) return `阅读短文《${topic}里的发现》，概括主要内容，并说明第 ${index % 5 + 1} 段的作用。`
  if (type.includes('作文') || type.includes('习作')) return `请以“那一次，我懂得了${topic}”为题，完成习作提纲。`
  if (type.includes('填空') || type.includes('默写')) return '把下列句子补充完整：学而不思则____，思而不学则____。'
  if (type.includes('判断')) return '判断：成语“专心致志”可以形容学习态度认真。'
  return `围绕“${topic}”完成语文综合运用题，要求语句通顺、理由清楚。`
}

function seedAnswer(type, topic, index) {
  if (type.includes('作文') || type.includes('习作')) return '中心明确，选材具体，结构完整即可。'
  if (type.includes('判断')) return index % 2 ? '错' : '对'
  if (type.includes('填空') || type.includes('默写')) return '罔；殆'
  return `答案围绕${topic}作答，意思对即可。`
}

function defaultClassInQuestions() {
  return seedClassInQuestions()
  return [
    { id: 1, type: '填空题', difficulty: '中档', title: '用“ ”画出带点字的正确读音及正确的字。', body: '战靴（xuē xié） 裸（luǒ guǒ）露 惟妙惟（俏 肖）', answer: 'xuē、luǒ、肖' },
    { id: 2, type: '填空题', difficulty: '易', title: '把下列成语补充完整，并选择填空。', body: '寻＿问＿ 生＿死＿ ＿木难＿', answer: '寻根问底；出生入死；独木难支' },
    { id: 3, type: '问答题', difficulty: '中档', title: '阅读《生活里的一朵小浪花》并回答问题。', body: '短文主要写一个姑娘拾到钱包后的选择。', answer: '围绕人物外表美和心灵不美作答。' }
  ]
}

load()
</script>

<style scoped>
.qb-page { min-height: calc(100vh - 84px); padding: 24px 20px; background: #fff; color: #101418; }
button { border: 0; background: none; cursor: pointer; }
.qb-tabs { display: inline-flex; gap: 6px; margin-bottom: 24px; padding: 5px; border: 1px solid #e8edf0; border-radius: 22px; background: #f6f8f9; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .7); }
.qb-tabs button { position: relative; min-width: 128px; height: 40px; padding: 0 18px 5px; border-radius: 20px; color: #64707c; font-size: 18px; font-weight: 600; transition: background .16s ease, color .16s ease, box-shadow .16s ease; }
.qb-tabs button:hover { background: #fff; color: #17212b; box-shadow: 0 2px 8px rgba(16, 24, 40, .08); }
.qb-tabs .active { background: #e0f7eb; color: #11aa68; box-shadow: 0 2px 10px rgba(17, 185, 120, .16); }
.qb-tabs .active::after { content: ""; position: absolute; left: 50%; bottom: 4px; width: 20px; height: 3px; border-radius: 999px; background: #22c981; transform: translateX(-50%); }
.qb-topline { display: flex; align-items: center; gap: 18px; }
.subject-select { width: 200px; height: 34px; padding: 0 14px; border: 1px solid #d6d8dc; border-radius: 18px; display: flex; align-items: center; justify-content: space-between; color: #8e98a3; font-size: 16px; }
.pill { min-width: 72px; height: 34px; border-radius: 18px; background: #f5f6f7; color: #8a9299; font-size: 16px; }
.pill.active { background: #e0f7eb; color: #19b873; }
.global-search { width: 200px; margin-left: auto; }
.qb-body, .classin-layout { display: flex; margin-top: 28px; min-height: 650px; }
.qb-tree { width: 420px; transition: width .2s; border-right: 1px solid #eee; padding-right: 24px; }
.qb-tree.collapsed { width: 160px; }
.tree-head { display: flex; align-items: center; gap: 20px; height: 28px; }
.tree-head button.active { color: #11b978; }
.tree-head .el-icon { margin-left: auto; font-size: 16px; }
.tree-head .el-icon + .el-icon { margin-left: 12px; }
.tree-search { margin: 20px 0 14px 30px; width: calc(100% - 50px); }
.add-link { color: #21c481; margin: 20px 0 12px; cursor: pointer; }
.node-input { width: calc(100% - 35px); margin: 8px 0 12px 25px; }
.tree-item { padding: 8px 16px; border-radius: 6px; color: #59616b; }
.tree-item.active { background: #f0fbf6; color: #12b574; }
.paper-tree-title { margin-bottom: 20px; color: #7f8790; }
.qb-main, .classin-main { flex: 1; position: relative; padding-left: 34px; }
.empty { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); text-align: center; color: #c6cbd1; }
.wing { font-size: 72px; color: #d9dce0; line-height: 1; }
.floating-actions { position: absolute; left: 50%; top: 62%; transform: translateX(-50%); display: flex; gap: 16px; }
.floating-actions.single { top: 58%; }
.floating-actions :deep(.el-button) { min-width: 136px; height: 40px; border: 0; background: #f7f8f9; color: #242b33; font-weight: 600; box-shadow: 0 2px 8px rgba(16, 24, 40, .06); }
.floating-actions :deep(.el-button:hover) { background: #eef2f4; color: #121820; }
.floating-actions :deep(.el-button--success) { background: #38de78; color: #102018; }
.floating-actions :deep(.el-button--success:hover) { background: #30d66f; color: #102018; }
.question-card, .paper-card { padding: 20px 24px; border-bottom: 1px solid #edf0f2; max-width: 980px; }
.q-meta { display: flex; gap: 8px; color: #7f8790; font-size: 13px; }
.q-title { margin: 10px 0; font-size: 16px; line-height: 1.7; }
.q-options { margin-left: 24px; line-height: 1.9; }
.q-options .answer, .q-answer { color: #11b978; }
.q-actions { margin-top: 10px; }
.filter-line { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
.filter-line b { width: 42px; }
.filter-line button, .sort-line button { color: #5d6670; }
.filter-line button.active, .sort-line .active { color: #10b978; }
.sort-line { display: flex; gap: 22px; align-items: center; padding: 16px 0; border-top: 1px solid #edf0f2; border-bottom: 1px solid #edf0f2; }
.subject-menu-title { padding: 12px 18px; font-size: 18px; border-bottom: 1px solid #eee; }
.subject-menu-row { height: 56px; display: flex; align-items: center; gap: 10px; padding: 0 18px; cursor: pointer; }
.subject-menu-row .el-icon:last-child { margin-left: auto; }
.dialog-sub { color: #a0a6ad; margin-top: -10px; }
.chip-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
.chip-row button, .type-row button, .degree-row button { height: 28px; padding: 0 18px; border-radius: 15px; background: #f5f6f7; color: #8f99a3; }
.chip-row button.selected, .type-row button.selected, .degree-row button.selected, .option-row button.selected { background: #111; color: #fff; }
.chip-row button:disabled { opacity: .45; cursor: not-allowed; }
.chip-row .el-input { width: 120px; }
.stage-more { margin-left: 8px; font-weight: 700; line-height: 1; }
:global(.stage-popover.el-popper) { min-width: 84px !important; padding: 0; border: 0; border-radius: 8px; box-shadow: 0 12px 32px rgba(15, 23, 42, .14); overflow: hidden; }
:global(.stage-popover .stage-menu-item) { height: 44px; display: flex; align-items: center; gap: 10px; padding: 0 18px; color: #30363d; cursor: pointer;  }
:global(.stage-popover .stage-menu-item + .stage-menu-item) { border-top: 1px solid #f0f0f0; font-size: 12px;}
:global(.stage-popover .stage-menu-item:hover) { background: #f7f8fa; }
:global(.stage-popover .stage-menu-item.delete) { color: #ff4d4f; }
:global(.eeo-dialog .el-dialog__footer .el-button--success),
:global(.question-dialog .el-dialog__footer .el-button--success) { min-width: 86px; height: 34px; border: 0; border-radius: 17px; background: #38de78; color: #102018; font-weight: 600; }
:global(.eeo-dialog .el-dialog__footer .el-button--success:hover),
:global(.question-dialog .el-dialog__footer .el-button--success:hover) { background: #30d66f; color: #102018; }
:global(.eeo-dialog .el-dialog__footer .el-button:not(.el-button--success)),
:global(.question-dialog .el-dialog__footer .el-button:not(.el-button--success)) { color: #5d6670; font-weight: 600; }
.manage-actions { display: flex; gap: 10px; margin-bottom: 14px; }
.manage-row { display: grid; grid-template-columns: 1.3fr 1.2fr .8fr; align-items: center; min-height: 42px; border-bottom: 1px solid #f0f0f0; }
.manage-row.head { color: #8a9299; background: #fafafa; }
.manage-row .el-icon { margin-right: 18px; cursor: pointer; }
.member-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.role { float: right; color: #8a9299; }
.type-row, .degree-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.question-dialog h4 { margin: 20px 0 10px; }
.wide { width: 100%; }
.option-row { display: grid; grid-template-columns: 38px 1fr 24px; gap: 10px; align-items: center; margin-bottom: 10px; }
.option-row button { height: 28px; border-radius: 14px; background: #f5f6f7; }
.text-action { color: #10b978; margin: 6px 18px 10px 0; }
.full-dialog :deep(.el-dialog) { margin-top: 15px !important; }
.batch-panel, .paper-editor { min-height: 78vh; padding: 10px 24px 70px; }
.steps { display: flex; gap: 40px; color: #10b978; margin: 24px 0; }
.batch-actions, .paper-nav, .paper-footer { display: flex; align-items: center; gap: 18px; margin: 18px 0; }
.batch-footer { text-align: right; margin-top: 18px; }
.paper-editor .el-input { margin-bottom: 18px; }
.paper-stats { margin: 16px 0; color: #606975; }
.paper-footer { justify-content: space-between; border-top: 1px solid #edf0f2; padding-top: 16px; }
</style>
