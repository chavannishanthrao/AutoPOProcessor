import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./Dashboard";

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return <Dashboard />;
}
