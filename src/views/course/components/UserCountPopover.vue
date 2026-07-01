<template>
  <el-popover v-if="visibleCount" trigger="hover" placement="top" :width="180" popper-class="eeo-user-popover">
    <div class="user-list">
      <div v-for="(item, index) in list" :key="index" class="user-row">
        <el-avatar :size="32">{{ avatarText(item.name) }}</el-avatar>
        <div class="user-info">
          <div>{{ item.name || '--' }}</div>
          <div class="muted">{{ phoneText(item) }}</div>
        </div>
      </div>
      <div v-if="!list.length" class="empty">暂无数据</div>
    </div>
    <template #reference>
      <button class="eeo-count-btn">{{ visibleCount }}</button>
    </template>
  </el-popover>
  <span v-else>--</span>
</template>

<script setup>
const props = defineProps({
  count: { type: Number, default: undefined },
  users: { type: Array, default: () => [] },
  summary: { type: String, default: '' },
  type: { type: String, default: '' }
})

const list = computed(() => props.users.length ? props.users : parseSummary(props.summary, props.type))
const visibleCount = computed(() => props.count ?? list.value.length)

function parseSummary(summary, type) {
  if (!summary) return []
  return summary.split(';;').map(item => {
    const [sourceType, name, phone, email, studentNo] = item.split('|')
    return { sourceType, name, phone, email, studentNo }
  }).filter(item => (!type || item.sourceType === type) && (item.name || item.phone || item.email || item.studentNo))
}

function avatarText(name) {
  return (name || '?').slice(0, 1)
}

function phoneText(item) {
  if (item.phone) return '+86 ' + item.phone
  return item.email || item.studentNo || '--'
}
</script>

<style scoped>
.eeo-count-btn {
  height: 28px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: #009265;
  cursor: pointer;
}

.user-list {
  padding: 2px 0;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
}

.user-info {
  line-height: 18px;
}

.muted,
.empty {
  color: #999;
}
</style>
