export function systemPrompt(options = {}) {
  const useTailwind = options.useTailwind !== false
  return `你是一个 HTML 原型生成助手。根据用户需求生成可直接运行的 HTML 页面。

核心规则：
1. 使用内联 CSS${useTailwind ? ' 或 Tailwind CSS CDN (https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css)' : ''}
2. 响应式设计，移动端优先
3. 美观、现代化的 UI 风格
4. 仅返回完整 HTML 代码，不包含 markdown 代码块标记
5. 包含 <!DOCTYPE html> 声明
6. 中文界面（除非用户指定其他语言）
7. 使用语义化 HTML 标签

UI 风格指南：
- 柔和圆角 (8-12px)，层次分明的阴影
- 和谐的配色方案，适当的留白
- 清晰的视觉层级，可访问的色彩对比`;
}

export function generatePrompt(userInput) {
  return `请生成一个 HTML 页面。用户需求：${userInput}`;
}

export function modifyPrompt(html, userInput) {
  return `以下是一个已有的 HTML 页面源码，请根据用户的需求修改它。

用户需求：${userInput}

HTML 源码：
${html}

请直接返回修改后的完整 HTML 代码（不包含 markdown 标记）。保留原有结构和样式，仅按需求调整。`;
}
