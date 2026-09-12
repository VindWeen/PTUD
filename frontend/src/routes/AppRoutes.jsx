import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Achievements from '../pages/Achievements';
import ProfilePortfolio from '../pages/ProfilePortfolio';
import AIForecast from '../pages/AIForecast';
import Approvals from '../pages/Approvals';
import Awards from '../pages/Awards';
import Reports from '../pages/Reports';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="profile" element={<ProfilePortfolio />} />
        <Route path="ai-forecast" element={<AIForecast />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="awards" element={<Awards />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
