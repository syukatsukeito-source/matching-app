import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { targetUserId, action } = await request.json();
    const { supabase, user } = await getAuthenticatedUser();

    const { error: reactionError } = await supabase.from('reactions').insert({
      from_user_id: user.id,
      to_user_id: targetUserId,
      action,
    });

    if (reactionError) {
      throw new Error(reactionError.message);
    }

    let matched = false;
    if (action === 'LIKE') {
      const { data: reciprocalLike } = await supabase
        .from('reactions')
        .select('*')
        .eq('from_user_id', targetUserId)
        .eq('to_user_id', user.id)
        .eq('action', 'LIKE')
        .single();

      if (reciprocalLike) {
        matched = true;
        const [userId1, userId2] = [user.id, targetUserId].sort();
        await supabase.from('matches').insert({
          user1_id: userId1,
          user2_id: userId2,
        });
      }
    }

    return NextResponse.json({
      result: {
        success: true,
        matched,
        targetUserId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'リアクション保存に失敗しました' },
      { status: 400 },
    );
  }
}
