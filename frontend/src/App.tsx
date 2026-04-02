import { useState } from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import SelectPage from "./pages/SelectPage";
import QuizPage from "./pages/QuizPage";
import SummaryPage from "./pages/SummaryPage";
import type { Word, QueueItem, MistakeInfo } from "./types";

const REVIEW_OFFSETS = [3, 7, 15];

type Page = "select" | "quiz" | "summary";

export default function App() {
  const [page, setPage] = useState<Page>("select");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [totalOriginal, setTotalOriginal] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [mistakeMap, setMistakeMap] = useState<Record<string, MistakeInfo>>({});

  function startQuiz(words: Word[]) {
    // Fisher-Yates 洗牌
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled.map((w) => ({ ...w, mistakes: 0, hinted: false })));
    setTotalOriginal(shuffled.length);
    setCorrectCount(0);
    setWrongCount(0);
    setAnsweredCount(0);
    setMistakeMap({});
    setPage("quiz");
  }

  function onCorrect() {
    // 答对：直接出队（复习副本已在答错时插入）
    setQueue((prev) => prev.slice(1));
    setCorrectCount((c) => c + 1);
    setAnsweredCount((c) => c + 1);
  }

  function onWrong() {
    const word = queue[0];
    // 清除队列中该词的所有旧副本，重新插入复习
    const rest = queue.slice(1);
    const cleaned = rest.filter(
      (item) => item.english.toLowerCase() !== word.english.toLowerCase()
    );
    const updated: QueueItem = { ...word, mistakes: word.mistakes + 1, hinted: false };
    // 当前词留在队首，复习副本插入后方
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

  return (
    <ConfigProvider locale={zhCN}>
      <div
        style={{
          minHeight: "100vh",
          background: "#f0f4f8",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
            />
          )}
          {page === "summary" && (
            <SummaryPage
              totalOriginal={totalOriginal}
              correctCount={correctCount}
              wrongCount={wrongCount}
              mistakeMap={mistakeMap}
              onRestart={() => setPage("select")}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
