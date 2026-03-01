'use server';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function createLead(data: {
  name: string;
  companyName: string;
  companyUrl: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create lead: ${res.status} — ${text}`);
  }

  const result = await res.json();
  // Revalidate the leads page so the new row appears after redirect
  revalidatePath('/leads');
  return result;
}
