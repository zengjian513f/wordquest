import { useEffect, useState } from "react";
import { Card, List, Typography, Spin, Switch, Segmented, Empty } from "antd";
import { BookOutlined } from "@ant-design/icons";
import type { Word, WordlistInfo } from "../types";

const { Title, Text } = Typography;
const USER_STORAGE_KEY = "wordquest_user";

interface Props {
  onStart: (words: Word[], shuffle: boolean, filename: string, user: string) => void;
}

export default function SelectPage({ onStart }: Props) {
  const [users, setUsers] = useState<string[]>([]);
  const [user, setUser] = useState<string>(() => localStorage.getItem(USER_STORAGE_KEY) ?? "");
  const [lists, setLists] = useState<WordlistInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data: string[]) => {
        setUsers(data);
        setLoadingUsers(false);
        if (data.length > 0 && !data.includes(user)) {
          setUser(data[0]);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(USER_STORAGE_KEY, user);
    setLoadingLists(true);
    fetch(`/api/wordlists/${encodeURIComponent(user)}`)
      .then((res) => res.json())
      .then((data) => {
        setLists(data);
        setLoadingLists(false);
      });
  }, [user]);

  async function handleSelect(filename: string) {
    const res = await fetch(`/api/words/${encodeURIComponent(user)}/${encodeURIComponent(filename)}`);
    const words: Word[] = await res.json();
    onStart(words, shuffle, filename, user);
  }

  return (
    <Card style={{ borderRadius: 16, textAlign: "center" }}>
      <Title level={2} style={{ marginBottom: 4 }}>
        WordQuest
      </Title>
      <Text type="secondary">选择一个词库开始默写吧</Text>
      {loadingUsers ? (
        <div style={{ marginTop: 16 }}>
          <Spin />
        </div>
      ) : users.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <Segmented
            options={users.map((u) => ({ label: u, value: u }))}
            value={user}
            onChange={(v) => setUser(v as string)}
            block
          />
        </div>
      ) : null}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Switch checked={shuffle} onChange={setShuffle} size="small" />
        <Text type="secondary">随机顺序</Text>
      </div>
      {loadingLists ? (
        <div style={{ marginTop: 32 }}>
          <Spin />
        </div>
      ) : lists.length === 0 ? (
        <Empty style={{ marginTop: 32 }} description="暂无词库" />
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
