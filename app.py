# =============================================
#  智谱AI 聊天代理服务器 + 静态网页托管 (最终稳定版)
# =============================================

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import requests
import json
import os

# static_url_path='' 会让 Flask 自动、完美地处理所有 html, js 和图片，绝不冲突
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app) 

# ⚠️ 保持你的 API Key 不变
ZHIPU_API_KEY = "5f2d94845b9a47008288ada87e021d27.ProEHjpiEbGvKtcc"
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 只保留这一个针对访问“纯网址（根目录）”的引导即可
@app.route('/')
def home():
    return app.send_static_file('index.html')

# 聊天接口保持完全不变
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
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
