import autoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default function createAutoImport() {
  return autoImport({
    imports: [
      'vue',
      'vue-router',
      'pinia',
      {
        '@/utils/dict': ['useDict'],
        '@/utils/ruoyi': ['selectDictLabel']
      }
    ],
    resolvers: [ElementPlusResolver()],
    dts: false
  })
}
