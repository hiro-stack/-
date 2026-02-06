'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Cat {
  id: number;
  name: string;
  gender: string;
  age_years: number;
  age_months: number;
  breed: string;
  color: string;
  status: string;
  primary_image: string | null;
  shelter_name: string;
}

export default function Home() {
  const { user } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await api.get('/api/cats/');
        setCats(response.data);
      } catch (error) {
        console.error('Failed to fetch cats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCats();
  }, []);

  return (
    <div>
      {/* ヘッダー */}
      <header className="header">
        <div className="header-container">
          <Link href="/" className="logo">
            🐱 保護猫マッチング
          </Link>
          <nav className="nav">
            <Link href="/" className="nav-link">猫を探す</Link>
            {user ? (
              <>
                {user.user_type === 'shelter' && (
                  <Link href="/shelter/cats" className="nav-link">猫の管理</Link>
                )}
                {user.user_type === 'adopter' && (
                  <Link href="/applications" className="nav-link">応募履歴</Link>
                )}
                <Link href="/profile" className="nav-link">プロフィール</Link>
                <span className="nav-link">{user.username}</span>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline">ログイン</Link>
                <Link href="/register" className="btn btn-primary">新規登録</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section style={{
        background: 'linear-gradient(135deg, #FF6B9D 0%, #4ECDC4 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          新しい家族を見つけよう
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
          保護猫と新しい飼い主をつなぐプラットフォーム
        </p>
        {!user && (
          <Link href="/register" className="btn btn-primary" style={{ fontSize: '1.125rem' }}>
            今すぐ始める
          </Link>
        )}
      </section>

      {/* 猫一覧 */}
      <div className="container">
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          募集中の保護猫
        </h2>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : cats.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            現在募集中の猫はいません
          </p>
        ) : (
          <div className="grid">
            {cats.map((cat) => (
              <Link href={`/cats/${cat.id}`} key={cat.id}>
                <div className="card">
                  {cat.primary_image ? (
                    <img
                      src={cat.primary_image}
                      alt={cat.name}
                      className="card-image"
                    />
                  ) : (
                    <div
                      className="card-image"
                      style={{
                        background: 'linear-gradient(135deg, #FFE0E9, #FFB6C1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem'
                      }}
                    >
                      🐱
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {cat.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {cat.gender === 'male' ? 'オス' : cat.gender === 'female' ? 'メス' : '不明'} • {cat.age_years}歳{cat.age_months}ヶ月
                  </p>
                  {cat.breed && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {cat.breed}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span className="badge badge-available">募集中</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {cat.shelter_name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
