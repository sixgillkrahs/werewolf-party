"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Layout, Typography, Card, Space, List, Tag, Spin, Tabs, message } from "antd";
import { io, Socket } from "socket.io-client";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface Player {
  id: string;
  username: string;
  role: string | null;
}

interface GameState {
  name: string;
  state: "lobby" | "night" | "day";
  players: Player[];
  centerCards: string[];
}

let socket: Socket;

export default function WerewolfApp() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    // Initialize socket connection
    fetch('/api/socket').finally(() => {
        socket = io({
          path: "/socket.io/",
        });

        socket.on("connect", () => {
          setIsConnected(true);
        });

        socket.on("gameStateUpdate", (state: GameState) => {
          setGameState(state);
        });

        socket.on("disconnect", () => {
          setIsConnected(false);
        });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleCreateRoom = async (values: { username: string; roomName: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.roomName, password: values.password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      message.success('Room created successfully!');
      setUsername(values.username);
      setRoomId(data.id);
      setRoomName(data.name);
      socket.emit("joinGame", data.name, values.username, data.id);
      setJoined(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (values: { username: string; roomId: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: values.roomId, password: values.password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      message.success('Joined room successfully!');
      setUsername(values.username);
      setRoomId(data.id);
      setRoomName(data.name);
      socket.emit("joinGame", data.name, values.username, data.id);
      setJoined(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    socket.emit("startGame", roomId);
  };

  const endNight = () => {
    socket.emit("endNight", roomId);
  };

  if (!joined) {
    return (
      <Layout className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg" title={<Title level={3} className="text-center m-0">One Night Werewolf</Title>}>
           {!isConnected && <div className="text-center mb-4"><Spin /> <Text type="secondary">Connecting to server...</Text></div>}

           <Tabs defaultActiveKey="join">
             <Tabs.TabPane tab="Join Room" key="join">
                <Form layout="vertical" onFinish={handleJoinRoom} disabled={!isConnected || loading}>
                  <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                    <Input placeholder="Enter your name" size="large" />
                  </Form.Item>
                  <Form.Item label="Room ID" name="roomId" rules={[{ required: true }]}>
                    <Input placeholder="Paste Room ID here" size="large" />
                  </Form.Item>
                  <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                    <Input.Password placeholder="Room password" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    Join Game
                  </Button>
                </Form>
             </Tabs.TabPane>
             <Tabs.TabPane tab="Create Room" key="create">
                 <Form layout="vertical" onFinish={handleCreateRoom} disabled={!isConnected || loading}>
                  <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                    <Input placeholder="Enter your name" size="large" />
                  </Form.Item>
                  <Form.Item label="Room Name" name="roomName" rules={[{ required: true }]}>
                    <Input placeholder="e.g. My Cool Room" size="large" />
                  </Form.Item>
                  <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                    <Input.Password placeholder="Set a password" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    Create & Join Game
                  </Button>
                </Form>
             </Tabs.TabPane>
           </Tabs>
        </Card>
      </Layout>
    );
  }

  if (!gameState) {
    return (
      <Layout className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading game state..." />
      </Layout>
    );
  }

  const myPlayer = gameState.players.find((p) => p.username === username);

  return (
    <Layout className="min-h-screen bg-slate-900 text-white">
      <Header className="bg-slate-900 border-b border-slate-700 flex justify-between items-center px-4 md:px-8">
        <Title level={4} style={{ color: 'white', margin: 0 }}>Werewolf: {gameState.name || roomName}</Title>
        <Space>
           <Text className="text-slate-400 text-xs hidden md:inline">ID: {roomId}</Text>
           <Tag color={gameState.state === "lobby" ? "green" : gameState.state === "night" ? "blue" : "orange"} className="text-sm m-0">
             {gameState.state.toUpperCase()}
           </Tag>
        </Space>
      </Header>

      <Content className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        {gameState.state === "lobby" && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
            <Title level={2} style={{ color: 'white' }}>Lobby</Title>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 mb-6 inline-block">
               <Text className="text-slate-400 block text-xs mb-1">Share this Room ID with friends:</Text>
               <Text copyable style={{ color: 'white' }} className="font-mono text-lg">{roomId}</Text>
            </div>
            <Text className="text-slate-300 block mb-6">Waiting for players...</Text>

            <List
              className="bg-slate-700 rounded-lg mb-6 max-w-md mx-auto"
              bordered
              dataSource={gameState.players}
              renderItem={(player) => (
                <List.Item className="text-white border-slate-600">
                  {player.username} {player.username === username && <Tag color="blue" className="ml-2">You</Tag>}
                </List.Item>
              )}
            />

            <Button type="primary" size="large" onClick={startGame} disabled={gameState.players.length < 3}>
              Start Game (min 3 players)
            </Button>
          </div>
        )}

        {gameState.state === "night" && (
          <div className="space-y-6">
            <Card className="bg-indigo-900 border-indigo-700 text-center shadow-2xl">
              <Title level={2} style={{ color: 'white' }}>Night Phase</Title>
              <Text className="text-indigo-200 text-lg block mb-6">Everyone close your eyes...</Text>

              <div className="bg-indigo-950 p-8 rounded-xl border border-indigo-800 inline-block mb-6">
                <Text className="text-indigo-300 block mb-2">Your Secret Role is:</Text>
                <Title level={1} className="m-0 text-white" style={{ color: '#ffb347' }}>
                   {myPlayer?.role || "Loading..."}
                </Title>
              </div>

              <div>
                <Button type="primary" danger size="large" onClick={endNight}>
                  Wake Up (End Night)
                </Button>
              </div>
            </Card>
          </div>
        )}

        {gameState.state === "day" && (
           <div className="space-y-6">
           <Card className="bg-amber-900 border-amber-700 text-center shadow-2xl">
             <Title level={2} style={{ color: 'white' }}>Day Phase</Title>
             <Text className="text-amber-200 text-lg block mb-6">Discuss who the werewolf is!</Text>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="bg-amber-950 p-6 rounded-xl border border-amber-800">
                    <Title level={4} style={{ color: 'white' }}>Players</Title>
                    <List
                        dataSource={gameState.players}
                        renderItem={(player) => (
                            <List.Item className="text-white border-amber-800/50">
                                {player.username} {player.username === username && <Tag color="blue" className="ml-2">You</Tag>}
                            </List.Item>
                        )}
                    />
                </div>
                <div className="bg-amber-950 p-6 rounded-xl border border-amber-800 flex flex-col justify-center items-center text-center">
                    <Title level={4} style={{ color: 'white', marginBottom: '24px' }}>Center Cards</Title>
                    <Space size="large">
                        {gameState.centerCards.map((_, i) => (
                             <div key={i} className="w-16 h-24 bg-slate-800 rounded-lg border-2 border-slate-600 flex items-center justify-center shadow-inner">
                                <Text className="text-slate-400">?</Text>
                             </div>
                        ))}
                    </Space>
                </div>
             </div>
           </Card>
         </div>
        )}
      </Content>
    </Layout>
  );
}
