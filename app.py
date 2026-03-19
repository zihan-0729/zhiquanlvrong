# =============================================
#  智谱AI 聊天代理服务器 + 静态网页托管
# =============================================

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import requests
import json
import os

# 将当前目录设为静态文件目录，这样Flask就能直接读取同目录下的html文件
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

ZHIPU_API_KEY = "5f2d94845b9a47008288ada87e021d27.ProEHjpiEbGvKtcc"
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 新增：当评委访问根目录时，默认展示 index.html
@app.route('/')
def home():
    return app.send_static_file('index.html')

# 新增：当评委访问其他页面（如 chat.html, apply.html 或 js 文件）时，自动返回对应文件
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return app.send_static_file(path)
    return "页面未找到", 404

# 原有的聊天接口保持不变
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])

    headers = {
        "Authorization": f"Bearer {ZHIPU_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "glm-4-flash",
        "messages": messages,
        "stream": True,
    }

    def generate():
        try:
            with requests.post(
                ZHIPU_API_URL, headers=headers, json=payload, stream=True, timeout=60
            ) as resp:
                resp.raise_for_status()
                for line in resp.iter_lines():
                    if line:
                        line = line.decode("utf-8")
                        if line.startswith("data: "):
                            line = line[6:]
                        if line == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            chunk = json.loads(line)
                            delta = (
                                chunk.get("choices", [{}])[0]
                                .get("delta", {})
                                .get("content", "")
                            )
                            if delta:
                                yield f"data: {json.dumps({'content': delta})}\n\n"
                        except json.JSONDecodeError:
                            continue
        except requests.exceptions.RequestException as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

if __name__ == "__main__":
    # 动态获取云端分配的端口，如果没有则默认5000（这是云端部署必须的一步）
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
