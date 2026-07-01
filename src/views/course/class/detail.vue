<template>
  <div class="course-detail">
    <div class="detail-header">
      <h2>{{ classInfo.className || '班级详情' }}</h2>
      <div class="detail-tabs">
        <button v-for="item in tabs" :key="item.name" :class="{ active: activeTab === item.name }" @click="switchTab(item.name)">
          {{ item.label }}
        </button>
      </div>
    </div>

    <div v-loading="loading" class="detail-content" :class="{ 'with-tree': activeTab === 'activity' }">
      <aside v-if="activeTab === 'activity'" class="course-tree">
        <div class="tree-title">全部课程</div>
        <div v-for="item in categories" :key="item.categoryId" class="tree-item">
          <span class="fold">▶</span>
          <span>{{ item.name }}</span>
          <el-dropdown>
            <el-button link icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>编辑课程</el-dropdown-item>
                <el-dropdown-item>创建单元</el-dropdown-item>
                <el-dropdown-item>删除课程</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="tree-actions">
          <el-button plain type="primary" @click="openCategory('course')">创建课程</el-button>
          <el-button plain type="primary" @click="openCategory('unit')">创建单元</el-button>
        </div>
      </aside>

      <main class="detail-main">
        <template v-if="activeTab === 'activity'">
          <el-form class="filter-card" inline>
            <el-form-item label="活动名称："><el-input v-model="activityQuery.name" placeholder="请输入活动名称" clearable style="width: 220px" /></el-form-item>
            <el-form-item label="活动类型：">
              <el-select v-model="activityQuery.type" placeholder="全部" clearable style="width: 180px">
                <el-option label="课堂" value="lesson" />
                <el-option label="作业" value="homework" />
                <el-option label="测验" value="exam" />
              </el-select>
            </el-form-item>
            <el-form-item label="授课教师：">
              <el-select v-model="activityQuery.teacherId" filterable clearable placeholder="请输入姓名/手机号/邮箱" style="width: 220px">
                <el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态：">
              <el-select v-model="activityQuery.status" multiple collapse-tags clearable style="width: 220px">
                <el-option label="未开始" value="0" />
                <el-option label="进行中" value="1" />
                <el-option label="已结束" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="活动时间："><el-date-picker v-model="activityQuery.timeRange" value-format="YYYY-MM-DD HH:mm:ss" type="datetimerange" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px" /></el-form-item>
          </el-form>

          <div class="table-card">
            <div class="table-toolbar">
              <div>
                <strong>活动数（{{ filteredActivities.length }}）</strong>
                <el-button type="primary" class="ml16" @click="openLesson()">新建</el-button>
                <el-button :disabled="!selectedLessons.length">批量操作</el-button>
              </div>
              <el-button link type="primary">保存到TeacherIn</el-button>
            </div>
            <el-table :data="filteredActivities" border height="560" @selection-change="rows => selectedLessons = rows">
              <el-table-column type="selection" width="48" />
              <el-table-column label="序号" width="70" type="index" />
              <el-table-column label="活动名称" min-width="180" prop="lessonName" />
              <el-table-column label="单元主题" min-width="180"><template #default>新课程 / 无单元主题</template></el-table-column>
              <el-table-column label="活动类型" width="110"><template #default="{ row }">{{ lessonTypeLabel(row.lessonType) }}</template></el-table-column>
              <el-table-column label="状态" width="100"><template #default="{ row }">{{ lessonStatusLabel(row.lessonStatus) }}</template></el-table-column>
              <el-table-column label="活动时间" min-width="190"><template #default="{ row }">{{ dateText(row) }} {{ timeText(row) }}</template></el-table-column>
              <el-table-column label="活动时长" width="110"><template #default="{ row }">{{ duration(row) }}</template></el-table-column>
              <el-table-column label="授课教师" min-width="170"><template #default="{ row }"><div class="person"><el-avatar :size="36">{{ avatarName(row.teacherName) }}</el-avatar><span>{{ row.teacherName || '--' }}</span></div></template></el-table-column>
              <el-table-column label="联席教师" width="100" align="center"><template #default>1</template></el-table-column>
              <el-table-column label="插班生" width="100" align="center"><template #default="{ row }"><el-button link type="primary" @click="openTransferDialog(row)">{{ transferButtonText(row) }}</el-button></template></el-table-column>
              <el-table-column label="调出生" min-width="160"><template #default><div class="person"><el-avatar :size="32">S</el-avatar><span>superqio</span></div></template></el-table-column>
              <el-table-column label="默认展示座位席" min-width="190"><template #default>开启(自动上台,非全体静音)</template></el-table-column>
              <el-table-column label="台上人数" width="100"><template #default>1v8</template></el-table-column>
              <el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openLesson(row)">操作</el-button></template></el-table-column>
            </el-table>
          </div>
        </template>

        <template v-if="activeTab === 'lesson'">
          <div class="view-switch">
            <el-button :type="lessonView === 'calendar' ? 'primary' : 'default'" link icon="Calendar" @click="lessonView = 'calendar'">日历视图</el-button>
            <el-button :type="lessonView === 'list' ? 'primary' : 'default'" link icon="List" @click="lessonView = 'list'">列表视图</el-button>
          </div>
          <el-form class="filter-card" inline>
            <el-form-item label="课堂名称："><el-input v-model="lessonQuery.lessonName" placeholder="请输入课堂名称" clearable style="width: 220px" /></el-form-item>
            <el-form-item label="授课教师："><el-select v-model="lessonQuery.teacherId" filterable clearable placeholder="请输入姓名/手机号/邮箱" style="width: 220px"><el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" /></el-select></el-form-item>
            <el-form-item label="插班生："><el-input v-model="lessonQuery.studentKeyword" placeholder="请输入姓名/手机号/邮箱/学号" clearable style="width: 220px" /></el-form-item>
            <el-form-item label="单元主题："><el-select v-model="lessonQuery.unit" placeholder="请选择单元主题" clearable style="width: 220px"><el-option label="新课程 / 无单元主题" value="default" /></el-select></el-form-item>
            <el-form-item label="状态："><el-select v-model="lessonQuery.status" multiple collapse-tags clearable style="width: 220px"><el-option label="未开始" value="0" /><el-option label="进行中" value="1" /><el-option label="已结束" value="2" /></el-select></el-form-item>
            <el-form-item label="星期："><el-select v-model="lessonQuery.weekday" placeholder="全部" clearable style="width: 160px"><el-option label="周一" value="1" /><el-option label="周二" value="2" /><el-option label="周三" value="3" /><el-option label="周四" value="4" /><el-option label="周五" value="5" /><el-option label="周六" value="6" /><el-option label="周日" value="0" /></el-select></el-form-item>
            <el-form-item label="开课日期："><el-date-picker v-model="lessonQuery.lessonDateRange" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px" /></el-form-item>
            <el-form-item label="开课时间："><el-time-picker v-model="lessonQuery.lessonTimeRange" is-range value-format="HH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 280px" /></el-form-item>
            <el-form-item label="标签："><el-select v-model="lessonQuery.labelIds" multiple collapse-tags clearable placeholder="请选择标签" style="width: 220px"><el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" /></el-select></el-form-item>
          </el-form>

          <div class="table-card">
            <div class="table-toolbar">
              <div>
                <strong>课堂数（{{ filteredLessons.length }}）</strong>
                <el-button type="primary" class="ml16" @click="openLesson()">新建课堂</el-button>
                <el-button plain type="primary" @click="openBatch()">批量新建课堂</el-button>
                <el-dropdown @command="batchCommand"><el-button :disabled="!selectedLessons.length">批量操作</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item command="delete">删除课堂</el-dropdown-item><el-dropdown-item command="export">导出课堂</el-dropdown-item></el-dropdown-menu></template></el-dropdown>
              </div>
            </div>
            <div v-if="lessonView === 'calendar'" class="calendar-grid">
              <div v-for="row in filteredLessons" :key="row.lessonId" class="calendar-item">
                <strong>{{ dateText(row) }}</strong>
                <span>{{ timeText(row) }} {{ row.lessonName }}</span>
                <em>{{ row.teacherName || '--' }}</em>
              </div>
            </div>
            <el-table v-else :data="filteredLessons" border height="620" @selection-change="rows => selectedLessons = rows">
              <el-table-column type="selection" width="48" />
              <el-table-column label="序号" width="70" type="index" />
              <el-table-column label="课堂名称" min-width="180" prop="lessonName" />
              <el-table-column label="单元主题" min-width="180"><template #default>新课程 / 无单元主题</template></el-table-column>
              <el-table-column label="状态" width="100"><template #default="{ row }">{{ lessonStatusLabel(row.lessonStatus) }}</template></el-table-column>
              <el-table-column label="开课日期" min-width="150"><template #default="{ row }">{{ dateText(row) }}</template></el-table-column>
              <el-table-column label="开课时间" width="120"><template #default="{ row }">{{ timeText(row) }}</template></el-table-column>
              <el-table-column label="课堂时长" width="110"><template #default="{ row }">{{ duration(row) }}</template></el-table-column>
              <el-table-column label="授课教师" min-width="170"><template #default="{ row }"><div class="person"><el-avatar :size="36">{{ avatarName(row.teacherName) }}</el-avatar><span>{{ row.teacherName || '--' }}</span></div></template></el-table-column>
              <el-table-column label="联席教师" width="100" align="center"><template #default>1</template></el-table-column>
              <el-table-column label="插班生" width="100" align="center"><template #default="{ row }"><el-button link type="primary" @click="openTransferDialog(row)">{{ transferButtonText(row) }}</el-button></template></el-table-column>
              <el-table-column label="调出生" min-width="160"><template #default><div class="person"><el-avatar :size="32">S</el-avatar><span>superqio</span></div></template></el-table-column>
              <el-table-column label="默认展示座位席" min-width="190"><template #default>开启(自动上台,非全体静音)</template></el-table-column>
              <el-table-column label="台上人数" width="100"><template #default>1v8</template></el-table-column>
              <el-table-column label="云端录课" min-width="180"><template #default><div><span class="dot"></span>未开启录制ClassIn教室<br><span class="dot"></span>未开启录制现场</div></template></el-table-column>
              <el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openLesson(row)">操作</el-button></template></el-table-column>
            </el-table>
          </div>
        </template>

        <template v-if="activeTab === 'member'">
          <h3>教师</h3>
          <div class="teacher-cards">
            <div v-for="item in teachers" :key="item.memberId" class="teacher-card">
              <el-avatar :size="54">{{ avatarName(item.memberName) }}</el-avatar>
              <div><strong>{{ item.memberName }}</strong><p>{{ item.memberType === 'head_teacher' ? '班主任' : '授课教师' }}</p></div>
            </div>
            <button class="setup-card" @click="openTeacherDialog">
              <span class="setup-icon">⚙</span>
              <span>设置教师</span>
            </button>
          </div>
          <div class="member-tabs">
            <button :class="{ active: memberMode === 'student' }" @click="memberMode = 'student'">班级学生({{ students.length }}/300)</button>
            <button :class="{ active: memberMode === 'auditor' }" @click="memberMode = 'auditor'">旁听生({{ auditors.length }}/20)</button>
            <span class="help">?</span>
          </div>
          <div class="table-card">
            <div class="table-toolbar">
              <div>
                <el-button type="primary" @click="openStudentDialog(memberMode)">设置{{ memberMode === 'auditor' ? '旁听生' : '班级学生' }}</el-button>
                <el-dropdown @command="memberBatch"><el-button :disabled="!selectedMembers.length">批量操作</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item command="remove">移除</el-dropdown-item></el-dropdown-menu></template></el-dropdown>
                <span class="warn">新加入班级的学生，不允许查看历史课堂的数据</span>
              </div>
              <div class="member-search">
                <span>搜索：</span>
                <el-input v-model="memberQuery.keyword" placeholder="请输入姓名/手机号/邮箱" clearable style="width: 260px" />
                <el-select v-model="memberQuery.labelIds" multiple collapse-tags clearable placeholder="请选择标签" style="width: 220px"><el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" /></el-select>
                <el-button link type="primary" icon="Download" @click="exportMembers">导出Excel</el-button>
              </div>
            </div>
            <el-table :data="filteredMembers" border height="560" @selection-change="rows => selectedMembers = rows">
              <el-table-column type="selection" width="48" />
              <el-table-column label="序号" width="70" type="index" />
              <el-table-column label="姓名" min-width="140"><template #default="{ row }"><el-button link type="primary">{{ row.memberName }}</el-button></template></el-table-column>
              <el-table-column label="班级昵称" min-width="140" prop="memberName" />
              <el-table-column label="手机号" min-width="140"><template #default="{ row }">{{ memberMobile(row) }}</template></el-table-column>
              <el-table-column label="邮箱" min-width="140"><template #default>--</template></el-table-column>
              <el-table-column label="学号" min-width="140"><template #default>--</template></el-table-column>
              <el-table-column label="正常出勤/迟到/早退/旷课" min-width="190"><template #default>0/0/0/{{ lessons.length || 0 }}</template></el-table-column>
              <el-table-column label="作业完成情况" min-width="160"><template #default>--</template></el-table-column>
              <el-table-column label="测验完成情况" min-width="160"><template #default>0/0</template></el-table-column>
              <el-table-column label="标签" min-width="120"><template #default><el-button link icon="EditPen" /></template></el-table-column>
              <el-table-column label="添加进班级时间" min-width="170"><template #default="{ row }">{{ formatDateTime(row.createTime) }}</template></el-table-column>
              <el-table-column label="操作" width="160" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openNickname(row)">编辑昵称</el-button><el-button link type="danger" @click="removeMember(row)">移除</el-button></template></el-table-column>
            </el-table>
          </div>
        </template>

        <template v-if="activeTab === 'setting'">
          <el-form class="setting-card" label-width="160px">
            <el-form-item label="班级名称：" required><el-input v-model="settingForm.className" maxlength="90" show-word-limit style="width: 360px" /></el-form-item>
            <el-form-item label="班级头像：">
              <div class="cover-row">
                <div class="cover-preview"><img v-if="settingForm.cover" :src="settingForm.cover" /><span v-else>上传头像</span></div>
                <div class="share-preview">
                  <strong>班级头像预览效果</strong>
                  <p>ClassIn客户端班级头像</p>
                  <div class="mini-card"><el-avatar :size="40">{{ avatarName(settingForm.className) }}</el-avatar><span>{{ settingForm.className }}</span></div>
                  <p>直播小程序分享图</p>
                  <div class="phone-card">{{ settingForm.className }}</div>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="班级简介："><el-input v-model="settingForm.intro" type="textarea" maxlength="400" show-word-limit :rows="5" placeholder="请输入班级简介，400字以内" style="width: 680px" /></el-form-item>
            <el-form-item label="班级云盘资源："><el-button plain icon="Plus" @click="addMockResource">选择云盘资源</el-button><span class="hint">不选时，班级云盘资源默认为空</span><el-tag v-for="item in resources" :key="item.resourceId || item.resourceName" class="ml8">{{ item.resourceName }}</el-tag></el-form-item>
            <el-form-item label="教室设置："><el-input v-model="settingForm.classroomSetting" placeholder="不选时，将使用学校当前启用的教室设置" style="width: 360px" /></el-form-item>
            <el-form-item label="班级标签："><el-select v-model="settingForm.labelIds" multiple collapse-tags clearable style="width: 360px"><el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" /></el-select></el-form-item>
            <el-form-item label="班级有效期："><el-date-picker v-model="settingForm.validEndDate" value-format="YYYY-MM-DD" type="date" placeholder="永久有效" style="width: 180px" /></el-form-item>
            <el-form-item label="回放有效期："><el-radio-group v-model="settingForm.validType"><el-radio label="forever">固定有效期</el-radio><el-radio label="afterLesson">课堂结束后</el-radio></el-radio-group><el-date-picker v-if="settingForm.validType === 'forever'" v-model="settingForm.validEndDate" value-format="YYYY-MM-DD" type="date" placeholder="永久有效" class="ml8" /><el-input-number v-else v-model="settingForm.autoFinishDays" :min="1" :max="365" class="ml8" /><span class="ml8">天内有效</span></el-form-item>
            <el-form-item label="回放观看限制："><el-switch v-model="settingForm.replayLimitEnabled" /><el-input-number v-model="settingForm.replayLimit" :min="1" :max="20" :disabled="!settingForm.replayLimitEnabled" class="ml8" /><span class="ml8">次</span></el-form-item>
            <el-form-item label="高级设置：">
              <div class="check-list">
                <el-checkbox v-model="settingForm.allowStudentJoin" true-label="1" false-label="0">允许学生主动加入班级</el-checkbox>
                <el-checkbox v-model="settingForm.allowMemberFriend" true-label="1" false-label="0">允许班级成员互相添加好友</el-checkbox>
                <el-checkbox v-model="settingForm.allowTeacherAddLesson" true-label="1" false-label="0">允许班主任添加班级成员为好友</el-checkbox>
                <el-checkbox v-model="settingForm.allowTeacherAddLesson" true-label="1" false-label="0">允许教师添加课堂</el-checkbox>
                <el-checkbox v-model="settingForm.allowStudentEditNickname" true-label="1" false-label="0">允许学生修改班级昵称</el-checkbox>
                <el-checkbox v-model="settingForm.allowLeftStudentView" true-label="1" false-label="0">允许离开班级的学生或班级解散后，可查看班级内容</el-checkbox>
                <el-checkbox v-model="settingForm.allowTempClassroom" true-label="1" false-label="0">允许显示班级动态</el-checkbox>
                <div>允许以下成员开启临时教室</div>
                <div><el-checkbox v-model="settingForm.tempTeacher" true-label="1" false-label="0">教师</el-checkbox><el-checkbox v-model="settingForm.tempStudent" true-label="1" false-label="0">学生</el-checkbox></div>
              </div>
            </el-form-item>
            <el-form-item label="共创设置："><el-checkbox v-model="settingForm.coEditStudent" true-label="1" false-label="0">学生可编辑共创文档</el-checkbox><el-checkbox v-model="settingForm.coEditTeacher" true-label="1" false-label="0">教师可编辑共创文档</el-checkbox><el-checkbox v-model="settingForm.aiEnabled" true-label="1" false-label="0">学生可使用AI功能</el-checkbox></el-form-item>
            <el-form-item label="AI应用设置："><el-checkbox v-model="settingForm.aiEnabled" true-label="1" false-label="0">学生可使用AI应用</el-checkbox></el-form-item>
            <el-form-item><el-button type="primary" @click="saveSettings">保存设置</el-button></el-form-item>
          </el-form>
        </template>
      </main>
    </div>

    <el-dialog :title="categoryDialog.type === 'course' ? '创建课程' : '创建单元'" v-model="categoryDialog.open" width="480px" append-to-body>
      <el-form label-width="90px"><el-form-item :label="categoryDialog.type === 'course' ? '课程名称' : '单元名称'"><el-input v-model="categoryDialog.name" maxlength="40" show-word-limit /></el-form-item></el-form>
      <template #footer><el-button type="primary" @click="saveCategory">确定</el-button><el-button @click="categoryDialog.open = false">取消</el-button></template>
    </el-dialog>

    <el-dialog title="新建课堂" v-model="lessonDialog.open" width="760px" append-to-body>
      <el-form label-width="130px" class="lesson-form">
        <el-form-item label="课堂名称：" required><el-input v-model="lessonForm.lessonName" maxlength="90" show-word-limit /></el-form-item>
        <el-form-item label="单元主题：" required><el-select model-value="default" style="width: 100%"><el-option label="新课程 / 无单元主题" value="default" /></el-select></el-form-item>
        <el-form-item label="开课时间：" required><el-date-picker v-model="lessonTimeRange" value-format="YYYY-MM-DD HH:mm:ss" type="datetimerange" style="width: 100%" /></el-form-item>
        <el-form-item label="课堂时长："><el-input-number :model-value="0" :min="0" /><span class="ml8">小时</span><el-input-number class="ml8" :model-value="30" :min="1" /><span class="ml8">分钟</span></el-form-item>
        <el-form-item label="授课教师：" required><el-select v-model="lessonForm.teacherId" filterable clearable placeholder="设置授课教师" style="width: 100%"><el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" /></el-select></el-form-item>
        <el-form-item label="联席教师："><el-select v-model="lessonForm.assistantIds" multiple collapse-tags filterable clearable placeholder="设置联席教师" style="width: 100%"><el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" /></el-select></el-form-item>
        <el-form-item label="默认展示座位席："><el-switch v-model="lessonForm.isAutoOnstage" active-value="1" inactive-value="0" /><el-radio-group class="ml8" model-value="auto"><el-radio label="auto">自动上台</el-radio><el-radio label="manual">手动上台</el-radio></el-radio-group></el-form-item>
        <el-form-item label="台上人数："><el-select v-model="lessonForm.seatNum" style="width: 180px"><el-option label="1v8" :value="9" /><el-option label="1v16" :value="17" /></el-select></el-form-item>
        <el-form-item label="云盘资源："><el-button plain icon="Plus">选择云盘资源</el-button></el-form-item>
        <el-form-item label="标签："><el-select v-model="lessonForm.labelIds" multiple collapse-tags clearable style="width: 100%"><el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" /></el-select></el-form-item>
        <el-form-item label="云端录课："><span class="muted">非认证学校无法使用录课直播功能</span></el-form-item>
        <el-form-item label="直播/回放："><span class="muted">非认证学校无法使用录课直播功能</span></el-form-item>
        <el-form-item label="AI设置："><span class="muted">非认证学校无法使用录课直播功能</span></el-form-item>
        <el-form-item label="高级设置："><el-checkbox v-model="lessonForm.allowStudentReport" true-label="1" false-label="0">允许学生互相查看学习报告</el-checkbox></el-form-item>
      </el-form>
      <template #footer><el-button @click="lessonDialog.open = false">取消</el-button><el-button @click="saveLesson('draft')">保存草稿</el-button><el-button type="primary" @click="saveLesson('publish')">发布</el-button></template>
    </el-dialog>

    <el-dialog title="批量新建课堂" v-model="batchDialog.open" width="980px" append-to-body>
      <div class="toolbar-line"><el-button type="primary" plain icon="Plus" @click="batchRows.push(createBatchRow())">添加一行</el-button><span class="muted">可一次创建多节课堂。</span></div>
      <el-table :data="batchRows" border max-height="420">
        <el-table-column label="课堂名称" min-width="180"><template #default="{ row }"><el-input v-model="row.lessonName" /></template></el-table-column>
        <el-table-column label="开课时间" min-width="260"><template #default="{ row }"><el-date-picker v-model="row.timeRange" value-format="YYYY-MM-DD HH:mm:ss" type="datetimerange" style="width: 100%" /></template></el-table-column>
        <el-table-column label="授课教师" min-width="180"><template #default="{ row }"><el-select v-model="row.teacherId" filterable clearable style="width: 100%"><el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" /></el-select></template></el-table-column>
        <el-table-column label="操作" width="90" align="center"><template #default="scope"><el-button link type="danger" @click="batchRows.splice(scope.$index, 1)">删除</el-button></template></el-table-column>
      </el-table>
      <template #footer><el-button type="primary" @click="saveBatchLessons">发布</el-button><el-button @click="batchDialog.open = false">取消</el-button></template>
    </el-dialog>

    <el-dialog title="设置教师" v-model="teacherDialog.open" width="620px" append-to-body>
      <el-form label-width="96px">
        <el-form-item label="班主任"><el-select v-model="memberForm.headTeacherId" filterable clearable style="width: 100%"><el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" /></el-select></el-form-item>
        <el-form-item label="授课教师"><el-select v-model="memberForm.teacherIds" multiple collapse-tags filterable clearable style="width: 100%"><el-option v-for="item in teacherOptions" :key="item.teacherId" :label="teacherLabel(item)" :value="item.teacherId" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="saveMembers">确定</el-button><el-button @click="teacherDialog.open = false">取消</el-button></template>
    </el-dialog>

    <el-dialog :title="studentDialog.type === 'auditor' ? '设置旁听生' : '设置班级学生'" v-model="studentDialog.open" width="760px" append-to-body>
      <el-select v-model="studentDialog.ids" multiple filterable clearable collapse-tags style="width: 100%"><el-option v-for="item in studentOptions" :key="item.studentId" :label="studentLabel(item)" :value="item.studentId" /></el-select>
      <p class="hint">新加入班级的学生，不允许查看历史课堂的数据。</p>
      <template #footer><el-button type="primary" @click="saveStudentMembers">确定</el-button><el-button @click="studentDialog.open = false">取消</el-button></template>
    </el-dialog>

    <el-dialog title="设置插班生" v-model="transferDialog.open" width="920px" append-to-body class="transfer-dialog">
      <div class="transfer-layout">
        <section class="transfer-left">
          <div class="transfer-tabs">
            <button :class="{ active: transferDialog.source === 'student' }" @click="transferDialog.source = 'student'">从学生列表选择</button>
            <button :class="{ active: transferDialog.source === 'teacher' }" @click="transferDialog.source = 'teacher'">从教师列表选择</button>
          </div>
          <div class="transfer-filters">
            <el-input v-model="transferDialog.keyword" placeholder="姓名/手机号/邮箱" clearable />
            <el-select v-model="transferDialog.labelIds" multiple collapse-tags clearable placeholder="标签">
              <el-option v-for="item in labelOptions" :key="item.labelId" :label="item.labelName" :value="item.labelId" />
            </el-select>
          </div>
          <div class="transfer-title">{{ transferDialog.source === 'teacher' ? '教师' : '学生' }}（{{ transferCandidates.length }}）<span class="help mini">?</span></div>
          <el-table :data="transferCandidates" height="330" border>
            <el-table-column width="42" align="center">
              <template #header><el-checkbox :model-value="transferCandidates.length > 0 && transferCandidates.every(isTransferSelected)" @change="toggleAllTransferCandidates" /></template>
              <template #default="{ row }"><el-checkbox :model-value="isTransferSelected(row)" @change="toggleTransferCandidate(row)" /></template>
            </el-table-column>
            <el-table-column label="姓名" min-width="150" prop="memberName" />
            <el-table-column label="手机号/邮箱" min-width="180"><template #default="{ row }">{{ transferContact(row) }}</template></el-table-column>
          </el-table>
          <div class="transfer-bottom-actions">
            <el-button @click="proxy.$modal.msgSuccess('请到学生管理页面添加学生')">添加学生</el-button>
            <el-button @click="copyClassStudentsToTransfer">复制班级学生</el-button>
          </div>
        </section>
        <section class="transfer-right">
          <div class="selected-head">
            <strong>已选（{{ transferDialog.selected.length }}）</strong>
            <div>
              <el-button size="small" @click="batchAddTransferCandidates">批量新增</el-button>
              <el-button size="small" @click="removeCheckedTransfers">批量移除</el-button>
              <el-button size="small" @click="clearTransferSelected">全部移除</el-button>
            </div>
          </div>
          <div v-if="transferDialog.selected.length" class="selected-list">
            <div v-for="item in transferDialog.selected" :key="transferKey(item)" class="selected-item">
              <el-checkbox :model-value="transferDialog.checkedSelected.includes(transferKey(item))" @change="toggleCheckedSelected(item)" />
              <el-avatar :size="32">{{ avatarName(item.memberName) }}</el-avatar>
              <div>
                <strong>{{ item.memberName }}</strong>
                <p>{{ transferContact(item) }}</p>
              </div>
              <button class="remove-selected" @click="removeTransfer(item)">×</button>
            </div>
          </div>
          <div v-else class="selected-empty">请选择</div>
        </section>
      </div>
      <template #footer><el-button @click="transferDialog.open = false">取消</el-button><el-button type="primary" :loading="transferDialog.loading" @click="saveTransferStudents">确定</el-button></template>
    </el-dialog>

    <el-dialog title="编辑昵称" v-model="nicknameDialog.open" width="420px" append-to-body>
      <el-input v-model="nicknameDialog.nickname" maxlength="40" show-word-limit />
      <template #footer><el-button type="primary" @click="applyNickname">确定</el-button><el-button @click="nicknameDialog.open = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'CourseClassDetail' })
