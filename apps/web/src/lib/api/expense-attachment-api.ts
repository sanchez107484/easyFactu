import { apiClient } from '../api-client';
import { ExpenseAttachment } from '@easyfactura/shared-types';

export interface UploadAttachmentInput {
  file: File;
  expenseId?: string;
}

export const expenseAttachmentApi = {
  async upload(input: UploadAttachmentInput): Promise<ExpenseAttachment> {
    const formData = new FormData();
    formData.append('file', input.file);
    if (input.expenseId) {
      formData.append('expenseId', input.expenseId);
    }

    const response = await apiClient.post('/expense-attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async downloadUrl(id: string): Promise<string> {
    return `${process.env.NEXT_PUBLIC_API_URL}/expense-attachments/${id}/download`;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/expense-attachments/${id}`);
  },
};
