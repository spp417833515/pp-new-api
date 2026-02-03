package controller

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

// 版本缓存，避免频繁请求 Docker Hub API
var (
	versionCache      string
	versionCacheTime  time.Time
	versionCacheMutex sync.RWMutex
	versionCacheTTL   = 5 * time.Minute
)

// CheckUpdate 检查是否有新版本
func CheckUpdate(c *gin.Context) {
	if !common.UpdateCheckEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"current_version": common.Version,
				"latest_version":  common.Version,
				"has_update":      false,
				"message":         "更新检查已禁用",
			},
		})
		return
	}

	latestVersion, err := getLatestVersion()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": fmt.Sprintf("检查更新失败: %v", err),
		})
		return
	}

	hasUpdate := compareVersions(common.Version, latestVersion) < 0

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"current_version": common.Version,
			"latest_version":  latestVersion,
			"has_update":      hasUpdate,
			"image":           common.DockerImage,
			"update_command":  fmt.Sprintf("docker pull %s:latest", common.DockerImage),
		},
	})
}

// ExecuteUpdate 执行热更新
func ExecuteUpdate(c *gin.Context) {
	if !common.UpdateCheckEnabled {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "更新功能已禁用",
		})
		return
	}

	// 检查是否在 Docker 环境中
	if !isRunningInDocker() {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "热更新仅支持 Docker 环境",
		})
		return
	}

	// 获取最新版本
	latestVersion, err := getLatestVersion()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": fmt.Sprintf("检查更新失败: %v", err),
		})
		return
	}

	// 检查是否需要更新
	if compareVersions(common.Version, latestVersion) >= 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "当前已是最新版本",
		})
		return
	}

	// 执行更新流程
	go func() {
		err := performUpdate()
		if err != nil {
			common.SysError(fmt.Sprintf("更新失败: %v", err))
			return
		}
		// 延迟退出，让响应先返回
		time.Sleep(2 * time.Second)
		common.SysLog("更新完成，正在重启...")
		os.Exit(0)
	}()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("正在更新到 %s，服务将在 2 秒后重启", latestVersion),
	})
}

// RollbackUpdate 回退到上一版本
func RollbackUpdate(c *gin.Context) {
	binPath := getBinaryPath()
	backupPath := binPath + ".bak"

	// 检查备份是否存在
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "没有可用的备份版本",
		})
		return
	}

	go func() {
		// 执行回退
		err := atomicReplace(backupPath, binPath)
		if err != nil {
			common.SysError(fmt.Sprintf("回退失败: %v", err))
			return
		}

		// 回退前端文件
		webPath := getWebPath()
		webBackupPath := webPath + ".bak"
		if _, err := os.Stat(webBackupPath); err == nil {
			os.RemoveAll(webPath)
			os.Rename(webBackupPath, webPath)
		}

		time.Sleep(2 * time.Second)
		common.SysLog("回退完成，正在重启...")
		os.Exit(0)
	}()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "正在回退到上一版本，服务将在 2 秒后重启",
	})
}

// getLatestVersion 从 Docker Hub API 获取最新版本（带缓存）
func getLatestVersion() (string, error) {
	// 检查缓存
	versionCacheMutex.RLock()
	if versionCache != "" && time.Since(versionCacheTime) < versionCacheTTL {
		cached := versionCache
		versionCacheMutex.RUnlock()
		return cached, nil
	}
	versionCacheMutex.RUnlock()

	// 主方案：从 Docker Hub API 获取
	version, err := getLatestVersionFromDockerHubAPI()
	if err == nil && version != "" {
		// 更新缓存
		versionCacheMutex.Lock()
		versionCache = version
		versionCacheTime = time.Now()
		versionCacheMutex.Unlock()
		return version, nil
	}

	// Fallback：使用原有 docker pull 方案
	common.SysLog(fmt.Sprintf("Docker Hub API 获取版本失败，使用 fallback: %v", err))
	return getLatestVersionFromDocker()
}

