'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLocation } from '@/lib/supabase-api';
import { getMyProfile } from '@/lib/supabase-api';

export default function LocationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50); // デフォルト50km
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const profile = await getMyProfile();
      if (profile.maxDistanceKm) {
        setMaxDistance(profile.maxDistanceKm);
      }
      if (profile.latitude && profile.longitude) {
        setLocationEnabled(true);
        setCurrentLocation({ lat: profile.latitude, lng: profile.longitude });
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    }
  };

  const requestLocation = () => {
    setError('');
    setSuccess('');

    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報に対応していません');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        try {
          await updateLocation({
            latitude,
            longitude,
            maxDistanceKm: maxDistance,
          });
          setLocationEnabled(true);
          setSuccess('位置情報を更新しました');
        } catch (err: any) {
          setError(err.message || '位置情報の更新に失敗しました');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('位置情報の許可が拒否されました。ブラウザの設定を確認してください。');
        } else {
          setError('位置情報の取得に失敗しました');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleDistanceChange = async (newDistance: number) => {
    setMaxDistance(newDistance);
    
    if (locationEnabled && currentLocation) {
      try {
        await updateLocation({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          maxDistanceKm: newDistance,
        });
        setSuccess('検索範囲を更新しました');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.message || '更新に失敗しました');
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              marginRight: '12px',
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            📍 位置情報設定
          </h1>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#efe',
            color: '#3c3',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            {success}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            現在の状態
          </h2>
          <div style={{
            padding: '16px',
            background: locationEnabled ? '#e8f5e9' : '#fafafa',
            borderRadius: '8px',
            border: `2px solid ${locationEnabled ? '#4caf50' : '#ddd'}`,
          }}>
            {locationEnabled ? (
              <>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  ✅ 位置情報が有効です
                </div>
                {currentLocation && (
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    緯度: {currentLocation.lat.toFixed(6)}, 経度: {currentLocation.lng.toFixed(6)}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '16px' }}>
                ❌ 位置情報が無効です
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={requestLocation}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? '取得中...' : locationEnabled ? '📍 位置情報を更新' : '📍 位置情報を許可'}
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            検索範囲設定
          </h2>
          <div style={{
            padding: '20px',
            background: '#f5f5f5',
            borderRadius: '12px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>最大距離</span>
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#667eea',
              }}>
                {maxDistance} km
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={maxDistance}
              onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                outline: 'none',
                background: `linear-gradient(to right, #667eea 0%, #667eea ${maxDistance}%, #ddd ${maxDistance}%, #ddd 100%)`,
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: '#666',
            }}>
              <span>0 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: '#fff3cd',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#856404',
        }}>
          ℹ️ 位置情報は、あなたの検索範囲内にいる相手を見つけるために使用されます。相手も同様に位置情報を設定し、互いの検索範囲内にいる場合のみマッチング候補に表示されます。
        </div>
      </div>
    </div>
  );
}
