# CV Generator

一个现代化的在线简历生成器，基于 Vue 3 + Tailwind CSS 构建，支持实时预览、PDF 打印和一键导出。

## ✨ 特性

- 📝 **实时预览** - 编辑简历时右侧实时显示预览效果
- 🖨️ **PDF 打印优化** - 专业的打印样式，支持字体缩放确保内容完美适配页面
- 🎨 **主题定制** - 自定义主题颜色，打造个性化简历风格
- 📄 **多格式导出** - 支持 JSON 数据导入/导出，方便备份和迁移
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🔧 **灵活配置** - 可调整各章节标题、显示顺序和可见性

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 <http://localhost:3000> 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 📖 使用指南

### 基本编辑

1. 点击左侧导航图标切换不同的编辑板块
2. 在编辑区域修改内容，预览区域会实时更新
3. 点击 "PDF" 按钮打印简历

### 字体缩放

如果简历内容较多或较少，可以通过字体缩放功能调整：

1. 点击左侧设置图标（齿轮）
2. 在 "Font Scale" 区域调整缩放比例
3. 支持滑块、预设选择或直接输入数值（70%-120%）

### 数据管理

- **导出数据**：点击 "Export JSON" 备份简历数据
- **导入数据**：点击 "Import JSON" 恢复备份
- **章节排序**：在设置中拖拽调整各章节顺序

## 🛠️ 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式**: Tailwind CSS 4
- **图标**: Font Awesome
- **动画**: Motion

## 📁 项目结构

```
cv-generator/
├── src/
│   ├── components/       # Vue 组件
│   │   ├── CvEditor.vue       # 简历编辑器
│   │   ├── CvPreview.vue       # 简历预览
│   │   ├── EditorSection.vue   # 编辑区块组件
│   │   └── IconPicker.vue     # 图标选择器
│   ├── lib/
│   │   └── bibtex.ts          # BibTeX 解析工具
│   ├── App.vue           # 应用主组件
│   ├── main.ts           # 应用入口
│   ├── defaultData.ts    # 默认简历数据
│   ├── types.ts          # TypeScript 类型定义
│   └── index.css         # 全局样式
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🔧 配置

### 开发服务器端口

默认端口为 3000，如需修改可在 `package.json` 中调整：

```json
{
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0"
  }
}
```

### GitHub Pages 部署

项目已配置为可部署到 GitHub Pages。构建后将 `dist` 目录内容推送到 `gh-pages` 分支即可。

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

