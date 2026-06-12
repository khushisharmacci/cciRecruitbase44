import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import Analytics from "./pages/Analytics";
import Companies from "./pages/Companies";

function App() {
  return (
  <AuthProvider>
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:candidateId" element={<CandidateDetail />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>

        <Toaster />
      </Router>
    </QueryClientProvider>
  </AuthProvider>
);
}

export default App;