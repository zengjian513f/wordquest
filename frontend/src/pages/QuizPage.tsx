import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Input, Button, Progress, Typography, Popconfirm } from "antd";
import type { InputRef } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  LogoutOutlined,
  EnterOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { Word } from "../types";

const { Text } = Typography;

interface Props {
  currentWord: Word | null;
  queueLength: number;
  totalOriginal: number;
  correctCount: number;
  wrongCount: number;
  answeredCount: number;
  onCorrect: () => void;
  onWrong: () => void;
  onHint: () => void;
  onFinish: () => void;
  onQuit: () => void;
  onRefresh: () => void;
}

export default function QuizPage({
  currentWord,
  queueLength,
  totalOriginal,
  correctCount,
  wrongCount,
  answeredCount,
  onCorrect,
  onWrong,
  onHint,
  onFinish,
  onQuit,
  onRefresh,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const prevInputRef = useRef("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [showingHint, setShowingHint] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const dynamicTotal = answeredCount + queueLength;
  const pct = dynamicTotal > 0 ? Math.round((answeredCount / dynamicTotal) * 100) : 0;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [currentWord?.english, focusInput]);

  // 队列空了 → 完成
  useEffect(() => {
    if (queueLength === 0 && totalOriginal > 0) {
      onFinish();
    }
  }, [queueLength, totalOriginal, onFinish]);

  if (!currentWord) return null;

  function handleSubmit() {
    if (disabled || showingHint || !inputValue.trim()) return;
    const answer = inputValue.trim().toLowerCase();

    if (answer === currentWord!.english.toLowerCase()) {
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
      focusInput();
    }
  }

  function handleHintStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    prevInputRef.current = inputValue;
    setShowingHint(true);
    setInputValue(currentWord!.english);
    onHint();
  }

  function handleHintEnd(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!showingHint) return;
    setShowingHint(false);
    setInputValue(prevInputRef.current);
    focusInput();
  }

  const borderColor =
    feedback === "correct" ? "#52c41a" : feedback === "wrong" ? "#ff4d4f" : undefined;
  const isNumericAnswer = /^\d+$/.test(currentWord.english.trim());

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Progress
          percent={pct}
          showInfo={false}
          strokeColor={{ from: "#4ea8de", to: "#48bfe3" }}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <Button
          icon={<ReloadOutlined />}
          type="text"
          size="small"
          onClick={onRefresh}
          style={{ color: "#999", flexShrink: 0 }}
        />
        <Popconfirm
          title="确定要退出吗？"
          description="当前进度将会丢失"
          onConfirm={onQuit}
          okText="退出"
          cancelText="继续答题"
        >
          <Button
            icon={<LogoutOutlined />}
            type="text"
            size="small"
            style={{ color: "#999", flexShrink: 0 }}
          />
        </Popconfirm>
      </div>
      <Card style={{ borderRadius: 16, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <Text type="secondary">
            {answeredCount} / {dynamicTotal}
          </Text>
          <Text style={{ color: "#52c41a" }}>
            <CheckOutlined /> {correctCount}
          </Text>
          <Text style={{ color: "#ff4d4f" }}>
            <CloseOutlined /> {wrongCount}
          </Text>
        </div>

        <div style={{ fontSize: 42, fontWeight: "bold", margin: "12px 0", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span style={{ color: "#1a1a2e" }}>{currentWord.chinese}</span>
          <QuestionCircleOutlined
            onMouseDown={handleHintStart}
            onMouseUp={handleHintEnd}
            onMouseLeave={handleHintEnd}
            onTouchStart={handleHintStart}
            onTouchEnd={handleHintEnd}
            style={{
              fontSize: 28,
              color: "#bbb",
              cursor: "pointer",
              userSelect: "none",
              touchAction: "none",
            }}
          />
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
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-form-type="other"
          inputMode={isNumericAnswer ? "numeric" : "email"}
          suffix={
            <Button type="text" onClick={handleSubmit} disabled={disabled} style={{ padding: "0 4px", fontSize: 18 }}>
              <EnterOutlined />
            </Button>
          }
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
      </Card>
    </div>
  );
}