import { useRoute, useRouter } from 'vue-router'
import {
  getClassOverview,
  updateClass,
  listClassLabels,
  listClassTeacherOptions,
  listClassStudentOptions,
  addClassLesson,
  saveClassMembers,
  saveClassResources,
  listLessonTransferStudents,
  saveLessonTransferStudents
} from '@/api/course/class'

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()
const tabs = [{ name: 'activity', label: '活动' }, { name: 'lesson', label: '课表' }, { name: 'member', label: '成员' }, { name: 'setting', label: '设置' }]

const classId = computed(() => route.params.classId)
const activeTab = computed(() => route.params.tab || 'lesson')
const classInfo = ref({})
const members = ref([])
const resources = ref([])
const lessons = ref([])
const labelOptions = ref([])
const teacherOptions = ref([])
const studentOptions = ref([])
const loading = ref(false)
const lessonView = ref('list')
const selectedLessons = ref([])
const selectedMembers = ref([])
const memberMode = ref('student')
const categories = ref([{ categoryId: 1, name: '新课程', activityCount: 0 }, { categoryId: 2, name: '123', activityCount: 0 }])
const activityQuery = reactive({ name: '', type: '', teacherId: undefined, status: [], timeRange: [] })
const lessonQuery = reactive({ lessonName: '', teacherId: undefined, studentKeyword: '', unit: '', status: ['0'], weekday: '', lessonDateRange: [], lessonTimeRange: [], labelIds: [] })
const memberQuery = reactive({ keyword: '', labelIds: [] })
const settingForm = reactive({})
const memberForm = reactive({ headTeacherId: undefined, teacherIds: [], studentIds: [], auditorIds: [] })
const lessonDialog = reactive({ open: false })
const batchDialog = reactive({ open: false })
const batchRows = ref([])
const lessonForm = reactive({})
const lessonTimeRange = ref([])
const teacherDialog = reactive({ open: false })
const studentDialog = reactive({ open: false, type: 'student', ids: [] })
const transferDialog = reactive({
  open: false,
  lesson: null,
  source: 'student',
  keyword: '',
  labelIds: [],
  selected: [],
  checkedSelected: [],
  loading: false
})
const nicknameDialog = reactive({ open: false, row: null, nickname: '' })
const categoryDialog = reactive({ open: false, type: 'course', name: '' })

