<template>
  <div class="app-container eeo-placeholder">
    <el-empty :description="title + '功能建设中'">
      <el-button type="primary" plain @click="goStudent">前往学生管理</el-button>
    </el-empty>
  </div>
</template>

<script setup>
defineOptions({ name: 'EeoPlaceholder' })
const route = useRoute()
const router = useRouter()

const title = computed(() => route.meta?.title || '当前')

function goStudent() {
  router.push('/course/student')
}
</script>

<style scoped>
.eeo-placeholder {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
