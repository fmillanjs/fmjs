import { describe, it, expect } from 'vitest';
import { contactSchema } from '@/lib/validations/contact';

describe('Contact Form Validation', () => {
  it('should fail validation with empty data and return all field errors', () => {
    const result = contactSchema.safeParse({
      name: '',
      email: '',
      message: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toHaveLength(3);
      expect(result.error.errors.some(e => e.path[0] === 'name')).toBe(true);
      expect(result.error.errors.some(e => e.path[0] === 'email')).toBe(true);
      expect(result.error.errors.some(e => e.path[0] === 'message')).toBe(true);
    }
  });

  it('should fail validation when name is missing', () => {
    const result = contactSchema.safeParse({
      name: '',
      email: 'test@example.com',
      message: 'This is a valid message',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.errors.find(e => e.path[0] === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.message).toContain('at least 2 characters');
    }
  });

  it('should fail validation with invalid email format', () => {
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'invalid-email',
      message: 'This is a valid message',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.errors.find(e => e.path[0] === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.message).toContain('Invalid email');
    }
  });

  it('should fail validation when message is too short', () => {
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messageError = result.error.errors.find(e => e.path[0] === 'message');
      expect(messageError).toBeDefined();
      expect(messageError?.message).toContain('at least 10 characters');
    }
  });

  it('should pass validation with valid data', () => {
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'john.doe@example.com',
      message: 'This is a valid message with sufficient length',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john.doe@example.com');
      expect(result.data.message).toBe('This is a valid message with sufficient length');
    }
  });

  it('should fail validation when message exceeds 1000 characters', () => {
    const longMessage = 'a'.repeat(1001);
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'test@example.com',
      message: longMessage,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messageError = result.error.errors.find(e => e.path[0] === 'message');
      expect(messageError).toBeDefined();
      expect(messageError?.message).toContain('less than 1000 characters');
    }
  });

  it('should pass validation with message at exactly 1000 characters', () => {
    const maxMessage = 'a'.repeat(1000);
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'test@example.com',
      message: maxMessage,
    });

    expect(result.success).toBe(true);
  });

  it('should pass validation with message at exactly 10 characters', () => {
    const minMessage = 'a'.repeat(10);
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'test@example.com',
      message: minMessage,
    });

    expect(result.success).toBe(true);
  });
});
