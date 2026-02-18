export class CreateCommentDto {
  content!: string;
  postId?: string;
  snippetId?: string;
  parentId?: string;
}
