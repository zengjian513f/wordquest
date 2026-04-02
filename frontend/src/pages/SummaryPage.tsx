import { Card, Button, Typography, List, Tag } from "antd";
import { TrophyOutlined, RedoOutlined } from "@ant-design/icons";
import type { MistakeInfo } from "../types";

const { Title, Text } = Typography;

interface Props {
  totalOriginal: number;
  correctCount: number;
  wrongCount: number;
  mistakeMap: Record<string, MistakeInfo>;
  onRestart: () => void;
}

export default function SummaryPage({
  totalOriginal,
  correctCount,
  wrongCount,
  mistakeMap,
  onRestart,
}: Props) {
  const total = correctCount + wrongCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 100;
  const mistakes = Object.entries(mistakeMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <Card style={{ borderRadius: 16, textAlign: "center" }}>
      <TrophyOutlined style={{ fontSize: 48, color: "#f39c12", marginBottom: 16 }} />
      <Title level={2}>完成！</Title>

      <div
        style={{
          fontSize: 64,
          fontWeight: "bold",
          color: accuracy >= 80 ? "#52c41a" : accuracy >= 50 ? "#f39c12" : "#ff4d4f",
          marginBottom: 8,
        }}
      >
        {accuracy}%
      </div>

      <Text type="secondary" style={{ fontSize: 16 }}>
        共 {totalOriginal} 个单词，答对 {correctCount} 次，答错 {wrongCount} 次
      </Text>

      {mistakes.length === 0 ? (
        <div style={{ marginTop: 24, fontSize: 20, color: "#52c41a" }}>
          全部一次通过，太棒了！
        </div>
      ) : (
        <div style={{ textAlign: "left", marginTop: 24 }}>
          <Title level={5} type="danger">
            需要加强的单词（{mistakes.length} 个）
          </Title>
          <List
            size="small"
            dataSource={mistakes}
            renderItem={([en, info]) => (
              <List.Item
                style={{
                  background: "#fdf2f2",
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: "8px 16px",
                }}
              >
                <Text strong style={{ color: "#c0392b" }}>
                  {en}
                </Text>
                <Text type="secondary">{info.chinese}</Text>
                <Tag color="red">错/提示 {info.count} 次</Tag>
              </List.Item>
            )}
          />
        </div>
      )}

      <Button
        type="primary"
        icon={<RedoOutlined />}
        size="large"
        onClick={onRestart}
        style={{ marginTop: 24 }}
      >
        再来一次
      </Button>
    </Card>
  );
}