// getLatestVersionFromDockerHubAPI 从 Docker Hub API 获取最新版本
func getLatestVersionFromDockerHubAPI() (string, error) {
	// 解析镜像名称 (格式: user/repo 或 repo)
	imageParts := strings.Split(common.DockerImage, "/")
	var apiURL string
	if len(imageParts) == 2 {
		// user/repo 格式
		apiURL = fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/%s/tags?page_size=100&ordering=last_updated", imageParts[0], imageParts[1])
	} else {
		// 官方镜像格式
		apiURL = fmt.Sprintf("https://hub.docker.com/v2/repositories/library/%s/tags?page_size=100&ordering=last_updated", common.DockerImage)
	}

	// 发送 HTTP 请求
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return "", fmt.Errorf("请求 Docker Hub API 失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Docker Hub API 返回错误状态码: %d", resp.StatusCode)
	}

	// 解析响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %v", err)
	}

	var result struct {
		Results []struct {
			Name string `json:"name"`
		} `json:"results"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("解析 JSON 失败: %v", err)
	}

	// 筛选版本号格式的 tag (v*.*.* 或 *.*.*)
	versionRegex := regexp.MustCompile(`^v?\d+\.\d+\.\d+$`)
	var versions []string
	for _, tag := range result.Results {
		if versionRegex.MatchString(tag.Name) {
			versions = append(versions, tag.Name)
		}
	}

	if len(versions) == 0 {
		return "", fmt.Errorf("未找到有效的版本号 tag")
	}

	// 排序，取最新版本
	sort.Slice(versions, func(i, j int) bool {
		return compareVersions(versions[i], versions[j]) > 0
	})

	return versions[0], nil
}

// getLatestVersionFromDocker 使用 docker pull 获取最新版本（fallback）
func getLatestVersionFromDocker() (string, error) {
	image := common.DockerImage + ":latest"

	// 先拉取最新镜像
	pullCmd := exec.Command("docker", "pull", "--quiet", image)
	if err := pullCmd.Run(); err != nil {
		return "", fmt.Errorf("拉取镜像失败: %v", err)
	}

	// 获取镜像中的版本号
	versionCmd := exec.Command("docker", "run", "--rm", image, "--version")
	output, err := versionCmd.Output()
	if err != nil {
		// 如果 --version 不支持，尝试读取 VERSION 文件
		versionCmd = exec.Command("docker", "run", "--rm", "--entrypoint", "cat", image, "/app/VERSION")
		output, err = versionCmd.Output()
		if err != nil {
			return "", fmt.Errorf("获取版本号失败: %v", err)
		}
	}

	version := strings.TrimSpace(string(output))
	if version == "" {
		return "", fmt.Errorf("版本号为空")
	}

	return version, nil
}

// performUpdate 执行更新操作
func performUpdate() error {
	image := common.DockerImage + ":latest"
	tempContainer := "pp-new-api-update-temp"

	// 0. 拉取最新镜像（关键步骤：确保获取最新版本而非本地缓存）
	common.SysLog(fmt.Sprintf("正在拉取最新镜像: %s", image))
	pullCmd := exec.Command("docker", "pull", image)
	if output, err := pullCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("拉取最新镜像失败: %v, output: %s", err, string(output))
	}
	common.SysLog("镜像拉取完成")

	// 1. 创建临时容器
	createCmd := exec.Command("docker", "create", "--name", tempContainer, image)
	if err := createCmd.Run(); err != nil {
		return fmt.Errorf("创建临时容器失败: %v", err)
	}
	defer exec.Command("docker", "rm", "-f", tempContainer).Run()

	// 2. 提取新二进制文件
	binPath := getBinaryPath()
	newBinPath := binPath + ".new"
	cpBinCmd := exec.Command("docker", "cp", tempContainer+":/app/bin/new-api", newBinPath)
	if err := cpBinCmd.Run(); err != nil {
		return fmt.Errorf("提取二进制文件失败: %v", err)
	}

	// 3. 提取新前端文件
	webPath := getWebPath()
	newWebPath := webPath + ".new"
	cpWebCmd := exec.Command("docker", "cp", tempContainer+":/app/public", newWebPath)
	if err := cpWebCmd.Run(); err != nil {
		// 前端可能在不同路径，尝试其他路径
		cpWebCmd = exec.Command("docker", "cp", tempContainer+":/app/web/build", newWebPath)
		cpWebCmd.Run() // 忽略错误，前端更新是可选的
	}

	// 4. 备份当前版本
	backupBinPath := binPath + ".bak"
	if _, err := os.Stat(binPath); err == nil {
		os.Remove(backupBinPath)
		if err := os.Rename(binPath, backupBinPath); err != nil {
			return fmt.Errorf("备份二进制文件失败: %v", err)
		}
	}

	backupWebPath := webPath + ".bak"
	if _, err := os.Stat(webPath); err == nil {
		os.RemoveAll(backupWebPath)
		os.Rename(webPath, backupWebPath)
	}

	// 5. 替换新版本
	if err := os.Rename(newBinPath, binPath); err != nil {
		// 回退
		os.Rename(backupBinPath, binPath)
		return fmt.Errorf("替换二进制文件失败: %v", err)
	}
	os.Chmod(binPath, 0755)

	if _, err := os.Stat(newWebPath); err == nil {
		os.Rename(newWebPath, webPath)
	}

	return nil
}

// compareVersions 比较版本号，返回 -1, 0, 1
func compareVersions(v1, v2 string) int {
	// 移除 v 前缀
	v1 = strings.TrimPrefix(v1, "v")
	v2 = strings.TrimPrefix(v2, "v")

	// 解析版本号
	re := regexp.MustCompile(`(\d+)\.?(\d*)\.?(\d*)`)

	m1 := re.FindStringSubmatch(v1)
	m2 := re.FindStringSubmatch(v2)

	if m1 == nil || m2 == nil {
		return strings.Compare(v1, v2)
	}

	for i := 1; i <= 3; i++ {
		n1 := parseVersionPart(m1, i)
		n2 := parseVersionPart(m2, i)
		if n1 < n2 {
			return -1
		}
		if n1 > n2 {
			return 1
		}
	}

	return 0
}

func parseVersionPart(match []string, index int) int {
	if index >= len(match) || match[index] == "" {
		return 0
	}
	var n int
	fmt.Sscanf(match[index], "%d", &n)
	return n
}

// isRunningInDocker 检查是否在 Docker 容器中运行
func isRunningInDocker() bool {
	// 检查 /.dockerenv 文件
	if _, err := os.Stat("/.dockerenv"); err == nil {
		return true
	}
	// 检查 cgroup
	data, err := os.ReadFile("/proc/1/cgroup")
	if err == nil && strings.Contains(string(data), "docker") {
		return true
	}
	return false
}

// getBinaryPath 获取当前二进制文件路径
func getBinaryPath() string {
	exe, err := os.Executable()
	if err != nil {
		return "/app/bin/new-api"
	}
	return exe
}

// getWebPath 获取前端文件路径
func getWebPath() string {
	exe := getBinaryPath()
	dir := filepath.Dir(exe)
	return filepath.Join(dir, "public")
}

// atomicReplace 原子替换文件
func atomicReplace(src, dst string) error {
	return os.Rename(src, dst)
}
