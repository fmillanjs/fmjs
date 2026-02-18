export class ToggleReactionDto {
  emoji!: string; // 'thumbs_up' | 'heart' | 'plus_one' | 'laugh'
  postId?: string;
  commentId?: string;
}