const filteredLessons = computed(() => lessons.value.filter(item => {
  if (lessonQuery.lessonName && !String(item.lessonName || '').includes(lessonQuery.lessonName)) return false
  if (lessonQuery.teacherId && item.teacherId !== lessonQuery.teacherId) return false
  if (lessonQuery.status.length && !lessonQuery.status.includes(item.lessonStatus || '0')) return false
  if (lessonQuery.weekday && weekday(item.startTime) !== lessonQuery.weekday) return false
  if (lessonQuery.studentKeyword && !lessonTransferMatches(item, lessonQuery.studentKeyword)) return false
  return true
}))
const filteredActivities = computed(() => filteredLessons.value.filter(item => {
  if (activityQuery.name && !String(item.lessonName || '').includes(activityQuery.name)) return false
  if (activityQuery.teacherId && item.teacherId !== activityQuery.teacherId) return false
  if (activityQuery.status.length && !activityQuery.status.includes(item.lessonStatus || '0')) return false
  return true
}))
const teachers = computed(() => members.value.filter(item => item.memberType === 'head_teacher' || item.memberType === 'teacher'))
const students = computed(() => members.value.filter(item => item.memberType === 'student'))
const auditors = computed(() => members.value.filter(item => item.memberType === 'auditor'))
const currentMembers = computed(() => memberMode.value === 'auditor' ? auditors.value : students.value)
const filteredMembers = computed(() => currentMembers.value.filter(item => !memberQuery.keyword || String(item.memberName || '').includes(memberQuery.keyword)))
const transferCandidates = computed(() => {
  const keyword = String(transferDialog.keyword || '').trim()
  const labelIds = transferDialog.labelIds || []
  const source = transferDialog.source === 'teacher' ? teacherOptions.value : studentOptions.value
  return source.map(item => transferDialog.source === 'teacher' ? teacherToTransfer(item) : studentToTransfer(item))
    .filter(item => {
      if (keyword && !transferMatchesKeyword(item, keyword)) return false
      if (labelIds.length && !memberHasLabels(item, labelIds)) return false
      return true
    })
})

