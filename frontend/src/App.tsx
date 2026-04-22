import { useState, useEffect, useCallback } from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import SelectPage from "./pages/SelectPage";
import QuizPage from "./pages/QuizPage";
import SummaryPage from "./pages/SummaryPage";
import type { Word, QueueItem, MistakeInfo } from "./types";

const REVIEW_OFFSETS = [3, 7, 15];
const STORAGE_KEY = "wordquest_state";

type Page = "select" | "quiz" | "summary";

interface AppState {
  page: Page;
  queue: QueueItem[];
  totalOriginal: number;
  correctCount: number;
  wrongCount: number;
  answeredCount: number;
  mistakeMap: Record<number, MistakeInfo>;
  filename?: string;
  user?: string;
  sourceWords: Word[];
}

function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

const saved = loadState();

export default function App() {
  const [page, setPage] = useState<Page>(saved?.page ?? "select");
  const [queue, setQueue] = useState<QueueItem[]>(saved?.queue ?? []);
  const [totalOriginal, setTotalOriginal] = useState(saved?.totalOriginal ?? 0);
  const [correctCount, setCorrectCount] = useState(saved?.correctCount ?? 0);
  const [wrongCount, setWrongCount] = useState(saved?.wrongCount ?? 0);
  const [answeredCount, setAnsweredCount] = useState(saved?.answeredCount ?? 0);
  const [mistakeMap, setMistakeMap] = useState<Record<number, MistakeInfo>>(
    saved?.mistakeMap ?? {}
  );
  const [filename, setFilename] = useState<string | undefined>(saved?.filename);
  const [user, setUser] = useState<string | undefined>(saved?.user);
  const [sourceWords, setSourceWords] = useState<Word[]>(saved?.sourceWords ?? []);

  // 持久化状态
  useEffect(() => {
    const state: AppState = {
      page,
      queue,
      totalOriginal,
      correctCount,
      wrongCount,
      answeredCount,
      mistakeMap,
      filename,
      user,
      sourceWords,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [page, queue, totalOriginal, correctCount, wrongCount, answeredCount, mistakeMap, filename, user, sourceWords]);

  const refreshWords = useCallback(async () => {
    if (!filename || !user) return;
    const res = await fetch(`/api/words/${encodeURIComponent(user)}/${encodeURIComponent(filename)}`);
    const source: Word[] = await res.json();
    setSourceWords(source);
  }, [filename, user]);

  function startQuiz(words: Word[], shuffle: boolean, filename: string, user: string) {
    setSourceWords(words);
    const indices = words.map((_, i) => i);
    if (shuffle) {
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    setQueue(indices.map((i) => ({ index: i, mistakes: 0, hinted: false })));
    setTotalOriginal(indices.length);
    setCorrectCount(0);
    setWrongCount(0);
    setAnsweredCount(0);
    setMistakeMap({});
    setFilename(filename);
    setUser(user);
    setPage("quiz");
  }

  function onCorrect() {
    setQueue((prev) => prev.slice(1));
    setCorrectCount((c) => c + 1);
    setAnsweredCount((c) => c + 1);
  }

  function onWrong() {
    const item = queue[0];
    const currentIdx = item.index;
    const rest = queue.slice(1);
    // 过滤当前词的副本；同时折叠相邻重复（过滤可能让原本被当前词隔开的同词塌到一起）
    const cleaned: QueueItem[] = [];
    for (const it of rest) {
      if (it.index === currentIdx) continue;
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].index === it.index) continue;
      cleaned.push(it);
    }
    const updated: QueueItem = { ...item, mistakes: item.mistakes + 1, hinted: false };
    const reviewItem: QueueItem = { index: currentIdx, mistakes: 0, hinted: false };
    const pickBuffer = (): QueueItem | null => {
      const wrongIndices = Object.keys(mistakeMap)
        .map(Number)
        .filter((idx) => idx !== currentIdx);
      if (wrongIndices.length > 0) {
        return { index: wrongIndices[0], mistakes: 0, hinted: false };
      }
      for (let i = 0; i < sourceWords.length; i++) {
        if (i !== currentIdx) {
          return { index: i, mistakes: 0, hinted: false };
        }
      }
      return null;
    };
    for (const offset of REVIEW_OFFSETS) {
      const pos = Math.min(offset, cleaned.length);
      if (pos < cleaned.length) {
        // 中间插入：cleaned 已过滤同词，左右一定不同，直接插
        cleaned.splice(pos, 0, { ...reviewItem });
        continue;
      }
      // 尾端 append：看最后一个（空时视为 updated）是不是同词
      const last = cleaned.length > 0 ? cleaned[cleaned.length - 1] : updated;
      if (last.index !== currentIdx) {
        cleaned.push({ ...reviewItem });
      } else {
        const buffer = pickBuffer();
        if (buffer) cleaned.push(buffer, { ...reviewItem });
      }
    }
    setQueue([updated, ...cleaned]);
    setWrongCount((c) => c + 1);
    setMistakeMap((prev) => ({
      ...prev,
      [currentIdx]: {
        count: (prev[currentIdx]?.count || 0) + 1,
        hinted: prev[currentIdx]?.hinted,
      },
    }));
  }

  function onHint() {
    const item = queue[0];
    if (item.hinted) return;
    const updated = { ...item, hinted: true };
    setQueue([updated, ...queue.slice(1)]);
    setMistakeMap((prev) => ({
      ...prev,
      [item.index]: {
        count: (prev[item.index]?.count || 0) + 1,
        hinted: true,
      },
    }));
  }

  function onFinish() {
    setPage("summary");
  }

  const onQuit = useCallback(() => {
    clearState();
    setQueue([]);
    setTotalOriginal(0);
    setCorrectCount(0);
    setWrongCount(0);
    setAnsweredCount(0);
    setMistakeMap({});
    setFilename(undefined);
    setUser(undefined);
    setSourceWords([]);
    setPage("select");
  }, []);

  const currentWord = queue.length > 0 ? sourceWords[queue[0].index] : null;

  return (
    <ConfigProvider locale={zhCN}>
      <div
        style={{
          minHeight: "100vh",
          background: "#f0f4f8",
          display: "flex",
          justifyContent: "center",
          fontFamily: '-apple-system, "Microsoft YaHei", sans-serif',
        }}
      >
        <div style={{ width: "100%", maxWidth: 500, padding: 20 }}>
          {page === "select" && <SelectPage onStart={startQuiz} />}
          {page === "quiz" && (
            <QuizPage
              currentWord={currentWord}
              queueLength={queue.length}
              totalOriginal={totalOriginal}
              correctCount={correctCount}
              wrongCount={wrongCount}
              answeredCount={answeredCount}
              onCorrect={onCorrect}
              onWrong={onWrong}
              onHint={onHint}
              onFinish={onFinish}
              onQuit={onQuit}
              onRefresh={refreshWords}
            />
          )}
          {page === "summary" && (
            <SummaryPage
              totalOriginal={totalOriginal}
              correctCount={correctCount}
              wrongCount={wrongCount}
              mistakeMap={mistakeMap}
              sourceWords={sourceWords}
              onRestart={onQuit}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
