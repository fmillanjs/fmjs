export class CreateWorkspaceDto {
  name!: string;
  slug?: string; // Optional: auto-generated from name if not provided
}