function loadAll() {
  loading.value = true
  return getClassOverview(classId.value).then(response => {
    const data = response.data || {}
    classInfo.value = data.classInfo || {}
    members.value = data.members || []
    resources.value = data.resources || []
    lessons.value = data.lessons || []
    fillForms()
  }).finally(() => { loading.value = false })
}
function loadOptions() {
  listClassLabels().then(response => { labelOptions.value = response.data || [] })
  listClassTeacherOptions({ teacherStatus: '0' }).then(response => { teacherOptions.value = response.data || [] })
  listClassStudentOptions({ displayStatus: '0' }).then(response => { studentOptions.value = response.data || [] })
}
function fillForms() {
  Object.assign(settingForm, {
    ...classInfo.value,
    labelIds: classInfo.value.labelIds || [],
    validType: classInfo.value.validType || 'forever',
    replayLimitEnabled: Number(classInfo.value.replayLimit || 0) > 0,
    tempTeacher: '1',
    tempStudent: '1',
    coEditStudent: '1',
    coEditTeacher: '1',
    aiEnabled: '1'
  })
  Object.assign(memberForm, {
    headTeacherId: classInfo.value.headTeacherId,
    teacherIds: classInfo.value.teacherIds || [],
    studentIds: classInfo.value.studentIds || [],
    auditorIds: classInfo.value.auditorIds || []
  })
}
function switchTab(tab) {
  router.replace({ name: 'CourseClassDetail', params: { classId: classId.value, tab } })
}
function openLesson(row) {
  Object.keys(lessonForm).forEach(key => delete lessonForm[key])
  Object.assign(lessonForm, {
    lessonName: row?.lessonName || nextLessonName(),
    lessonType: row?.lessonType || 'normal',
    lessonStatus: row?.lessonStatus || '0',
    teacherId: row?.teacherId || classInfo.value.headTeacherId,
    assistantIds: [],
    seatNum: 9,
    resourceScope: row?.resourceScope || 'class',
    isAutoOnstage: '1',
    allowStudentReport: '0'
  })
  lessonTimeRange.value = row?.startTime && row?.endTime ? [formatDateTime(row.startTime), formatDateTime(row.endTime)] : []
  lessonDialog.open = true
}
function openBatch() {
  batchRows.value = [createBatchRow()]
  batchDialog.open = true
}
function createBatchRow() {
  return { lessonName: nextLessonName(), timeRange: [], teacherId: classInfo.value.headTeacherId }
}
function saveLesson(mode) {
  if (!lessonForm.lessonName) return proxy.$modal.msgError('课堂名称不能为空')
  const payload = { ...lessonForm, lessonStatus: mode === 'draft' ? 'draft' : '0' }
  if (lessonTimeRange.value?.length === 2) {
    payload.startTime = lessonTimeRange.value[0]
    payload.endTime = lessonTimeRange.value[1]
  }
  addClassLesson(classId.value, payload).then(() => {
    proxy.$modal.msgSuccess(mode === 'draft' ? '保存草稿成功' : '发布成功')
    lessonDialog.open = false
    loadAll()
  })
}
function saveBatchLessons() {
  const rows = batchRows.value.filter(row => row.lessonName)
  if (!rows.length) return proxy.$modal.msgError('请至少填写一节课堂')
  Promise.all(rows.map(row => {
    const payload = { lessonName: row.lessonName, lessonType: 'normal', lessonStatus: '0', teacherId: row.teacherId }
    if (row.timeRange?.length === 2) {
      payload.startTime = row.timeRange[0]
      payload.endTime = row.timeRange[1]
    }
    return addClassLesson(classId.value, payload)
  })).then(() => {
    proxy.$modal.msgSuccess('批量新建课堂成功')
    batchDialog.open = false
    loadAll()
  })
}
function openTeacherDialog() {
  fillForms()
  teacherDialog.open = true
}
function saveMembers() {
  saveClassMembers(classId.value, memberForm).then(() => {
    proxy.$modal.msgSuccess('成员设置成功')
    teacherDialog.open = false
    studentDialog.open = false
    loadAll()
  })
}
function openStudentDialog(type) {
  fillForms()
  studentDialog.type = type
  studentDialog.ids = type === 'auditor' ? [...memberForm.auditorIds] : [...memberForm.studentIds]
  studentDialog.open = true
}
function saveStudentMembers() {
  if (studentDialog.type === 'auditor') memberForm.auditorIds = [...studentDialog.ids]
  else memberForm.studentIds = [...studentDialog.ids]
  saveMembers()
}
function openTransferDialog(row) {
  if (!row?.lessonId) return proxy.$modal.msgError('请先创建课堂')
  transferDialog.lesson = row
  transferDialog.source = 'student'
  transferDialog.keyword = ''
  transferDialog.labelIds = []
  transferDialog.checkedSelected = []
  transferDialog.selected = normalizeTransferRows(row.transferStudents || [])
  transferDialog.open = true
  listLessonTransferStudents(row.lessonId).then(response => {
    transferDialog.selected = normalizeTransferRows(response.data || [])
  })
}
function transferButtonText(row) {
  const count = Number(row?.transferStudentCount || 0) || (row?.transferStudents || []).length
  return count > 0 ? String(count) : '添加'
}
function lessonTransferMatches(row, keyword) {
  const text = [
    row.transferStudentNames,
    ...(row.transferStudents || []).flatMap(item => [item.memberName, item.phone, item.email, item.studentNo])
  ].filter(Boolean).join(' ')
  return text.includes(keyword)
}
function normalizeTransferRows(rows) {
  return rows.map(item => {
    const base = item.sourceType === 'teacher' || item.teacherId ? teacherToTransfer(item) : studentToTransfer(item)
    return { ...base, transferId: item.transferId }
  }).filter(item => item.studentId || item.teacherId)
}
function studentToTransfer(item) {
  return {
    sourceType: 'student',
    studentId: item.studentId,
    teacherId: null,
    memberName: item.memberName || item.studentName || item.name || '--',
    phoneAreaCode: item.phoneAreaCode || '+86',
    phone: item.phone || item.mobile || '',
    email: item.email || '',
    studentNo: item.studentNo || item.stuno || '',
    labelIds: item.labelIds || item.lableIds || []
  }
}
function teacherToTransfer(item) {
  return {
    sourceType: 'teacher',
    studentId: null,
    teacherId: item.teacherId,
    memberName: item.memberName || item.teacherName || item.name || '--',
    phoneAreaCode: item.phoneAreaCode || '+86',
    phone: item.phone || item.mobile || '',
    email: item.email || '',
    studentNo: item.empNo || '',
    labelIds: item.labelIds || []
  }
}
function transferKey(item) {
  return `${item.sourceType || 'student'}-${item.teacherId || item.studentId}`
}
function transferContact(item) {
  if (item.phone) return `${item.phoneAreaCode || '+86'} ${item.phone}`
  return item.email || item.studentNo || '--'
}
function transferMatchesKeyword(item, keyword) {
  return [item.memberName, item.phone, item.email, item.studentNo].filter(Boolean).some(value => String(value).includes(keyword))
}
function memberHasLabels(item, labelIds) {
  const sourceLabels = item.labelIds || []
  if (!sourceLabels.length) return false
  return labelIds.every(id => sourceLabels.includes(id))
}
function isTransferSelected(row) {
  const key = transferKey(row)
  return transferDialog.selected.some(item => transferKey(item) === key)
}
function addTransferCandidate(row) {
  if (!isTransferSelected(row)) transferDialog.selected.push({ ...row })
}
function removeTransfer(row) {
  const key = transferKey(row)
  transferDialog.selected = transferDialog.selected.filter(item => transferKey(item) !== key)
  transferDialog.checkedSelected = transferDialog.checkedSelected.filter(item => item !== key)
}
function toggleTransferCandidate(row) {
  isTransferSelected(row) ? removeTransfer(row) : addTransferCandidate(row)
}
function toggleAllTransferCandidates(checked) {
  if (checked) {
    transferCandidates.value.forEach(addTransferCandidate)
    return
  }
  const keys = transferCandidates.value.map(transferKey)
  transferDialog.selected = transferDialog.selected.filter(item => !keys.includes(transferKey(item)))
  transferDialog.checkedSelected = transferDialog.checkedSelected.filter(item => !keys.includes(item))
}
function batchAddTransferCandidates() {
  transferCandidates.value.forEach(addTransferCandidate)
}
function toggleCheckedSelected(row) {
  const key = transferKey(row)
  if (transferDialog.checkedSelected.includes(key)) {
    transferDialog.checkedSelected = transferDialog.checkedSelected.filter(item => item !== key)
  } else {
    transferDialog.checkedSelected.push(key)
  }
}
function removeCheckedTransfers() {
  if (!transferDialog.checkedSelected.length) return
  const keys = [...transferDialog.checkedSelected]
  transferDialog.selected = transferDialog.selected.filter(item => !keys.includes(transferKey(item)))
  transferDialog.checkedSelected = []
}
function clearTransferSelected() {
  transferDialog.selected = []
  transferDialog.checkedSelected = []
}
function copyClassStudentsToTransfer() {
  students.value.forEach(member => {
    const option = studentOptions.value.find(item => item.studentId === member.studentId) || {}
    addTransferCandidate(studentToTransfer({ ...option, ...member }))
  })
}
function saveTransferStudents() {
  if (!transferDialog.lesson?.lessonId) return
  const payload = transferDialog.selected.map(item => ({
    sourceType: item.sourceType,
    studentId: item.sourceType === 'student' ? item.studentId : null,
    teacherId: item.sourceType === 'teacher' ? item.teacherId : null
  }))
  transferDialog.loading = true
  saveLessonTransferStudents(transferDialog.lesson.lessonId, payload).then(() => {
    proxy.$modal.msgSuccess('插班生设置成功')
    transferDialog.open = false
    return loadAll()
  }).finally(() => { transferDialog.loading = false })
}
function removeMember(row) {
  const key = row.memberType === 'auditor' ? 'auditorIds' : 'studentIds'
  memberForm[key] = memberForm[key].filter(id => id !== row.studentId)
  saveMembers()
}
function openNickname(row) {
  nicknameDialog.row = row
  nicknameDialog.nickname = row.memberName || ''
  nicknameDialog.open = true
}
function applyNickname() {
  if (nicknameDialog.row) nicknameDialog.row.memberName = nicknameDialog.nickname
  nicknameDialog.open = false
  proxy.$modal.msgSuccess('昵称已更新')
}
function saveSettings() {
  const payload = { ...classInfo.value, ...settingForm, replayLimit: settingForm.replayLimitEnabled ? settingForm.replayLimit : 0 }
  updateClass(payload).then(() => saveClassResources(classId.value, resources.value.map(item => ({ ...item })))).then(() => {
    proxy.$modal.msgSuccess('保存设置成功')
    loadAll()
  })
}
function openCategory(type) {
  categoryDialog.type = type
  categoryDialog.name = ''
  categoryDialog.open = true
}
function saveCategory() {
  if (!categoryDialog.name) return proxy.$modal.msgError('名称不能为空')
  categories.value.push({ categoryId: Date.now(), name: categoryDialog.name, activityCount: 0 })
  categoryDialog.open = false
}
function batchCommand(command) {
  proxy.$modal.msgSuccess(command === 'export' ? '已生成导出任务' : '批量操作已提交')
}
function memberBatch(command) {
  if (command !== 'remove') return
  const ids = selectedMembers.value.map(item => item.studentId)
  const key = memberMode.value === 'auditor' ? 'auditorIds' : 'studentIds'
  memberForm[key] = memberForm[key].filter(id => !ids.includes(id))
  saveMembers()
}
function addMockResource() {
  resources.value.push({ resourceName: '班级云盘资源', resourceType: 'cloud', resourceScope: 'class', resourceStatus: 'normal' })
}
function exportMembers() {
  proxy.$modal.msgSuccess('已生成导出Excel任务')
}
function nextLessonName() {
  return `${classInfo.value.className || '课堂'} - ${(lessons.value.length || 0) + 1}`
}
function lessonStatusLabel(status) {
  return ({ '0': '未开始', '1': '进行中', '2': '已结束', draft: '草稿' })[status] || '未开始'
}
function lessonTypeLabel(type) {
  return type === 'dual' ? '双师课' : type === 'public' ? '公开课' : '课堂'
}
function teacherLabel(item) {
  return item.teacherName + (item.phone ? ' / ' + item.phone : '')
}
function studentLabel(item) {
  return item.studentName + (item.phone ? ' / ' + item.phone : item.studentNo ? ' / ' + item.studentNo : '')
}
function weekday(time) {
  if (!time) return ''
  return String(new Date(time).getDay())
}
function duration(row) {
  if (!row.startTime || !row.endTime) return '--'
  const minutes = Math.max(1, Math.round((new Date(row.endTime) - new Date(row.startTime)) / 60000))
  return `${minutes}分钟`
}
function dateText(row) {
  if (!row.startTime) return '--'
  const day = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(row.startTime).getDay()]
  return `${formatDate(row.startTime)} (${day})`
}
function timeText(row) {
  if (!row.startTime) return '--'
  const date = new Date(row.startTime)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
function pad(value) {
  return String(value).padStart(2, '0')
}
function memberMobile(row) {
  return studentOptions.value.find(item => item.studentId === row.studentId)?.phone || '--'
}
function avatarName(name) {
  return (name || '?').slice(0, 1)
}
loadOptions()
loadAll()
</script>

<style scoped>
.course-detail { min-height: calc(100vh - 84px); background: #f5f6f7; color: #111827; }
.detail-header { height: 74px; background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 300px; padding: 0 24px; }
.detail-header h2 { min-width: 160px; margin: 0; font-size: 18px; }
.detail-tabs { display: flex; height: 100%; align-items: center; gap: 54px; }
.detail-tabs button, .member-tabs button { border: 0; background: transparent; cursor: pointer; font-size: 15px; height: 100%; border-bottom: 3px solid transparent; }
.detail-tabs button.active, .member-tabs button.active { color: #009966; font-weight: 600; border-bottom-color: #009966; }
.detail-content { display: flex; padding: 14px 18px; }
.detail-content.with-tree { gap: 14px; }
.course-tree { width: 260px; min-height: 820px; background: #fff; border-right: 1px solid #e5e7eb; padding: 12px 14px; }
.tree-title { color: #009966; font-weight: 600; margin-bottom: 16px; }
.tree-item { height: 34px; display: flex; align-items: center; gap: 8px; }
.tree-item .el-dropdown { margin-left: auto; }
.fold { color: #8c8c8c; font-size: 12px; }
.tree-actions { display: flex; justify-content: center; gap: 10px; margin-top: 28px; }
.detail-main { min-width: 0; flex: 1; }
.filter-card, .table-card, .setting-card { background: #fff; border-radius: 3px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
.filter-card { padding: 18px 20px 4px; margin-bottom: 14px; }
.table-card { padding: 16px 18px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 46px; margin-bottom: 10px; }
.view-switch { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.ml8 { margin-left: 8px; }
.ml16 { margin-left: 16px; }
.muted, .hint { color: #9ca3af; }
.hint { margin: 10px 0 0; }
.warn { color: #ff9900; margin-left: 14px; }
.person { display: flex; align-items: center; gap: 8px; }
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #f5222d; margin-right: 4px; }
.calendar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; min-height: 520px; }
.calendar-item { border: 1px solid #e5e7eb; border-left: 3px solid #009966; padding: 12px; display: grid; gap: 8px; align-content: start; }
.calendar-item em { color: #6b7280; font-style: normal; }
.teacher-cards { display: flex; align-items: stretch; gap: 14px; margin: 14px 0 28px; }
.teacher-card, .setup-card { width: 210px; min-height: 88px; background: #fff; border: 1px solid #f0f0f0; box-shadow: 0 1px 8px rgba(0,0,0,.05); border-radius: 3px; display: flex; align-items: center; gap: 12px; padding: 14px; }
.teacher-card p { margin: 6px 0 0; color: #8c8c8c; }
.setup-card { border: 1px dashed #9ca3af; justify-content: center; color: #009966; cursor: pointer; flex-direction: column; }
.setup-icon { font-size: 24px; line-height: 1; }
.member-tabs { display: flex; align-items: center; gap: 26px; height: 46px; }
.member-tabs button { height: 46px; font-size: 18px; font-weight: 600; }
.help { width: 18px; height: 18px; border: 1px solid #9ca3af; border-radius: 50%; display: inline-grid; place-items: center; color: #6b7280; }
.member-search { display: flex; align-items: center; gap: 10px; }
.setting-card { padding: 24px 180px 80px; }
.cover-row { display: flex; background: #f4f4f5; padding: 14px; gap: 22px; }
.cover-preview { width: 170px; height: 170px; background: #a7f3d0; border: 1px dashed #8c8c8c; display: grid; place-items: center; color: #6b7280; }
.cover-preview img { width: 100%; height: 100%; object-fit: cover; }
.share-preview { width: 360px; }
.mini-card { height: 58px; background: #fff; display: flex; align-items: center; gap: 10px; padding: 0 12px; border: 1px solid #e5e7eb; }
.phone-card { width: 112px; height: 142px; background: #fff; border: 1px solid #e5e7eb; padding: 16px; }
.check-list { display: grid; gap: 12px; }
.toolbar-line { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.transfer-layout { display: grid; grid-template-columns: 1.25fr .9fr; gap: 28px; min-height: 460px; }
.transfer-left, .transfer-right { min-width: 0; display: flex; flex-direction: column; }
.transfer-tabs { display: flex; align-items: center; gap: 22px; height: 34px; }
.transfer-tabs button { border: 0; background: transparent; cursor: pointer; padding: 0 0 8px; border-bottom: 2px solid transparent; color: #303133; }
.transfer-tabs button.active { color: #009966; border-bottom-color: #009966; font-weight: 600; }
.transfer-filters { display: grid; grid-template-columns: 1fr .88fr; gap: 8px; margin: 8px 0 10px; }
.transfer-title { height: 28px; display: flex; align-items: center; gap: 6px; font-weight: 600; }
.help.mini { width: 14px; height: 14px; font-size: 10px; }
.transfer-bottom-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 14px; }
.selected-head { height: 34px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.selected-head .el-button { margin-left: 4px; }
.selected-list { flex: 1; overflow: auto; padding-top: 10px; }
.selected-item { height: 48px; display: grid; grid-template-columns: 22px 32px 1fr 22px; align-items: center; gap: 8px; }
.selected-item strong { display: block; line-height: 18px; font-weight: 500; }
.selected-item p { margin: 0; color: #6b7280; font-size: 12px; line-height: 18px; }
.remove-selected { border: 0; background: transparent; color: #a8abb2; cursor: pointer; font-size: 18px; line-height: 1; }
.selected-empty { flex: 1; display: grid; place-items: center; color: #9ca3af; }
:deep(.transfer-dialog .el-dialog__body) { padding-top: 8px; }
</style>
