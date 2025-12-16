import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 如果你是React项目保留这个，如果是纯JS可以去掉

// 这是最基础的配置，确保没有重复和错误
export default defineConfig({
  plugins: [react()], // 如果你不是React项目，把这里改成 plugins: []
})
