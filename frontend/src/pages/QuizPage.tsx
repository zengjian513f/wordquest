import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Input, Button, Progress, Space, Typography } from "antd";
import type { InputRef } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { QueueItem } from "../types";

const { Text } = Typography;

interface Props {
  queue: QueueItem[];
  totalOriginal: number;
  correctCount: number;
  wrongCount: number;
  answeredCount: number;
  onCorrect: () => void;
  onWrong: () => void;
  onHint: () => void;
  onFinish: () => void;
}

export default function QuizPage({
  queue,
  totalOriginal,
  correctCount,
  wrongCount,
  answeredCount,
  onCorrect,
  onWrong,
  onHint,
  onFinish,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [showingHint, setShowingHint] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const currentWord = queue[0];
  const dynamicTotal = answeredCount + queue.length;
  const pct = dynamicTotal > 0 ? Math.round((answeredCount / dynamicTotal) * 100) : 0;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [currentWord?.english, focusInput]);

  // 队列空了 → 完成
  useEffect(() => {
    if (queue.length === 0 && totalOriginal > 0) {
      onFinish();
    }
  }, [queue.length, totalOriginal, onFinish]);

  if (!currentWord) return null;

  function handleSubmit() {
    if (disabled || showingHint || !inputValue.trim()) return;
    const answer = inputValue.trim().toLowerCase();

    if (answer === currentWord.english.toLowerCase()) {
      setFeedback("correct");
      setDisabled(true);
      setTimeout(() => {
        onCorrect();
        setInputValue("");
        setFeedback(null);
        setDisabled(false);
      }, 600);
    } else {
      setFeedback("wrong");
      onWrong();
      setTimeout(() => {
        setFeedback(null);
        focusInput();
      }, 1000);
    }
  }

  function handleHintStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setShowingHint(true);
    setInputValue(currentWord.english);
    onHint();
  }

  function handleHintEnd(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!showingHint) return;
    setShowingHint(false);
    setInputValue("");
    focusInput();
  }

  const borderColor =
    feedback === "correct" ? "#52c41a" : feedback === "wrong" ? "#ff4d4f" : undefined;

  return (
    <div>
      <Progress
        percent={pct}
        showInfo={false}
        strokeColor={{ from: "#4ea8de", to: "#48bfe3" }}
        style={{ marginBottom: 16 }}
      />
      <Card style={{ borderRadius: 16, textAlign: "center", minHeight: 340 }}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
          <Text type="secondary">
            {answeredCount} / {dynamicTotal}
          </Text>
          <Text style={{ color: "#52c41a" }}>
            <CheckOutlined /> {correctCount}
          </Text>
          <Text style={{ color: "#ff4d4f" }}>
            <CloseOutlined /> {wrongCount}
          </Text>
        </Space>

        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "#1a1a2e",
            margin: "24px 0 32px",
            minHeight: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {currentWord.chinese}
        </div>

        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSubmit}
          disabled={disabled}
          placeholder="输入英文..."
          size="large"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          style={{
            fontSize: 24,
            textAlign: "center",
            letterSpacing: 2,
            borderWidth: 3,
            borderColor,
            borderRadius: 12,
            background:
              feedback === "correct"
                ? "#eafaf1"
                : feedback === "wrong"
                  ? "#fdf2f2"
                  : undefined,
          }}
        />

        <div style={{ minHeight: 48, marginTop: 16, fontSize: 36 }}>
          {feedback === "correct" && (
            <CheckCircleFilled style={{ color: "#52c41a" }} />
          )}
          {feedback === "wrong" && (
            <CloseCircleFilled style={{ color: "#ff4d4f" }} />
          )}
        </div>

        <Button
          icon={<EyeOutlined />}
          type="primary"
          style={{
            marginTop: 8,
            background: "#f39c12",
            borderColor: "#f39c12",
            userSelect: "none",
            touchAction: "manipulation",
          }}
          onMouseDown={handleHintStart}
          onMouseUp={handleHintEnd}
          onMouseLeave={handleHintEnd}
          onTouchStart={handleHintStart}
          onTouchEnd={handleHintEnd}
        >
          按住看答案
        </Button>
      </Card>
    </div>
  );
}
