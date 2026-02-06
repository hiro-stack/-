'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    user_type: 'adopter' as 'adopter' | 'shelter',
    phone_number: '',
    address: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // クライアント側のバリデーション
    const newErrors: {[key: string]: string} = {};
    
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'パスワードが一致しません';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      router.push('/');
    } catch (err: any) {
      console.error('登録エラー:', err);
      console.error('エラーレスポンス:', err.response);
      
      // バックエンドから返されたエラーを処理
      if (err.response?.data) {
        const backendErrors: {[key: string]: string} = {};
        const errorData = err.response.data;
        
        console.log('エラーデータ:', errorData);
        
        // 各フィールドのエラーを抽出
        Object.keys(errorData).forEach((key) => {
          if (Array.isArray(errorData[key])) {
            backendErrors[key] = errorData[key][0];
          } else if (typeof errorData[key] === 'string') {
            backendErrors[key] = errorData[key];
          }
        });

        // フィールド固有のエラーがある場合
        if (Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors);
        } else {
          // 一般的なエラーメッセージ
          setGeneralError('登録に失敗しました。入力内容を確認してください。');
        }
      } else if (err.request) {
        // リクエストは送信されたがレスポンスがない
        console.error('リクエストエラー:', err.request);
        setGeneralError('サーバーに接続できません。バックエンドが起動しているか確認してください。');
      } else {
        // リクエストの設定中にエラーが発生
        console.error('設定エラー:', err.message);
        setGeneralError(`エラー: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: 'var(--background)' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', color: 'var(--primary-color)' }}>
          新規登録
        </h1>

        {generalError && (
          <div style={{ 
            background: '#FFEBEE', 
            color: '#C62828', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem' 
          }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ユーザータイプ</label>
            <select
              className="form-select"
              value={formData.user_type}
              onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'adopter' | 'shelter' })}
              required
            >
              <option value="adopter">飼い主希望者</option>
              <option value="shelter">保護団体</option>
            </select>
            {errors.user_type && (
              <div style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.user_type}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">ユーザー名</label>
            <input
              type="text"
              className="form-input"
              style={errors.username ? { borderColor: '#C62828' } : {}}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            {errors.username && (
              <div style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              className="form-input"
              style={errors.email ? { borderColor: '#C62828' } : {}}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {errors.email && (
              <div style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">パスワード（8文字以上）</label>
            <input
              type="password"
              className="form-input"
              style={errors.password ? { borderColor: '#C62828' } : {}}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
            {errors.password && (
              <div style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.password}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">パスワード（確認）</label>
            <input
              type="password"
              className="form-input"
              style={errors.password_confirm ? { borderColor: '#C62828' } : {}}
              value={formData.password_confirm}
              onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
              required
              minLength={8}
            />
            {errors.password_confirm && (
              <div style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.password_confirm}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">電話番号</label>
            <input
              type="tel"
              className="form-input"
              style={errors.phone_number ? { borderColor: '#C62828' } : {}}
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            {errors.phone_number && (
              <div style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.phone_number}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">住所</label>
            <textarea
              className="form-textarea"
              rows={3}
              style={errors.address ? { borderColor: '#C62828' } : {}}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            {errors.address && (
              <div style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.address}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
