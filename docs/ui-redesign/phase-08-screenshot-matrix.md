# Phase 08 - 截图回归矩阵

本文件定义 UI 改版后的截图留档范围。建议每次大阶段完成后更新截图，形成回归基线。

## 截图目录

```txt
docs/ui-redesign/screenshots/
  phase-08/
    desktop-1440/
    desktop-1280/
    tablet-768/
    mobile-390/
```

## 断点

| 名称 | 尺寸 | 用途 |
| --- | --- | --- |
| Desktop Wide | 1440 x 1024 | 主验收视口 |
| Desktop | 1280 x 900 | 常规桌面 |
| Tablet Landscape | 1024 x 768 | 小桌面/横屏平板 |
| Tablet Portrait | 768 x 1024 | 竖屏平板 |
| Mobile | 390 x 844 | 手机主验收视口 |

## 用户端截图

| 页面 | 1440 | 1280 | 1024 | 768 | 390 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| Login | 必须 | 必须 | 可选 | 必须 | 必须 | default/error/loading |
| Workspace Intake | 必须 | 必须 | 必须 | 必须 | 必须 | empty/ready/validation |
| Workspace Run | 必须 | 必须 | 必须 | 可选 | 必须 | running/completed/failed |
| Workspace Result | 必须 | 必须 | 必须 | 可选 | 必须 | empty/ready/high-risk |
| Review | 必须 | 必须 | 可选 | 可选 | 必须 | queue/selected/empty |
| Materials | 必须 | 必须 | 可选 | 可选 | 必须 | list/empty/exporting |
| Evidence | 必须 | 必须 | 可选 | 可选 | 必须 | default/warning |
| Reports | 必须 | 可选 | 可选 | 可选 | 可选 | list/empty |
| Replay | 必须 | 可选 | 可选 | 可选 | 可选 | timeline/empty |

## 管理端截图

| 页面 | 1440 | 1280 | 1024 | 768 | 390 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| Admin Overview | 必须 | 必须 | 必须 | 可选 | 必须 | ready/warning/error |
| Admin Connections | 必须 | 必须 | 必须 | 可选 | 必须 | overview/models/apis |
| Admin Knowledge | 必须 | 必须 | 必须 | 可选 | 必须 | browse/import/empty/error |
| Admin Policies | 必须 | 必须 | 可选 | 可选 | 必须 | routing/review/saved |
| Admin Users | 必须 | 必须 | 可选 | 可选 | 必须 | table/reset-confirm |

## 截图命名

建议：

```txt
workspace-intake-1440-ready.png
workspace-intake-390-validation.png
admin-knowledge-1440-import-error.png
admin-overview-1280-warning.png
```

## 截图检查点

- 页面首屏是否表达主任务。
- 主操作是否清楚。
- 文本是否溢出。
- 是否有横向滚动。
- 状态是否可读。
- 颜色是否符合语义。
- 移动端是否遮挡内容。
- 弹窗/抽屉是否在视口内。

