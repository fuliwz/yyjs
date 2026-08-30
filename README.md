# yyxvt

## 广告与友情链接

项目已集成独立的非成人广告位和友情链接组件，配置文件位于 `public/`，无需修改 Vue 组件代码即可更新内容。

### 广告

编辑 `public/ads.json`：

```json
{
  "enabled": true,
  "slots": {
    "top": [
      {
        "id": "ad-1",
        "title": "示例推广",
        "description": "这里填写广告说明",
        "image": "/ads/example.jpg",
        "url": "https://example.com/"
      }
    ],
    "bottom": []
  }
}
```

支持 `top` 和 `bottom` 两个广告位。广告链接会使用新窗口打开，并自动添加 `noopener noreferrer sponsored`。

### 友情链接

编辑 `public/links.json`：

```json
{
  "enabled": true,
  "links": [
    {
      "name": "示例网站",
      "url": "https://example.com/"
    }
  ]
}
```

友情链接只接受 `http`/`https` 地址，并统一使用新窗口打开及 `noopener noreferrer`。

### 部署

修改 JSON 后重新执行：

```bash
npm install
npm run build
```

Cloudflare Pages 等静态部署环境直接发布 `dist` 即可。
