# Phase 06 - Landing Brand Hero 方案 C

## 目标

本方案用于重做 LexHub 首页首屏。方向选择为 **Hybrid / LexHub Brand SaaS Hero**：

- 参考现代 Figma/SaaS landing 的大画布、强标题、产品 mockup 和高留白。
- 保留 LexHub 的蓝金品牌、法律秩序感、路径办理特色。
- 让 logo 不只是导航标识，而是整个首屏视觉语言的来源。
- 不 1:1 复刻外部页面，避免授权和同质化风险。

## 与既有阶段的统一关系

本方案不是新增一套独立风格，而是把前面阶段的结论收束到首页首屏：

| 已有阶段 | 本方案如何继承 |
| --- | --- |
| Phase 01 参考体系 | 继承 “Primer 工具感 + Figma/SaaS landing 表达 + LexHub 业务模式” 的混合策略。 |
| Phase 03 Token | 沿用现有 `--color-primary`、`--color-accent`、`--color-success`、`--radius-*`、`--shadow-*`，避免新增大量一次性颜色。 |
| Phase 04 核心页面 | 首屏只负责品牌和入口，不替代 Workspace Intake / Run / Result 的业务页面。 |
| Phase 05 前端系统 | 使用当前 React + CSS 架构，不引入 Tailwind、Ant Design 或新 UI 框架。 |
| Phase 05 实施记录 | 延续“先局部、再验证、再扩展”的施工方式。 |

本方案的边界：

- 只处理 Landing 首屏和它的品牌 mockup。
- 不改登录、工作台、结果页、后台页面。
- 不改接口加载和认证逻辑。
- 不重写全站 token。

## 参考来源

可参考的开放或社区资源：

- Untitled UI：SaaS landing、Figma UI kit、marketing examples。
- Framer Free SaaS UI Kit：大面积首屏、渐变产品 mockup、响应式 section。
- Figma Open Design Systems：变量、组件、开放设计系统组织方式。
- 45 SaaS landing page designs free Figma file：拆解高质量 SaaS 首屏共性。

参考方式：

- 学结构，不复制具体图形。
- 学比例，不复制品牌元素。
- 学 mockup 表达，不复制具体合同工具页面。

## 设计总原则

### 采用

- 大白色 presentation frame，提高首页首屏的“设计稿/产品发布页”质感。
- 左侧强标题 + 短文案 + CTA + trust tags。
- 右侧产品 mockup 表达 LexHub 的核心业务。
- Logo 圆环、中轴、金线转译为背景纹理、路径线、节点状态。
- 蓝金品牌色保留，但降低金色面积。

### 不采用

- 不复制参考图里的黑白品牌、邮箱式 logo、英文合同签署定位。
- 不把 LexHub 做成普通 “AI Contract Signing”。
- 不让右侧 mockup 变成后台截图。
- 不新增大型 UI 框架。
- 不使用过强玻璃拟态、漂浮上下摇晃、大面积发光装饰。

## 设计关键词

- **Legal SaaS**：专业、可信、克制。
- **Brand-led**：由 LexHub logo 推导视觉，而不是套模板。
- **Path System**：突出事项路径、节点、依据、复核。
- **Editorial Hero**：标题更短、更有节奏，减少功能堆叠。
- **Product Mockup**：右侧展示“办理中的法律事项”，不是后台截图。

## Logo 视觉拆解

现有 `lexhub-ui-mark.png` 包含四个可复用设计信号：

1. **圆环**
   - 用于首屏大画布背景的隐形轨道。
   - 用于右侧 mockup 的状态环、进度环。
   - 用于 badge、按钮和卡片角标。

2. **中轴**
   - 用于页面纵向秩序线。
   - 用于右侧事项卡的路径主线。
   - 用于“法律事项沿路径办理”的核心隐喻。

3. **横向金线**
   - 用于标题关键词下划线或 CTA hover。
   - 用于 mockup 中“依据已确认 / 风险待复核”的状态线。
   - 用于区分法律重点，而不是大面积铺金色。

