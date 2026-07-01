<template>
  <el-config-provider :locale="locale" :size="size">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import Cookies from 'js-cookie'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import useSettingsStore from '@/store/modules/settings'
import { handleThemeStyle } from '@/utils/theme'

const locale = zhCn
const size = Cookies.get('size') || 'default'

function loadDarkCssVars() {
  if (document.documentElement.classList.contains('dark')) {
    import('element-plus/theme-chalk/dark/css-vars.css')
  }
}

onMounted(() => {
  loadDarkCssVars()
  nextTick(() => {
    handleThemeStyle(useSettingsStore().theme)
  })
})
</script>
