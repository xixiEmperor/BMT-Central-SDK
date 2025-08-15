#!/bin/bash

# BMT Platform SDK 发布脚本
# 用法: ./scripts/publish.sh [package-name] [version-type]
# 示例: ./scripts/publish.sh @platform/sdk-core patch

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 检查是否在正确的目录
if [ ! -f "pnpm-workspace.yaml" ]; then
    error "请在项目根目录运行此脚本"
fi

# 获取参数
PACKAGE_NAME=$1
VERSION_TYPE=$2

# 显示帮助信息
show_help() {
    echo "BMT Platform SDK 发布脚本"
    echo ""
    echo "用法:"
    echo "  ./scripts/publish.sh                          # 发布所有包"
    echo "  ./scripts/publish.sh [package-name]           # 发布指定包"
    echo "  ./scripts/publish.sh [package-name] [version] # 发布指定包到指定版本"
    echo ""
    echo "示例:"
    echo "  ./scripts/publish.sh                          # 使用changeset发布所有包"
    echo "  ./scripts/publish.sh @platform/sdk-core       # 发布sdk-core包"
    echo "  ./scripts/publish.sh @platform/sdk-core patch # 发布sdk-core包并增加patch版本"
    echo ""
    echo "可用的包:"
    echo "  @platform/sdk-core"
    echo "  @platform/sdk-http"
    echo "  @platform/sdk-perf"
    echo "  @platform/sdk-telemetry"
    echo "  @platform/sdk-realtime"
    echo "  @platform/adapters"
    echo ""
    echo "版本类型: patch, minor, major"
}

# 如果请求帮助
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 检查npm登录状态
check_npm_auth() {
    log "检查npm登录状态..."
    if ! npm whoami > /dev/null 2>&1; then
        error "请先登录npm: npm login"
    else
        success "npm已登录，用户: $(npm whoami)"
    fi
}

# 检查工作目录是否干净
check_git_status() {
    log "检查git状态..."
    if [ -n "$(git status --porcelain)" ]; then
        warning "工作目录有未提交的更改，建议先提交"
        read -p "是否继续? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        success "工作目录干净"
    fi
}

# 运行测试和检查
run_checks() {
    log "运行类型检查..."
    pnpm -r typecheck || error "类型检查失败"
    
    log "运行代码规范检查..."
    pnpm -r lint || error "代码规范检查失败"
    
    success "所有检查通过"
}

# 构建所有包
build_packages() {
    log "构建所有包..."
    pnpm -r build || error "构建失败"
    success "构建完成"
}

# 发布所有包 (使用changeset)
publish_all() {
    log "使用changeset发布所有包..."
    
    # 检查是否有changeset文件
    if [ -z "$(ls .changeset/*.md 2>/dev/null)" ]; then
        warning "没有找到changeset文件"
        echo "请先运行 'pnpm changeset' 来创建变更记录"
        read -p "是否现在创建changeset? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pnpm changeset
        else
            exit 1
        fi
    fi
    
    # 更新版本
    log "更新版本号..."
    pnpm changeset version
    
    # 构建
    build_packages
    
    # 发布
    log "发布到npm..."
    pnpm changeset publish
    
    success "发布完成!"
}

# 发布单个包
publish_single() {
    local package_name=$1
    local version_type=$2
    
    # 验证包名
    local package_dir=""
    case $package_name in
        "@platform/sdk-core")
            package_dir="packages/sdk-core"
            ;;
        "@platform/sdk-http")
            package_dir="packages/sdk-http"
            ;;
        "@platform/sdk-perf")
            package_dir="packages/sdk-perf"
            ;;
        "@platform/sdk-telemetry")
            package_dir="packages/sdk-telemetry"
            ;;
        "@platform/sdk-realtime")
            package_dir="packages/sdk-realtime"
            ;;
        "@platform/adapters")
            package_dir="packages/adapters"
            ;;
        *)
            error "未知的包名: $package_name"
            ;;
    esac
    
    if [ ! -d "$package_dir" ]; then
        error "包目录不存在: $package_dir"
    fi
    
    log "发布包: $package_name"
    
    # 如果指定了版本类型，先更新版本
    if [ -n "$version_type" ]; then
        log "更新版本 ($version_type)..."
        cd "$package_dir"
        npm version "$version_type" --no-git-tag-version
        cd - > /dev/null
    fi
    
    # 构建指定包
    log "构建包: $package_name..."
    pnpm --filter "$package_name" build || error "构建失败"
    
    # 发布
    log "发布到npm..."
    pnpm --filter "$package_name" publish --access public
    
    success "包 $package_name 发布完成!"
}

# 主逻辑
main() {
    log "开始发布流程..."
    
    # 检查前置条件
    check_npm_auth
    check_git_status
    run_checks
    
    if [ -z "$PACKAGE_NAME" ]; then
        # 发布所有包
        publish_all
    else
        # 发布单个包
        publish_single "$PACKAGE_NAME" "$VERSION_TYPE"
    fi
    
    success "🎉 发布流程完成!"
    log "建议运行 'git push --tags' 推送版本标签"
}

# 运行主函数
main