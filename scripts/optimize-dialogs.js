/**
 * 批量优化对话框脚本
 * 将所有页面的Dialog替换为优化的FormDialog组件
 */

const fs = require('fs');
const path = require('path');

const pagesToOptimize = [
  'software-copyrights',
  'projects',
  'resources',
  'competitions',
  'conferences',
  'cooperations'
];

const basePath = path.join(__dirname, '../front/app/(dashboard)');

function optimizePage(pageName) {
  const filePath = path.join(basePath, pageName, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. 添加FormDialog导入
  if (!content.includes('import { FormDialog }')) {
    content = content.replace(
      /import \{([^}]+)\} from "@\/components\/ui\/dialog"/,
      `import {$1} from "@/components/ui/dialog"\nimport { FormDialog } from "@/components/ui/form-dialog"`
    );
  }

  // 2. 替换新增对话框
  content = content.replace(
    /<Dialog open=\{createOpen\} onOpenChange=\{[^}]+\}>\s*<DialogContent className="[^"]*">\s*<DialogHeader>\s*<DialogTitle>([^<]+)<\/DialogTitle>\s*<\/DialogHeader>/g,
    (match, title) => {
      return `<FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="${title}"
        description="填写基本信息，创建新的记录"
        onSubmit={handleCreate${pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}}
        submitText="创建"
        loading={saving}
        maxWidth="2xl"
      >`;
    }
  );

  // 3. 替换编辑对话框
  content = content.replace(
    /<Dialog open=\{editOpen\} onOpenChange=\{[^}]+\}>\s*<DialogContent className="[^"]*">\s*<DialogHeader>\s*<DialogTitle>([^<]+)<\/DialogTitle>\s*<\/DialogHeader>/g,
    (match, title) => {
      return `<FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="${title}"
        description="修改信息，更新记录内容"
        onSubmit={handleSaveEdit}
        submitText="保存"
        loading={saving}
        maxWidth="2xl"
      >`;
    }
  );

  // 4. 替换表单容器
  content = content.replace(
    /<div className="space-y-3 text-sm">/g,
    '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">'
  );

  // 5. 优化错误提示
  content = content.replace(
    /\{formError && \(\s*<p className="text-xs text-red-500">\{formError\}<\/p>\s*\)\}/g,
    `{formError && (
          <div className="rounded-md bg-red-50 p-3 mb-4">
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}`
  );

  // 6. 移除DialogFooter
  content = content.replace(
    /<DialogFooter>[\s\S]*?<\/DialogFooter>\s*<\/DialogContent>\s*<\/Dialog>/g,
    '</div>\n      </FormDialog>'
  );

  // 7. 优化Label样式
  content = content.replace(
    /<Label htmlFor="([^"]+)">([^<]+)<\/Label>/g,
    '<Label htmlFor="$1" className="text-sm font-medium">$2</Label>'
  );

  // 8. 优化Input高度
  content = content.replace(
    /<Input\s+id="([^"]+)"/g,
    '<Input id="$1" className="h-9"'
  );

  // 9. 优化Textarea
  content = content.replace(
    /<Textarea\s+id="([^"]+)"/g,
    '<Textarea id="$1" className="resize-none"'
  );

  // 10. 优化Select高度
  content = content.replace(
    /<SelectTrigger id="([^"]+)" className="h-8 text-xs"/g,
    '<SelectTrigger id="$1" className="h-9"'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 已优化: ${pageName}`);
}

console.log('🚀 开始批量优化对话框...\n');

pagesToOptimize.forEach(page => {
  try {
    optimizePage(page);
  } catch (error) {
    console.error(`❌ 优化失败 ${page}:`, error.message);
  }
});

console.log('\n✨ 批量优化完成！');
console.log('\n📝 请手动检查以下内容：');
console.log('  1. FormDialog的onSubmit回调函数名是否正确');
console.log('  2. maxWidth是否合适（根据表单复杂度调整）');
console.log('  3. description描述是否准确');
console.log('  4. 字段的md:col-span-2布局是否合理');
