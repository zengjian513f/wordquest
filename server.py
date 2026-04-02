"""WordQuest - 默单词小应用后端"""

from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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


@app.get("/api/wordlists")
def list_wordlists():
    """列出所有可用的单词表"""
    files = []
    for f in sorted(WORDS_DIR.glob("*.txt")):
        words = parse_word_file(f)
        files.append({"name": f.stem, "filename": f.name, "count": len(words)})
    return files


@app.get("/api/words/{filename}")
def get_words(filename: str):
    """获取某个单词表的全部单词"""
    filepath = WORDS_DIR / filename
    if not filepath.is_file() or filepath.suffix != ".txt":
        raise HTTPException(status_code=404, detail="文件不存在")
    return parse_word_file(filepath)


# 静态文件放在 API 路由之后，避免覆盖
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)
