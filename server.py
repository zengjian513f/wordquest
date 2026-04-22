"""WordQuest - 默单词小应用后端"""

from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

app = FastAPI()

WORDS_DIR = Path(__file__).parent / "words"


def parse_word_file(filepath: Path) -> list[dict]:
    """解析单词文件，返回 [{english, chinese}, ...]"""
    words = []
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t", 1)
            if len(parts) == 2:
                words.append({"english": parts[0].strip(), "chinese": parts[1].strip()})
    return words


def safe_user_dir(user: str) -> Path:
    """根据用户名返回对应目录，防止路径穿越"""
    if not user or "/" in user or "\\" in user or user.startswith("."):
        raise HTTPException(status_code=400, detail="非法用户名")
    user_dir = WORDS_DIR / user
    if not user_dir.is_dir():
        raise HTTPException(status_code=404, detail="用户不存在")
    return user_dir


@app.get("/api/users")
def list_users():
    """列出所有用户（words 下的子目录）"""
    if not WORDS_DIR.is_dir():
        return []
    return sorted(p.name for p in WORDS_DIR.iterdir() if p.is_dir() and not p.name.startswith("."))


@app.get("/api/wordlists/{user}")
def list_wordlists(user: str):
    """列出某个用户下所有可用的单词表"""
    user_dir = safe_user_dir(user)
    files = []
    for f in sorted(user_dir.glob("*.txt")):
        words = parse_word_file(f)
        files.append({"name": f.stem, "filename": f.name, "count": len(words)})
    return files


@app.get("/api/words/{user}/{filename}")
def get_words(user: str, filename: str):
    """获取某个用户某个单词表的全部单词"""
    user_dir = safe_user_dir(user)
    filepath = user_dir / filename
    if not filepath.is_file() or filepath.suffix != ".txt" or filepath.parent != user_dir:
        raise HTTPException(status_code=404, detail="文件不存在")
    return parse_word_file(filepath)


# 静态文件放在 API 路由之后，避免覆盖
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        ssl_keyfile="key.pem",
        ssl_certfile="cert.pem",
    )
