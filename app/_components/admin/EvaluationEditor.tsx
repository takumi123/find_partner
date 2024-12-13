'use client';

import React, { useEffect, useState } from 'react';
import { EvaluationItem } from '@prisma/client';

type EvaluationFormData = {
  item: string;
  point3: string;
  point2: string;
  point1: string;
};

const initialFormData: EvaluationFormData = {
  item: '',
  point3: '',
  point2: '',
  point1: '',
};

export function EvaluationEditor() {
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [formData, setFormData] = useState<EvaluationFormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const response = await fetch('/api/admin/evaluations');
      if (!response.ok) throw new Error('評価項目の取得に失敗しました');
      const data = await response.json();
      setEvaluations(data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingId 
        ? `/api/admin/evaluations/${editingId}`
        : '/api/admin/evaluations';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('評価項目の保存に失敗しました');
      
      await fetchEvaluations();
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving evaluation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (evaluation: EvaluationItem) => {
    setFormData({
      item: evaluation.item,
      point3: evaluation.point3,
      point2: evaluation.point2,
      point1: evaluation.point1,
    });
    setEditingId(evaluation.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この評価項目を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/admin/evaluations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('評価項目の削除に失敗しました');
      
      await fetchEvaluations();
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item" className="block text-sm font-medium text-gray-700">
            評価項目
          </label>
          <input
            type="text"
            id="item"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.item}
            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
            placeholder="評価項目名"
          />
        </div>

        <div>
          <label htmlFor="point3" className="block text-sm font-medium text-gray-700">
            3点の基準
          </label>
          <textarea
            id="point3"
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.point3}
            onChange={(e) => setFormData({ ...formData, point3: e.target.value })}
            placeholder="3点を付与する基準"
          />
        </div>

        <div>
          <label htmlFor="point2" className="block text-sm font-medium text-gray-700">
            2点の基準
          </label>
          <textarea
            id="point2"
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.point2}
            onChange={(e) => setFormData({ ...formData, point2: e.target.value })}
            placeholder="2点を付与する基準"
          />
        </div>

        <div>
          <label htmlFor="point1" className="block text-sm font-medium text-gray-700">
            1点の基準
          </label>
          <textarea
            id="point1"
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.point1}
            onChange={(e) => setFormData({ ...formData, point1: e.target.value })}
            placeholder="1点を付与する基準"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? '保存中...' : (editingId ? '更新' : '追加')}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData(initialFormData);
              setEditingId(null);
            }}
            className="ml-4 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            キャンセル
          </button>
        )}
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">評価項目一覧</h2>
        <div className="mt-4 space-y-4">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="rounded-lg bg-white p-4 shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">{evaluation.item}</h3>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(evaluation)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(evaluation.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">3点：</span>{evaluation.point3}</p>
                <p><span className="font-medium">2点：</span>{evaluation.point2}</p>
                <p><span className="font-medium">1点：</span>{evaluation.point1}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
