// 注意：不要 import 任何 AI 相关的包，否则会报错崩溃
const app = document.querySelector('#app')

if (app) {
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <h1 style="font-size: 30px; color: green;">🎉 界面终于修好了！</h1>
      <p style="color: gray; margin-top: 20px;">
        白屏消失了。现在网页已经能运行了。
      </p>
      <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
        <strong>下一步：</strong> 去 Vercel 设置 API Key 才能开启 AI 功能。
      </div>
    </div>
  `
}
