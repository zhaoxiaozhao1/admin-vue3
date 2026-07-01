<template>
  <div class="public-action-page">
    <template v-if="action === 'monitor'">
      <section class="block">
        <div class="block-title">监课详情</div>
        <div class="lesson-line">
          <span>课堂名称：{{ detail.lessonName || '--' }}</span>
          <span>开课日期：{{ dateText(detail.startTime) }}</span>
          <span>时间：{{ clockText(detail.startTime) }}</span>
          <span>时长：{{ durationText }}</span>
          <span>状态：{{ statusText }}</span>
        </div>
        <div class="right-actions">
          <el-button size="small">无问题</el-button>
          <el-button size="small" type="primary">联系教师</el-button>
        </div>
      </section>

      <section class="block screenshot-block">
        <div class="block-title">教室截图(0)</div>
        <div class="empty-shot">
          <span class="nav left"></span>
          <span>暂无截图</span>
          <span class="nav right"></span>
        </div>
      </section>

      <section class="block chart-block">
        <div class="axis-label">学生人数图</div>
        <div class="student-chart">
          <div class="y-axis">1</div>
          <div class="zero">0</div>
          <div class="red-line"></div>
          <div class="ticks">
            <span v-for="time in monitorTicks" :key="time">{{ time }}</span>
          </div>
        </div>
      </section>

      <section class="block">
        <el-table :data="monitorRows" border>
          <el-table-column label="姓名/账号/昵称" min-width="170">
            <template #default="{ row }">
              <el-link type="primary" :underline="false">{{ row.name }}</el-link>
              <div class="green">+86 {{ row.phone }}</div>
              <div>{{ row.nick }}</div>
            </template>
          </el-table-column>
          <el-table-column label="拨打电话" width="110" align="center"><template #default>☎</template></el-table-column>
          <el-table-column label="身份" width="110" prop="role" />
          <el-table-column label="出勤" width="90" prop="attendance" />
          <el-table-column label="迟到" width="90"><template #default>--</template></el-table-column>
          <el-table-column label="早退" width="90"><template #default><span class="danger">早退</span></template></el-table-column>
          <el-table-column label="当前状态" width="110"><template #default>--</template></el-table-column>
          <el-table-column label="实际上课时长" width="120" prop="actualDuration" />
          <el-table-column label="时间线" min-width="520">
            <template #default>
              <div class="timeline">
                <span class="mark teacher">教师预课<br>{{ previewClock }}</span>
                <span class="mark student">学生预课<br>{{ previewClock }}</span>
                <span class="mark start">开始<br>{{ clockText(detail.startTime) }}</span>
                <span class="mark end">结束<br>{{ clockText(detail.endTime) }}</span>
                <span class="bar"></span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>

    <template v-else>
      <section class="block">
        <div class="block-title">课堂数据</div>
        <div class="lesson-line">
          <span>课堂进度：1/1</span>
          <span>班级有效期：{{ dateText(detail.endTime) }}</span>
        </div>
      </section>

      <section class="block">
        <el-tabs model-value="teach">
          <el-tab-pane label="授课分析" name="teach" />
          <el-tab-pane label="学习分析" name="study" />
        </el-tabs>
        <div class="filters">
          <el-button size="small">选择课堂（已选1个 / 共1个）</el-button>
          <el-button size="small">选择教师（已选1个 / 共1个）</el-button>
        </div>
        <div class="metric-grid">
          <div v-for="item in metrics" :key="item.label" class="metric">
            <div>{{ item.label }} <el-tag size="small" type="success">?</el-tag></div>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div class="data-chart">
          <div class="chart-toolbar">图自定义指标：选中6个</div>
          <div class="grid-chart">
            <span class="point">{{ detail.lessonName || '公开课' }}</span>
          </div>
        </div>
        <div class="table-toolbar">表格自定义指标：选中28个 <el-button type="primary" link size="small">下载表格</el-button></div>
        <el-table :data="dataRows" border>
          <el-table-column label="序号" width="70" type="index" />
          <el-table-column label="课堂信息" min-width="190">
            <template #default="{ row }">
              <div>{{ row.lessonName }}</div>
              <div>ID：{{ row.lessonId }}</div>
              <div>{{ parseTime(row.startTime) }} - {{ parseTime(row.endTime) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="教师姓名" min-width="160">
            <template #default="{ row }">
              <div>{{ row.teacherName || '--' }}</div>
              <div class="muted">{{ row.teacherPhone || '' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="实际上课时长" width="130" prop="actualDuration" />
          <el-table-column label="教师出勤" width="110"><template #default>出勤</template></el-table-column>
          <el-table-column label="学生出勤 总数" width="130"><template #default>0/0</template></el-table-column>
          <el-table-column label="教师评价 已评价学生数" width="170"><template #default>0</template></el-table-column>
          <el-table-column label="学生评价 人数" width="130"><template #default>0</template></el-table-column>
          <el-table-column label="客户端回放 观看人数" width="160"><template #default>{{ detail.playbackViews || 0 }}</template></el-table-column>
          <el-table-column label="文本课件 数量" width="130"><template #default>0</template></el-table-column>
        </el-table>
      </section>
    </template>
  </div>
</template>

<script setup>
import { parseTime } from '@/utils/ruoyi'
import { getPublicCourseData, getPublicCourseMonitor } from '@/api/course/publicCourse'

defineOptions({ name: 'PublicCourseAction' })

const route = useRoute()
const action = computed(() => route.params.action)
const detail = ref({})

const statusText = computed(() => ({ 0: '未开始', 1: '进行中', 2: '已结束' }[detail.value.lessonStatus] || '已结束'))
const durationText = computed(() => durationLabel(detail.value.startTime, detail.value.endTime))
const previewClock = computed(() => clockText(detail.value.startTime))
const monitorTicks = ['18:32', '18:35', '18:38', '18:41', '18:44', '18:47', '18:50', '18:53', '18:56', '18:59', '19:02']
const metrics = computed(() => [
  { label: '教师考勤', value: '1/1' },
  { label: '平均使用课件数量', value: '0.00' },
  { label: '平均使用课件时长', value: '0秒' },
  { label: '平均奖励次数', value: '0.00' },
  { label: '平均举手次数', value: '0.00' },
  { label: '平均授权次数', value: '0.00' },
  { label: '平均使用教室工具次数', value: '0.00' }
])
const monitorRows = computed(() => [{
  name: maskPhone(detail.value.teacherPhone || '13811587556'),
  phone: detail.value.teacherPhone || '13811587556',
  nick: detail.value.teacherName || 'superymq',
  role: '教师',
  attendance: '出勤',
  actualDuration: actualDuration.value
}])
const dataRows = computed(() => [{ ...detail.value, actualDuration: actualDuration.value }])
const actualDuration = computed(() => detail.value.lessonStatus === '2' ? '19秒' : '--')

function load() {
  const api = action.value === 'monitor' ? getPublicCourseMonitor : getPublicCourseData
  api(route.params.lessonId).then(res => {
    detail.value = res.data || {}
  })
}

function dateText(value) {
  return value ? parseTime(value, '{y}-{m}-{d}') : '--'
}

function clockText(value) {
  return value ? parseTime(value, '{h}:{i}') : '--'
}

function durationLabel(startValue, endValue) {
  const start = new Date(String(startValue || '').replace(/-/g, '/')).getTime()
  const end = new Date(String(endValue || '').replace(/-/g, '/')).getTime()
  if (!start || !end || end <= start) return '--'
  const minutes = Math.round((end - start) / 60000)
  return minutes >= 60 ? Math.round(minutes / 60) + '时' : minutes + '分钟'
}

function maskPhone(phone) {
  return String(phone || '').replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2')
}

load()
</script>

<style scoped>
.public-action-page {
  min-height: calc(100vh - 84px);
  padding: 18px;
  background: #f5f5f5;
  color: #1f2933;
}

.block {
  position: relative;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.block-title {
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background: #f3f5f7;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}

.lesson-line {
  min-height: 62px;
  padding: 16px 12px;
  display: flex;
  gap: 34px;
  align-items: center;
}

.right-actions {
  position: absolute;
  right: 12px;
  bottom: 14px;
}

.screenshot-block {
  height: 230px;
}

.empty-shot {
  height: 188px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
}

.nav {
  position: absolute;
  top: 112px;
  width: 28px;
  height: 28px;
  border: 3px solid #d4d7dc;
  border-radius: 50%;
}

.nav.left {
  left: 14px;
}

.nav.right {
  right: 14px;
}

.chart-block {
  height: 250px;
  padding: 16px 40px 26px;
}

.axis-label,
.chart-toolbar,
.table-toolbar {
  color: #606266;
  margin-bottom: 10px;
}

.student-chart {
  position: relative;
  height: 170px;
  border-left: 1px solid #909399;
  border-bottom: 1px solid #909399;
}

.red-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-top: 2px solid #f5222d;
}

.y-axis {
  position: absolute;
  left: -18px;
  top: -6px;
}

.zero {
  position: absolute;
  left: -18px;
  bottom: -8px;
}

.ticks {
  position: absolute;
  left: 18px;
  right: 0;
  bottom: -22px;
  display: flex;
  justify-content: space-between;
  color: #606266;
}

.timeline {
  position: relative;
  height: 58px;
}

.timeline .bar {
  position: absolute;
  left: 20px;
  right: 20px;
  top: 30px;
  height: 14px;
  border-radius: 8px;
  background: #e5e5e5;
}

.mark {
  position: absolute;
  top: 0;
  z-index: 1;
  font-size: 12px;
  text-align: center;
}

.teacher { left: 4%; color: #9b5cff; }
.student { left: 18%; color: #3b82f6; }
.start { left: 34%; color: #13ae7f; }
.end { left: 74%; color: #13ae7f; }

.filters {
  padding: 12px;
  display: flex;
  gap: 10px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(140px, 1fr));
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.metric {
  min-height: 100px;
  padding: 20px 12px;
  border-right: 1px solid #e5e7eb;
}

.metric strong {
  display: block;
  margin-top: 28px;
  font-size: 22px;
}

.data-chart {
  padding: 16px 12px;
}

.grid-chart {
  position: relative;
  height: 300px;
  border-left: 1px solid #909399;
  border-bottom: 1px solid #909399;
  background: repeating-linear-gradient(to bottom, transparent, transparent 74px, #e5e7eb 75px);
}

.point {
  position: absolute;
  left: 50%;
  bottom: -28px;
  transform: rotate(60deg);
  transform-origin: left top;
  color: #606266;
}

.table-toolbar {
  padding: 0 12px 12px;
}

.green {
  color: #009f72;
}

.danger {
  color: #f56c6c;
}

.muted {
  color: #909399;
  font-size: 12px;
}
</style>
