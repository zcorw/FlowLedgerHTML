# Yarn/依赖环境重置与固定版本操作记录

日期：2026-01-22

## 执行内容
1. 清理 npm 缓存：`npm cache clean --force`
2. 删除 npm lock：删除 `package-lock.json`
3. 删除旧依赖目录：删除 `node_modules`
4. 启用 Corepack：`corepack enable`
5. 安装/切换到 Yarn 4：`yarn set version stable`
6. 配置 Yarn 使用 node-modules：创建 `/.yarnrc.yml`，内容：
   - `nodeLinker: node-modules`
7. 安装依赖：`yarn install`
8. 固定 Yarn 版本为 4.12.0 并生成 yarnPath：
   - `yarn set version 4.12.0 --yarn-path`
   - 生成 `/.yarn/releases/yarn-4.12.0.cjs`
   - 更新 `/.yarnrc.yml` 增加 `yarnPath: .yarn/releases/yarn-4.12.0.cjs`

## 结果与说明
- npm lock 已移除，改用 Yarn 4
- Yarn 使用 `node-modules` linker
- Yarn 版本已固定为 4.12.0
- 安装完成时存在一个 peer 依赖提示：`recharts` 需要 `react-is`（可通过 `yarn explain peer-requirements pc456b4` 查看详情）

## 相关文件
- `/.yarnrc.yml`
- `/.yarn/releases/yarn-4.12.0.cjs`
- `yarn.lock`
