#!/bin/bash

# BMT Platform SDK 版本管理脚本
# 用于批量更新包版本或单独更新某个包

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_help() {
    echo "BMT Platform SDK 版本管理脚本"
    echo ""
    echo "用法:"
    echo "  ./scripts/version-bump.sh [type]           # 更新所有包版本"
    echo "  ./scripts/version-bump.sh [package] [type] # 更新指定包版本"
    echo ""
    echo "版本类型:"
    echo "  patch  - 补丁版本 (1.0.0 -> 1.0.1)"
    echo "  minor  - 次要版本 (1.0.0 -> 1.1.0)"
    echo "  major  - 主要版本 (1.0.0 -> 2.0.0)"
    echo ""
    echo "示例:"
    echo "  ./scripts/version-bump.sh patch                    # 所有包增加patch版本"
    echo "  ./scripts/version-bump.sh @platform/sdk-core minor # sdk-core增加minor版本"
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

PACKAGES=(
    "packages/sdk-core"
    "packages/sdk-http"
    "packages/sdk-perf"
    "packages/sdk-telemetry"
    "packages/sdk-realtime"
    "packages/adapters"
)

# 更新单个包版本
update_package_version() {
    local package_dir=$1
    local version_type=$2
    local package_name=$(cat "$package_dir/package.json" | grep '"name"' | cut -d'"' -f4)
    
    log "更新 $package_name 版本 ($version_type)..."
    
    cd "$package_dir"
    npm version "$version_type" --no-git-tag-version
    cd - > /dev/null
    
    local new_version=$(cat "$package_dir/package.json" | grep '"version"' | cut -d'"' -f4)
    success "$package_name 版本已更新到 $new_version"
}

# 根据包名获取包目录
get_package_dir() {
    local package_name=$1
    case $package_name in
        "@platform/sdk-core") echo "packages/sdk-core" ;;
        "@platform/sdk-http") echo "packages/sdk-http" ;;
        "@platform/sdk-perf") echo "packages/sdk-perf" ;;
        "@platform/sdk-telemetry") echo "packages/sdk-telemetry" ;;
        "@platform/sdk-realtime") echo "packages/sdk-realtime" ;;
        "@platform/adapters") echo "packages/adapters" ;;
        *) echo "" ;;
    esac
}

if [ $# -eq 1 ]; then
    # 更新所有包
    VERSION_TYPE=$1
    log "更新所有包版本类型: $VERSION_TYPE"
    
    for package_dir in "${PACKAGES[@]}"; do
        update_package_version "$package_dir" "$VERSION_TYPE"
    done
    
elif [ $# -eq 2 ]; then
    # 更新指定包
    PACKAGE_NAME=$1
    VERSION_TYPE=$2
    PACKAGE_DIR=$(get_package_dir "$PACKAGE_NAME")
    
    if [ -z "$PACKAGE_DIR" ]; then
        echo "错误: 未知的包名 $PACKAGE_NAME"
        exit 1
    fi
    
    update_package_version "$PACKAGE_DIR" "$VERSION_TYPE"
    
else
    show_help
    exit 1
fi

success "版本更新完成!"