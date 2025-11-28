#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试Web服务
运行在8848端口，可在局域网访问
"""

from flask import Flask, jsonify, request, render_template
from datetime import datetime
import socket
import platform
import psutil
import os

app = Flask(__name__)

# 配置项：从环境变量读取
ALLOW_EXTERNAL_ACCESS = os.getenv('ALLOW_EXTERNAL_ACCESS', 'false').lower() == 'true'
SERVER_HOST = '0.0.0.0' if ALLOW_EXTERNAL_ACCESS else '127.0.0.1'
SERVER_PORT = int(os.getenv('SERVER_PORT', '8848'))

# HTML模板
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试Web服务 - 项目启动演示</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 800px;
            width: 100%;
            animation: fadeInUp 0.6s ease-out;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        h1 {
            color: #2d3748;
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .subtitle {
            color: #718096;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .info-card h3 {
            color: #4a5568;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .info-card .value {
            color: #2d3748;
            font-size: 18px;
            font-weight: 600;
            word-break: break-all;
        }
        
        .api-section {
            margin-top: 40px;
        }
        
        .api-section h2 {
            color: #2d3748;
            font-size: 1.8em;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .api-endpoints {
            display: grid;
            gap: 15px;
        }
        
        .endpoint {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease;
        }
        
        .endpoint:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
        }
        
        .endpoint-info {
            flex: 1;
        }
        
        .endpoint-method {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 10px;
        }
        
        .endpoint-path {
            color: #4a5568;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
        }
        
        .endpoint-desc {
            color: #718096;
            font-size: 13px;
            margin-top: 5px;
        }
        
        .test-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: transform 0.2s ease;
        }
        
        .test-btn:hover {
            transform: translateY(-1px);
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #718096;
            font-size: 14px;
        }
        
        .system-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .system-card {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .system-card h4 {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        
        .system-card .sys-value {
            font-size: 16px;
            font-weight: 600;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            
            h1 {
                font-size: 2em;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status-badge">🟢 服务运行中</div>
            <h1>🚀 测试Web服务</h1>
            <p class="subtitle">项目启动功能演示 - Flask API服务</p>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>服务状态</h3>
                <div class="value">{{ status }}</div>
            </div>
            <div class="info-card">
                <h3>服务器时间</h3>
                <div class="value">{{ timestamp }}</div>
            </div>
            <div class="info-card">
                <h3>本地访问</h3>
                <div class="value">localhost:{{ port }}</div>
            </div>
            <div class="info-card">
                <h3>网络访问</h3>
                <div class="value">{{ server_ip }}:{{ port }}</div>
            </div>
        </div>
        
        <div class="system-info">
            <div class="system-card">
                <h4>操作系统</h4>
                <div class="sys-value">{{ platform_info }}</div>
            </div>
            <div class="system-card">
                <h4>CPU使用率</h4>
                <div class="sys-value">{{ cpu_percent }}%</div>
            </div>
            <div class="system-card">
                <h4>内存使用</h4>
                <div class="sys-value">{{ memory_percent }}%</div>
            </div>
            <div class="system-card">
                <h4>进程ID</h4>
                <div class="sys-value">{{ process_id }}</div>
            </div>
        </div>
        
        <div class="api-section">
            <h2>📡 API接口</h2>
            <div class="api-endpoints">
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div>
                            <span class="endpoint-method">GET</span>
                            <span class="endpoint-path">/</span>
                        </div>
                        <div class="endpoint-desc">服务主页 - 显示服务信息和状态</div>
                    </div>
                    <button class="test-btn" onclick="window.location.reload()">刷新</button>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div>
                            <span class="endpoint-method">GET</span>
                            <span class="endpoint-path">/api/status</span>
                        </div>
                        <div class="endpoint-desc">健康检查接口 - 返回服务运行状态</div>
                    </div>
                    <button class="test-btn" onclick="testApi('/api/status')">测试</button>
                </div>
                
                <div class="endpoint">
                    <div class="endpoint-info">
                        <div>
                            <span class="endpoint-method">GET</span>
                            <span class="endpoint-path">/api/info</span>
                        </div>
                        <div class="endpoint-desc">服务信息接口 - 返回详细的服务配置信息</div>
                    </div>
                    <button class="test-btn" onclick="testApi('/api/info')">测试</button>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🎯 这是一个通过项目管理系统启动的测试Web服务</p>
            <p>✨ 展示了自动化项目启动和管理功能</p>
            <p style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
                启动时间: {{ start_time }} | 运行时长: {{ uptime }}
            </p>
        </div>
    </div>
    
    <script>
        function testApi(endpoint) {
            fetch(endpoint)
                .then(response => response.json())
                .then(data => {
                    alert('API响应:\\n\\n' + JSON.stringify(data, null, 2));
                })
                .catch(error => {
                    alert('API请求失败:\\n' + error.message);
                });
        }
        
        // 自动刷新时间
        setInterval(() => {
            const timeElements = document.querySelectorAll('.value');
            if (timeElements.length > 1) {
                timeElements[1].textContent = new Date().toLocaleString('zh-CN');
            }
        }, 1000);
    </script>
</body>
</html>
'''

@app.route('/')
def home():
    """美化的首页"""
    # 获取系统信息
    cpu_percent = round(psutil.cpu_percent(interval=0.1), 1)
    memory = psutil.virtual_memory()
    memory_percent = round(memory.percent, 1)
    
    # 计算运行时长（简单计算）
    import time
    uptime = "刚启动"
    
    # 使用安全的上下文变量，避免模板注入
    context = {
        'status': '正常运行',
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'server_ip': get_local_ip(),
        'port': SERVER_PORT,
        'platform_info': f"{platform.system()} {platform.release()}",
        'cpu_percent': cpu_percent,
        'memory_percent': memory_percent,
        'process_id': os.getpid(),
        'start_time': datetime.now().strftime('%H:%M:%S'),
        'uptime': uptime
    }
    
    # 使用render_template而不是render_template_string更安全
    # 但这里为了保持功能，我们使用过滤后的变量
    return render_template_string(HTML_TEMPLATE, **context)

@app.route('/api/status')
def status():
    """状态检查接口"""
    return jsonify({
        'service': 'test-web-service',
        'version': '1.0.0',
        'status': 'healthy',
        'uptime': 'running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/info')
def info():
    """服务信息"""
    return jsonify({
        'service_name': '测试Web服务',
        'description': '这是一个用于演示项目启动功能的测试服务',
        'endpoints': [
            {'path': '/', 'method': 'GET', 'description': '首页'},
            {'path': '/api/status', 'method': 'GET', 'description': '健康检查'},
            {'path': '/api/info', 'method': 'GET', 'description': '服务信息'}
        ],
        'network': {
            'host': SERVER_HOST,
            'port': SERVER_PORT,
            'local_access': f'http://localhost:{SERVER_PORT}',
            'network_access': f'http://{get_local_ip()}:{SERVER_PORT}' if ALLOW_EXTERNAL_ACCESS else 'Disabled'
        }
    })

def get_local_ip():
    """获取本机IP地址"""
    try:
        # 创建UDP socket连接，获取本机IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return '127.0.0.1'

if __name__ == '__main__':
    print("🚀 启动测试Web服务...")
    print(f"📱 本地访问: http://localhost:{SERVER_PORT}")
    
    if ALLOW_EXTERNAL_ACCESS:
        print(f"🌐 局域网访问: http://{get_local_ip()}:{SERVER_PORT}")
        print("⚠️  警告: 服务已允许外部访问，请确保在安全环境中运行")
    else:
        print("🔒 安全模式: 仅允许本地访问")
        print("ℹ️  设置 ALLOW_EXTERNAL_ACCESS=true 环境变量以允许外部访问")
    
    print("⏹️  按 Ctrl+C 停止服务")
    
    app.run(
        host=SERVER_HOST,  # 根据配置决定是否允许外部访问
        port=SERVER_PORT,  # 从环境变量读取端口
        debug=False,       # 生产模式
        threaded=True      # 多线程支持
    )