4. **蓝绿金配色**
   - 深蓝：主文字、主 CTA、权威感。
   - 青绿：办理进度、完成状态、路径节点。
   - 金色：重点、风险、依据、品牌记忆点。

## 品牌元素映射

| Logo 元素 | 页面落点 | CSS / 组件建议 |
| --- | --- | --- |
| 圆环 | hero 背景暗纹、mockup 进度环、状态章 | `::before` radial/conic background，不新增图片依赖。 |
| 中轴 | mockup 路径主线、节点连接线 | `.landing-brand-path-line`。 |
| 金线 | CTA 描边、当前节点、风险提示线 | 使用 `--color-accent`，面积小于首屏 8%。 |
| 深蓝竖线 | 主 CTA、标题、导航激活状态 | 使用 `--color-primary` 和 `--color-primary-hover`。 |
| 青绿色环段 | 已完成状态、路径完成节点 | 使用 `--color-success` 或局部青绿色。 |

Logo 使用方式：

- 导航左侧保留完整 logo + wordmark。
- 右侧 mockup 里使用小尺寸 mark 或 `LexHub Matter Path` 文本。
- 背景暗纹只抽象圆环/中轴，不直接重复铺 logo。

## 首屏结构

### 外层

采用类似参考图的 presentation frame：

- 页面背景：蓝灰颗粒渐变。
- 中央容器：大白色圆角画布。
- 容器圆角：较大，但内部组件仍保持 LexHub 当前 6-12px 的专业工具圆角。
- 背景加轻量 logo 圆环纹理，透明度低于 8%。

建议尺寸：

| 项 | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| 页面外边距 | 28-40px | 20-28px | 12-16px |
| 白色画布最大宽度 | 1280-1360px | 100% | 100% |
| 白色画布圆角 | 28-36px | 24px | 18px |
| 首屏内边距 | 48-64px | 36-44px | 24px |
| 左右列比例 | 0.92fr / 1.08fr | 1fr | 1fr |

### 顶部导航

结构：

- 左侧：LexHub logo + `律枢 LexHub`
- 中间：产品、解决方案、办理流程、会员方案
- 右侧：登录 / 发起事项

风格：

- 不做纯黑白；保留深蓝 CTA。
- 主 CTA 用深蓝填充，边缘可带极细金色描边。
- 导航间距参考 SaaS landing，但文字不要过多。

导航建议：

```text
左：律枢 LexHub
中：产品 · 解决方案 · 办理流程 · 会员方案
右：登录 | 发起事项
```

移动端：

- 不强做复杂 hamburger。
- 可隐藏中间导航，只保留 logo + CTA。
- 若已有移动导航逻辑，沿用现有实现。

### 左侧文案

推荐标题：

```text
让法律事项
沿路径办理。
```

备选标题：

```text
法律事项，
有序推进。
```

不推荐：

```text
Contracts. Simplified. Secured. Signed.
```

原因：英文合同签署方向太像外部参考，和 LexHub 的“办理链路”差异不够。

正文：

```text
从材料受理到依据检索、风险复核与文书交付，LexHub 把每一步沉淀为可追溯的办理记录。
```

信任块：

- 合同审查
- 争议解决
- 公司事务
- 文书交付

信任块可以换成“场景标签”，不要伪造客户 logo：

```text
合同审查 / 争议解决 / 公司事务 / 文书交付
```

CTA：

- 主按钮：发起事项
- 次按钮：查看办理流程

左侧信息层级：

1. Brand lockup。
2. 小型可信标签：`法律事项办理工作台` 或 `Matter Path System`。
3. 大标题。
4. 一句正文。
5. CTA。
6. 场景标签。

标题排版约束：

- 中文字距必须为 `0`。
- 第一行不允许断成 “法律事 / 项”。
- 移动端优先缩小字号，而不是任意断字。
- 行数保持 2-3 行，不做 5 行大标题。

