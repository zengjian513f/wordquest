import { useEffect, useState } from "react";
import { Card, List, Typography, Spin, Switch } from "antd";
import { BookOutlined } from "@ant-design/icons";
import type { Word, WordlistInfo } from "../types";

const { Title, Text } = Typography;

interface Props {
  onStart: (words: Word[], shuffle: boolean) => void;
}

export default function SelectPage({ onStart }: Props) {
  const [lists, setLists] = useState<WordlistInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    fetch("/api/wordlists")
      .then((res) => res.json())
      .then((data) => {
        setLists(data);
        setLoading(false);
      });
  }, []);

  async function handleSelect(filename: string) {
    const res = await fetch(`/api/words/${filename}`);
    const words: Word[] = await res.json();
    onStart(words, shuffle);
  }

  return (
    <Card style={{ borderRadius: 16, textAlign: "center" }}>
      <Title level={2} style={{ marginBottom: 4 }}>
        WordQuest
      </Title>
      <Text type="secondary">选择一个词库开始默写吧</Text>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Switch checked={shuffle} onChange={setShuffle} size="small" />
        <Text type="secondary">随机顺序</Text>
      </div>
      {loading ? (
        <div style={{ marginTop: 32 }}>
          <Spin />
        </div>
      ) : (
        <List
          style={{ marginTop: 24 }}
          dataSource={lists}
          renderItem={(wl) => (
            <List.Item
              onClick={() => handleSelect(wl.filename)}
              style={{
                cursor: "pointer",
                padding: "16px 20px",
                borderRadius: 12,
                marginBottom: 8,
                background: "#e8f4f8",
                border: "2px solid transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#4ea8de";
                e.currentTarget.style.background = "#d4edfa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "#e8f4f8";
              }}
            >
              <List.Item.Meta
                avatar={<BookOutlined style={{ fontSize: 24, color: "#4ea8de" }} />}
                title={wl.name}
                description={`${wl.count} 个单词`}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
