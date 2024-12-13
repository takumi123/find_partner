'use client';

import React from 'react';
import { EvaluationEditor } from "../_components/admin/EvaluationEditor";

export default function EvaluationsPage() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-bold mb-6">評価項目管理</h1>
      <EvaluationEditor />
    </main>
  );
}