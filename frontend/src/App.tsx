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
  mistakeMap: Record<string, MistakeInfo>;
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
  const [mistakeMap, setMistakeMap] = useState<Record<string, MistakeInfo>>(
    saved?.mistakeMap ?? {}
  );

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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [page, queue, totalOriginal, correctCount, wrongCount, answeredCount, mistakeMap]);

  function startQuiz(words: Word[], shuffle: boolean) {
    const ordered = [...words];
    if (shuffle) {
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    }
    setQueue(ordered.map((w) => ({ ...w, mistakes: 0, hinted: false })));
    setTotalOriginal(ordered.length);
    setCorrectCount(0);
    setWrongCount(0);
    setAnsweredCount(0);
    setMistakeMap({});
    setPage("quiz");
  }

  function onCorrect() {
    setQueue((prev) => prev.slice(1));
    setCorrectCount((c) => c + 1);
    setAnsweredCount((c) => c + 1);
  }

  function onWrong() {
    const word = queue[0];
    const rest = queue.slice(1);
    const cleaned = rest.filter(
      (item) => item.english.toLowerCase() !== word.english.toLowerCase()
    );
    const updated: QueueItem = { ...word, mistakes: word.mistakes + 1, hinted: false };
    const reviewItem: QueueItem = { ...updated, mistakes: 0, hinted: false };
    for (const offset of REVIEW_OFFSETS) {
      const pos = Math.min(offset, cleaned.length);
      cleaned.splice(pos, 0, { ...reviewItem });
    }
    setQueue([updated, ...cleaned]);
    setWrongCount((c) => c + 1);
    setMistakeMap((prev) => ({
      ...prev,
      [word.english]: {
        chinese: word.chinese,
        count: (prev[word.english]?.count || 0) + 1,
      },
    }));
  }

  function onHint() {
    const word = queue[0];
    if (word.hinted) return;
    const updated = { ...word, hinted: true };
    const newQueue = [updated, ...queue.slice(1)];
    setQueue(newQueue);
    setMistakeMap((prev) => ({
      ...prev,
      [word.english]: {
        chinese: word.chinese,
        count: (prev[word.english]?.count || 0) + 1,
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
    setPage("select");
  }, []);

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
              queue={queue}
              totalOriginal={totalOriginal}
              correctCount={correctCount}
              wrongCount={wrongCount}
              answeredCount={answeredCount}
              onCorrect={onCorrect}
              onWrong={onWrong}
              onHint={onHint}
              onFinish={onFinish}
              onQuit={onQuit}
            />
          )}
          {page === "summary" && (
            <SummaryPage
              totalOriginal={totalOriginal}
              correctCount={correctCount}
              wrongCount={wrongCount}
              mistakeMap={mistakeMap}
              onRestart={onQuit}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
