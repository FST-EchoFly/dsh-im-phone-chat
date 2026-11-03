# 第三方组件声明 / Third-party notices

本插件的浏览器 bundle（`client.js`）内置了以下 MIT 许可的第三方库，仅用于渲染消息里的 Markdown 与数学公式：

## KaTeX

- 用途：把 `$...$` / `$$...$$` / `\(...\)` / `\[...\]` 中的 TeX 公式渲染为 MathML。
- 版本：0.16.x（构建时锁定在 `package.json` 的 devDependencies）。
- 许可：MIT
- 版权：Copyright (c) 2013-2020 Khan Academy and other contributors
- 项目主页：https://katex.org/

## markdown-it

- 用途：渲染助手/用户消息中的 Markdown（HTML 被禁用，只输出安全标记）。
- 版本：14.x（构建时锁定在 `package.json` 的 devDependencies）。
- 许可：MIT
- 版权：Copyright (c) 2014 Vitaly Puzrin, Alex Kocharin
- 项目主页：https://github.com/markdown-it/markdown-it

两个库均以 MIT 许可分发，允许在保留版权与许可声明的前提下随本插件一起打包。
