// 1. 这一行删掉了，因为你没有css文件，我们靠 CDN 撑场面
// import './index.css' 

// 2. 找到 HTML 里的那个盒子
const app = document.querySelector<HTMLDivElement>('#app')

// 3. 渲染内容
if (app) {
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div class="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 class="text-3xl font-bold text-blue-600 mb-4">
          LingoFlash AI ⚡️
        </h1>
        <p class="text-gray-600 mb-6">
          帅哥，你的网站修好啦！即使没有 CSS 文件，
          Tailwind CDN 也会帮你把它变得很漂亮。
        </p>
        <button id="test-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition">
          点击测试
        </button>
        <p id="result" class="mt-4 text-sm text-gray-500"></p>
      </div>
    </div>
  `

  // 4. 添加交互
  const btn = document.querySelector<HTMLButtonElement>('#test-btn')
  const result = document.querySelector<HTMLParagraphElement>('#result')
  
  if (btn && result) {
    btn.addEventListener('click', () => {
      result.textContent = "测试成功！代码运行正常 ✅"
    })
  }
}
