-- 位置情報と距離設定を追加
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS max_distance_km INTEGER DEFAULT 50 CHECK (max_distance_km >= 0 AND max_distance_km <= 100),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- 位置情報のインデックス（PostGIS使用）
CREATE INDEX IF NOT EXISTS idx_user_profiles_location 
ON user_profiles USING gist (ll_to_earth(latitude, longitude));

-- コメント追加
COMMENT ON COLUMN user_profiles.latitude IS '現在地の緯度';
COMMENT ON COLUMN user_profiles.longitude IS '現在地の経度';
COMMENT ON COLUMN user_profiles.max_distance_km IS 'マッチング対象の最大距離（0-100km）';
COMMENT ON COLUMN user_profiles.location_updated_at IS '位置情報の最終更新日時';

-- 距離計算用の関数（Haversine公式）
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius CONSTANT DOUBLE PRECISION := 6371; -- 地球の半径（km）
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- 緯度・経度の差をラジアンに変換
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine公式
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  -- 距離を返す（km）
  RETURN earth_radius * c;
END;
$$;

COMMENT ON FUNCTION calculate_distance IS '2点間の距離を計算（Haversine公式、単位：km）';
