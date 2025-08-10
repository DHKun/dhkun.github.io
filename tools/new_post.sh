#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
用法:
  bash tools/new_post.sh "标题" [--cats "分类1,分类2"] [--tags "标签1,标签2"] [--repo "https://..."]

说明:
  - 自动在 _posts/ 下创建: YYYY-MM-DD-<标题>.md
  - Front Matter 自动填写当前时间(date)，其余可选项按传参填充
  - 提示: 对于 _posts/ 中文件, Jekyll 已会从文件名推断日期, 也可以不写 date 字段
  - 时区: 自动读取 _config.yml 的 timezone（若无则默认 Asia/Shanghai）
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

title="$1"; shift || true
cats=""; tags=""; repo=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cats)
      cats="${2:-}"; shift 2;;
    --tags)
      tags="${2:-}"; shift 2;;
    --repo)
      repo="${2:-}"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "未知参数: $1"; usage; exit 1;;
  esac
done

# 读取 _config.yml 的 timezone；没有则默认 Asia/Shanghai
config_tz=""
if [[ -f _config.yml ]]; then
  config_tz=$(awk -F': ' '/^timezone:/ {print $2; exit}' _config.yml 2>/dev/null || true)
fi
tz="${config_tz:-${TZ:-Asia/Shanghai}}"

# 兼容 macOS (gdate) 与 Linux (date)
date_cmd=date
command -v gdate >/dev/null 2>&1 && date_cmd=gdate

date_part=$(TZ="$tz" $date_cmd +"%Y-%m-%d")
datetime=$(TZ="$tz" $date_cmd +"%Y-%m-%d %H:%M %z")

# 生成 slug：优先用 python3（支持 Unicode）；无 python3 时降级 sed（ASCII 安全）
if command -v python3 >/dev/null 2>&1; then
  slug=$(python3 - "$title" <<'PY'
import sys, re
s = sys.argv[1]
s = re.sub(r"\s+", "-", s.strip())
s = re.sub(r"[^\w\.-]", "-", s, flags=re.UNICODE)
s = re.sub(r"-+", "-", s).strip('-')
print(s.lower())
PY
)
else
  slug=$(echo "$title" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[[:space:]]+/-/g; s/[^[:alnum:]._-]+/-/g; s/-+/-/g; s/^-|-$//g')
fi

mkdir -p _posts
filepath="_posts/${date_part}-${slug}.md"
idx=1
while [[ -e "$filepath" ]]; do
  filepath="_posts/${date_part}-${slug}-${idx}.md"; idx=$((idx+1))
done

# 处理 YAML 行
cats_line="[]"; [[ -n "$cats" ]] && cats_line="[$cats]"
tags_line="[]"; [[ -n "$tags" ]] && tags_line="[$tags]"
repo_line="";  [[ -n "$repo" ]] && repo_line="repo: $repo\n"

cat > "$filepath" <<EOF
---
title: $title
date: $datetime
${repo_line}categories: $cats_line
tags: $tags_line
---

EOF

echo "已创建: $filepath"
echo "提示: 如不想维护 date，可直接删掉该字段，Jekyll 会使用文件名中的日期。"