### 右侧产品 mockup

右侧不再使用完整后台截图，而是做品牌化产品卡片。

外层：

- 大块蓝绿渐变背景。
- 内部有轻颗粒、轻网格和 logo 圆环暗纹。
- 外层固定，不上下摇晃。

浮层 1：顶部状态卡

```text
合同审查 · 已同步
证据完整度 82%
```

浮层 2：中央事项卡

```text
LexHub Matter Path
服务合同审查

证据完整度      82%
引用依据        12
复核风险        3
归档状态        Ready
```

浮层 3：风险提示卡

```text
违约责任条款需复核
Review Suggested
```

浮层 4：路径节点

```text
H1 事项受理
H2 证据质检
H3 法规研究
H4 文书生成
H5 交叉审查
```

节点不要做成后台列表，应更像抽象路径：

- 细线连接。
- 当前节点用蓝金描边。
- 已完成节点用青绿点。
- 待处理节点用虚线。

### 右侧 mockup 页面组

建议保留 3 个轮播页面，与当前已经实现的轮播方向一致，但视觉改为品牌 mockup：

#### Slide 1 - 事项总览

目的：说明 LexHub 能把事项结构化。

内容：

- 标题：`合同审查办理`
- 指标：证据完整度 82%、引用依据 12、复核风险 3、归档状态 Ready
- 路径节点：事项受理 -> 证据质检 -> 法规研究

#### Slide 2 - 审查结论

目的：说明系统输出不是聊天，而是审查报告。

内容：

- 标题：`风险与依据同步呈现`
- 指标：高风险 1、中风险 2、可追溯依据 18、报告状态 Done
- 浮层：`违约责任条款需复核`

#### Slide 3 - 文书交付

目的：说明最终闭环是文书和归档。

内容：

- 标题：`报告与文书按需生成`
- 指标：交付类型 4、生成进度 96%、导出格式 DOCX、归档状态 Saved
- 浮层：`审查意见书已生成`

## 动效方案

保留“固定大框 + 内部横向切换”的方向。

建议：

- 大框固定。
- 内部卡片每 4 秒横向切换一次。
- 切换距离小，不做大幅位移。
- 卡片进入时只做 `opacity + translateX(18px)`。
- 路径节点有非常轻的进度线动画。
- hover 暂停。
- `prefers-reduced-motion: reduce` 关闭自动动画。

不做：

- 不做上下摇晃。
- 不做大面积 bokeh/orb。
- 不做过强玻璃拟态。
- 不做真实后台截图堆叠。

## 组件结构建议

`LandingPage.tsx` 中建议拆为本地小组件，不急着抽到全局：

```txt
LandingPage
  LandingHero
    LandingHeroCopy
    LandingBrandMockup
      BrandMockupSlide
      BrandPathNode
      BrandMetricCard
```

原因：

- 这些组件强依赖首页语境，暂不适合进入 `src/components/ui`。
- 稳定后可把 `BrandPathNode` 抽为业务 pattern。

建议数据结构：

```ts
type HeroMockupSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string; tone?: 'primary' | 'success' | 'warning' }>;
  nodes: Array<{ label: string; caption: string; state: 'done' | 'active' | 'pending' }>;
  alert?: { title: string; caption: string; tone: 'warning' | 'success' };
};
```

避免：

- 不把 slide 内容写散在 JSX 多层 map 中。
- 不在 CSS 里依赖具体中文文本长度。

## 色彩建议

沿用现有 token：

- `--color-primary: #123e66`
- `--color-primary-hover: #0b2d4d`
- `--color-accent: #d6a84f`
- `--color-success: #2f6b57`
- `--color-bg: #f4f0e7`

新增或局部使用：

- Hero 背景蓝：`#4f8fd8`
- Hero 背景青绿：`#80d4c8`
- 画布阴影：深蓝 10%-14% 透明度
- mockup 浅底：`rgba(255, 255, 255, 0.82)`

约束：

