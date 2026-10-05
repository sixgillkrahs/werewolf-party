"use client";

import { useEffect, useState } from "react";
import { Table, Button, Form, Input, message, Layout, Typography } from "antd";

const { Header, Content } = Layout;
const { Title } = Typography;

interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        if (isMounted) setUsers(data);
      } catch (error) {
        console.error(error);
        if (isMounted) message.error("Could not load users.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchUsersUpdate = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error(error);
        message.error("Could not load users.");
      } finally {
        setLoading(false);
      }
    };

  const onFinish = async (values: { email: string; name?: string }) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      message.success("User created successfully!");
      form.resetFields();
      fetchUsersUpdate();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create user";
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white flex items-center px-8 border-b">
        <Title level={3} className="m-0">User Management</Title>
      </Header>
      <Content className="p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <Title level={4} className="mb-4">Create New User</Title>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input the email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>

            <Form.Item label="Name" name="name">
              <Input placeholder="John Doe" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Create User
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Title level={4} className="mb-4">Users List</Title>
          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            loading={loading}
          />
        </div>
      </Content>
    </Layout>
  );
}
