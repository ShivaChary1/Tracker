import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Notes from "./pages/Notes";
import CalendarPage from "./pages/CalendarPage";
import Pomodoro from "./pages/Pomodoro";
import Analytics from "./pages/Analytics";
import Coach from "./pages/Coach";
import PrepGuide from "./pages/PrepGuide";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/prep-guide" element={<PrepGuide />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/coach" element={<Coach />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