- 金色只做强调，不做主背景。
- 蓝色只做权威和 CTA，不铺满整页。
- 右侧 mockup 可以更鲜明，左侧保持可读性。

## Token 映射

| 用途 | 使用 token | 说明 |
| --- | --- | --- |
| 主标题 | `--color-text-strong` | 深蓝，不用纯黑。 |
| 主 CTA | `--color-primary` / `--color-primary-hover` | 保持品牌权威感。 |
| CTA 强调线 | `--color-accent` | 只做边线或 hover。 |
| 完成状态 | `--color-success` / `--color-success-soft` | 路径完成节点。 |
| 风险提示 | `--color-warning` / `--color-warning-soft` | mockup 风险浮层。 |
| 白色画布 | `--color-surface` | 中央大容器。 |
| 页面背景 | 可局部新增 hero gradient | 不修改全站 `--color-bg`。 |
| 内部卡片圆角 | `--radius-panel` / `--radius-md` | 避免过度圆润。 |
| 大画布圆角 | `--radius-2xl` 或局部值 | 只用于 hero 外层。 |
| 卡片阴影 | `--shadow-md` / `--shadow-lg` | 控制透明度，避免厚重。 |
| 动画 | `--duration-slow` / `--ease-out` | 轮播和卡片进入。 |

如需新增局部变量，建议只放在 `.landing-brand-hero` 作用域：

```css
.landing-brand-hero {
  --hero-blue: #4f8fd8;
  --hero-teal: #80d4c8;
  --hero-frame-shadow: rgba(11, 45, 77, 0.12);
}
```

不要新增全局 token，除非后续多个页面复用。

## 字体建议

当前项目主要使用 Plus Jakarta Sans / 中文系统字体。

方案 C 不强制引入新字体，避免加载和版权问题。

标题处理：

- 中文标题用现有 display 栈。
- 字重 700-800。
- 字距保持 0，避免中文断裂。
- 行高 0.98-1.06。
- 不用负字距。

如果后续要增强 editorial 感：

- 英文小标签可用当前 `Plus Jakarta Sans`。
- 不建议为了首屏引入衬线字体，中文适配成本高。

## 视觉规格

### 标题

Desktop：

- 字号：`clamp(46px, 6vw, 76px)`
- 字重：700 或 800
- 行高：0.98-1.05
- 字距：0
- 最大宽度：8-10 个中文字符

Mobile：

- 字号：36-42px
- 行高：1.06
- 第一行保持完整，不任意断字

### 正文

- 字号：15-17px
- 行高：1.7-1.85
- 最大宽度：42-48ch
- 颜色：`--color-muted`

### CTA

- 主按钮高度：44-48px
- 次按钮高度：44-48px
- 圆角：`--radius-md` 或 pill，二选一。若主按钮 pill，其他按钮也应一致。

### Mockup

- 右侧大 mockup 区域比例：约 1:0.82。
- 中央事项卡宽度：mockup 区域 58%-68%。
- 浮层不超过 3 个，避免杂乱。
- 路径节点最多展示 5 个。

## Figma 对齐方式

当前 Figma 插件状态：

- 已认证。
- 当前 seat 为 View。
- 可用于读取设计上下文。
- 若要写入 Figma 文件，需要确认文件权限。

后续可做：

1. 用户提供 Figma 文件 URL。
2. 读取 design context 或搜索文件内 design system。
3. 将本方案拆为 Figma frame：
   - Desktop hero
   - Tablet hero
   - Mobile hero
   - Product mockup component
   - Path node component
4. 再同步到 React/CSS。

Figma 文件结构建议新增：

```txt
Page: 06 Landing Brand Hero
  Frame: Desktop / Hero C
  Frame: Tablet / Hero C
  Frame: Mobile / Hero C
  Component: Brand Mockup Card
  Component: Path Node
  Component: Hero Metric
  Notes: Reference / Do Not Copy
```

Figma 变量对齐：

- Brand color 直接映射 Phase 03。
- Hero 局部 gradient 作为 style，不进入全局变量。
- Motion 在 Figma 中只记录节奏，不强求与 CSS 完全一致。

## 实施拆分

### Step 1 - 方案确认

- 确认标题文案。
- 确认首屏整体风格。
- 确认右侧 mockup 信息层级。
- 确认是否需要接入真实 Figma 文件。

### Step 2 - LandingPage JSX

涉及文件：

- `src/pages/LandingPage.tsx`

改动：

- 重构 hero 左侧文案结构。
- 将右侧 ProductPreview 改成品牌 mockup。
- 保留 CTA、导航链接、数据加载逻辑。
- 保留当前 `fetchDemoOverview` / `fetchDemoRuntimeStatus` 加载逻辑。
- 保留 `isAuthed()` 对入口地址的判断。

### Step 3 - Hero 样式

涉及文件：

- `src/styles/layouts.css`
- `src/styles/polish.css`

改动：

- 改外层大画布。
- 改标题层级。
- 改 mockup 背景、卡片、节点。
- 去除旧浮动感。
- 尽量新增 `landing-brand-*` 命名，避免继续污染 legacy class。
- 不在 `ui.css` 中写页面专属样式。

### Step 4 - 响应式

断点：

- Desktop：左右双栏。
- Tablet：上下结构，mockup 缩小。
- Mobile：标题优先，mockup 精简为单卡。

移动端取舍：

- 可以隐藏中间导航。
- 可以隐藏部分 mockup 浮层。
- 不隐藏主 CTA。
- 场景标签最多两行，超过换行。

### Step 5 - 验证

必须执行：

- `npm run lint`
- `npm run build`

建议增加：

- 首页桌面截图。
- 首页移动截图。
- hover 暂停轮播验证。
- reduced motion 验证。

## CSS 边界

推荐新增命名：

```txt
landing-brand-frame
landing-brand-nav
landing-brand-hero
landing-brand-copy
landing-brand-title
landing-brand-actions
landing-brand-tags
landing-brand-mockup
landing-brand-slide
landing-brand-card
landing-brand-path
landing-brand-node
landing-brand-metric
```

需要逐步替换或停止扩展：

```txt
landing-hero-showcase
landing-preview-card
landing-preview-dag
landing-preview-mini
```

说明：

- 旧 class 可以暂时保留，避免影响其他 section。
- 新 hero 应尽量用新 class，减少 `layouts.css` 中旧样式互相覆盖。
- 若必须修改 `polish.css`，只做覆盖移除，不继续堆补丁。

## 风险与处理

| 风险 | 处理 |
| --- | --- |
| 首屏变得过营销，不像法律产品 | 保留路径、依据、风险、归档等业务词。 |
| Logo 融入过度，显得装饰化 | 背景暗纹低透明，主要识别仍在导航和 mockup。 |
| 右侧 mockup 太复杂 | 限制 3 个浮层、最多 5 个节点。 |
| 移动端标题断字 | 显式拆行 + `white-space` + 响应式字号。 |
| CSS 继续膨胀 | 使用 `landing-brand-*` 新命名，后续再删除旧 hero 样式。 |
| Figma 与代码脱节 | 文档先定义 frame/component/token，再施工。 |

## 验收标准

- Logo 仍是首屏识别核心。
- 首屏不再像通用模板。
- 右侧 mockup 一眼能看出“法律事项办理链路”。
- 左侧标题短、稳、可读。
- CTA 清晰。
- 移动端不出现标题断字。
- 不影响登录、工作台、结果页和后台页面。

## 最终建议

推荐采用标题：

```text
让法律事项
沿路径办理。
```

推荐右侧主卡标题：

```text
LexHub Matter Path
服务合同审查
```

推荐施工方式：

1. 先用新 class 做一个完整 hero。
2. 保留旧 section 下方内容不动。
3. lint/build 通过后再做截图验收。
4. 若视觉方向确认，再清理旧 hero 相关 class。
